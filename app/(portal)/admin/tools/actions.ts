"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import { getUserProfileByUserId } from "@/db/queries";
import { getSystemSetting, insertAuditLog } from "@/db/queries";
import { getSchoolYearsList, getTermsList, getGradingPeriodsBySchoolYearTerm } from "@/db/queries";
import { db } from "@/lib/db";
import { gradingPeriods, feeItems } from "@/db/schema";

async function requireAdmin() {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" as const, userId: null };
  const profile = await getUserProfileByUserId(session.user.id);
  if (!profile || profile.role !== "admin") {
    return { error: "Unauthorized" as const, userId: null };
  }
  return { error: null as null, userId: session.user.id };
}

async function logToolRun(userId: string, toolName: string, params: unknown) {
  await insertAuditLog({
    actorUserId: userId,
    action: "DATA_TOOL_RUN",
    entityType: "system",
    after: { tool: toolName, params },
  });
}

function getSettingValueStr(row: { value: unknown } | null): string | null {
  if (!row?.value) return null;
  if (typeof row.value === "string") return row.value;
  const v = (row.value as Record<string, unknown>)?.value;
  return v != null ? String(v) : null;
}

export async function createDefaultGradingPeriodsAction() {
  const { error, userId } = await requireAdmin();
  if (error) return { error };

  const sySetting = await getSystemSetting("active_school_year_id");
  const termSetting = await getSystemSetting("active_term_id");
  const syId = getSettingValueStr(sySetting);
  const termId = getSettingValueStr(termSetting);

  if (!syId || !termId) {
    return { error: "Set active school year and term in Settings first" };
  }

  const existing = await getGradingPeriodsBySchoolYearTerm(syId, termId);
  if (existing.length > 0) {
    await logToolRun(userId, "createDefaultGradingPeriods", { syId, termId, skipped: "already exist" });
    revalidatePath("/admin/tools");
    return { success: true, message: "Grading periods already exist for this term" };
  }

  const defaultNames = [
    { name: "Prelim", sortOrder: 1 },
    { name: "Midterm", sortOrder: 2 },
    { name: "Final", sortOrder: 3 },
  ];

  for (const p of defaultNames) {
    await db.insert(gradingPeriods).values({
      schoolYearId: syId,
      termId,
      name: p.name,
      sortOrder: p.sortOrder,
      isActive: true,
    });
  }

  await logToolRun(userId, "createDefaultGradingPeriods", { syId, termId });
  revalidatePath("/admin/tools");
  return { success: true, message: "Created default grading periods" };
}

export async function createDefaultFeeItemsAction() {
  const { error, userId } = await requireAdmin();
  if (error) return { error };

  const existing = await db.select().from(feeItems).limit(1);
  if (existing.length > 0) {
    await logToolRun(userId, "createDefaultFeeItems", { skipped: "already exist" });
    revalidatePath("/admin/tools");
    return { success: true, message: "Fee items already exist" };
  }

  const defaults = [
    { code: "TUITION", name: "Tuition", category: "tuition" as const },
    { code: "MISC", name: "Miscellaneous", category: "misc" as const },
  ];

  for (const f of defaults) {
    await db.insert(feeItems).values({
      code: f.code,
      name: f.name,
      category: f.category,
      active: true,
    });
  }

  await logToolRun(userId, "createDefaultFeeItems", {});
  revalidatePath("/admin/tools");
  return { success: true, message: "Created default fee items" };
}

export async function recomputeEnrollmentBalancesAction() {
  const { error, userId } = await requireAdmin();
  if (error) return { error };

  const { getEnrollmentsList } = await import("@/db/queries");
  const { recomputeEnrollmentBalance } = await import("@/lib/finance/recomputeEnrollmentBalance");

  const enrollments = await getEnrollmentsList();
  let count = 0;
  for (const e of enrollments) {
    await recomputeEnrollmentBalance(e.id, userId);
    count++;
  }

  await logToolRun(userId, "recomputeEnrollmentBalances", { count });
  revalidatePath("/admin/tools");
  return { success: true, message: `Recomputed ${count} enrollment balance(s)` };
}

export async function placeholderImportAction() {
  const { error, userId } = await requireAdmin();
  if (error) return { error };

  await logToolRun(userId, "placeholderImport", { note: "CSV import stub – no parsing" });
  revalidatePath("/admin/tools");
  return { success: true, message: "Placeholder import logged (no data imported)" };
}
