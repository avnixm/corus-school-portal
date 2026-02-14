"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import { getUserProfileByUserId } from "@/db/queries";
import {
  getSystemSetting,
  upsertSystemSetting,
  insertAuditLog,
} from "@/db/queries";

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
