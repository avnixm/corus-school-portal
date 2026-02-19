"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import { approveScheduleTimeConfig, rejectScheduleTimeConfig } from "@/db/queries";

export async function approveScheduleTimeConfigAction(configId: string) {
  const auth = await requireRole(["dean", "admin"]);
  if ("error" in auth) return { error: auth.error };

  await approveScheduleTimeConfig(configId, auth.userId);
  revalidatePath("/dean/schedule-time-config");
  revalidatePath("/dean/approvals");
  return { success: true };
}

export async function rejectScheduleTimeConfigAction(configId: string, remarks: string) {
  const auth = await requireRole(["dean", "admin"]);
  if ("error" in auth) return { error: auth.error };

  await rejectScheduleTimeConfig(configId, auth.userId, remarks);
  revalidatePath("/dean/schedule-time-config");
  revalidatePath("/dean/approvals");
  return { success: true };
}
