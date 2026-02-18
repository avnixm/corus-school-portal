"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import { getUserProfileByUserId } from "@/db/queries";
import {
  getSystemSetting,
  upsertSystemSetting,
  insertAuditLog,
  getGradingPeriodsBySchoolYearTerm,
} from "@/db/queries";
import { db } from "@/lib/db";
import { gradingPeriods } from "@/db/schema";
import { and, eq } from "drizzle-orm";

async function requireAdmin() {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" as const, userId: null };
  const profile = await getUserProfileByUserId(session.user.id);
  if (!profile || profile.role !== "admin") {
    return { error: "Unauthorized" as const, userId: null };
  }
  return { error: null as null, userId: session.user.id };
}

const SAFE_KEYS = new Set([
  "active_school_year_id",
  "active_term_id",
  "pass_threshold",
  "max_section_size",
  "grading_period_names",
]);

export async function upsertSettingAction(key: string, valueJson: unknown) {
  const { error, userId } = await requireAdmin();
  if (error) return { error };
  if (!SAFE_KEYS.has(key)) return { error: "Invalid settings key" };

  const before = await getSystemSetting(key);
  const beforeVal = before?.value ?? null;

  await upsertSystemSetting({
    key,
    value: valueJson,
    updatedByUserId: userId,
  });

  await insertAuditLog({
    actorUserId: userId,
    action: "SETTINGS_UPDATE",
    entityType: "system_settings",
    entityId: key,
    before: beforeVal as Record<string, unknown>,
    after: valueJson as Record<string, unknown>,
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  return { success: true };
}

type GradingPeriodInput = { name: string; sort_order: number };

/** Saves all settings and syncs grading periods to the database for the active term. */
export async function saveSettingsAction(params: {
  activeSchoolYearId: string;
  activeTermId: string;
  passThreshold: number;
  maxSectionSize: number;
  gradingPeriods: GradingPeriodInput[];
}) {
  const { error, userId } = await requireAdmin();
  if (error) return { error };

  const { activeSchoolYearId, activeTermId, passThreshold, maxSectionSize, gradingPeriods: periods } = params;

  const beforeSy = await getSystemSetting("active_school_year_id");
  const beforeTerm = await getSystemSetting("active_term_id");

  await upsertSystemSetting({
    key: "active_school_year_id",
    value: activeSchoolYearId || null,
    updatedByUserId: userId,
  });
  await upsertSystemSetting({
    key: "active_term_id",
    value: activeTermId || null,
    updatedByUserId: userId,
  });
  await upsertSystemSetting({
    key: "pass_threshold",
    value: passThreshold,
    updatedByUserId: userId,
  });
  await upsertSystemSetting({
    key: "max_section_size",
    value: maxSectionSize,
    updatedByUserId: userId,
  });
  await upsertSystemSetting({
    key: "grading_period_names",
    value: periods,
    updatedByUserId: userId,
  });

  if (activeSchoolYearId && activeTermId && periods.length > 0) {
    const validPeriods = periods.filter((p) => p?.name?.trim());
    if (validPeriods.length > 0) {
      const existing = await getGradingPeriodsBySchoolYearTerm(activeSchoolYearId, activeTermId);
      const existingNames = new Set(existing.map((p) => p.name));

      for (const p of validPeriods) {
        const name = p.name.trim();
        const sortOrder = typeof p.sort_order === "number" ? p.sort_order : 0;
        if (existingNames.has(name)) {
          await db
            .update(gradingPeriods)
            .set({ sortOrder, isActive: true, updatedAt: new Date() })
            .where(
              and(
                eq(gradingPeriods.schoolYearId, activeSchoolYearId),
                eq(gradingPeriods.termId, activeTermId),
                eq(gradingPeriods.name, name)
              )
            );
        } else {
          await db.insert(gradingPeriods).values({
            schoolYearId: activeSchoolYearId,
            termId: activeTermId,
            name,
            sortOrder,
            isActive: true,
          });
        }
      }

      const configNames = new Set(validPeriods.map((p) => p.name.trim()));
      for (const p of existing) {
        if (!configNames.has(p.name)) {
          await db
            .update(gradingPeriods)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(gradingPeriods.id, p.id));
        }
      }
    }
  }

  await insertAuditLog({
    actorUserId: userId,
    action: "SETTINGS_UPDATE",
    entityType: "system_settings",
    entityId: "save_all",
    before: { activeSchoolYearId: beforeSy?.value, activeTermId: beforeTerm?.value } as Record<string, unknown>,
    after: params as unknown as Record<string, unknown>,
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  revalidatePath("/admin/tools");
  return { success: true };
}

/** Fetches grading periods for a term (for form refetch when sy/term changes). */
export async function fetchGradingPeriodsForTermAction(schoolYearId: string, termId: string) {
  const { error } = await requireAdmin();
  if (error) return { error, periods: [] as GradingPeriodInput[] };
  if (!schoolYearId || !termId) return { error: null, periods: [] };
  const rows = await getGradingPeriodsBySchoolYearTerm(schoolYearId, termId);
  return {
    error: null,
    periods: rows.map((p) => ({ name: p.name, sort_order: p.sortOrder })),
  };
}
