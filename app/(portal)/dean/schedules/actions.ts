"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import { approveSchedule, rejectSchedule } from "@/db/queries";

export async function approveScheduleAction(approvalId: string, remarks?: string) {
  const auth = await requireRole(["dean", "admin"]);
  if ("error" in auth) return { error: auth.error };

  await approveSchedule(approvalId, auth.userId, remarks);
  revalidatePath("/dean/schedules");
  revalidatePath("/dean/approvals");
  return { success: true };
}

export async function rejectScheduleAction(approvalId: string, remarks: string) {
  const auth = await requireRole(["dean", "admin"]);
  if ("error" in auth) return { error: auth.error };

  if (!remarks.trim()) {
    return { error: "Rejection reason is required" };
  }

  await rejectSchedule(approvalId, auth.userId, remarks);
  revalidatePath("/dean/schedules");
  revalidatePath("/dean/approvals");
  return { success: true };
}
