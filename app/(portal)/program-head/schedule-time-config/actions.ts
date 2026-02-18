"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import { createScheduleTimeConfig, submitScheduleTimeConfig } from "@/db/queries";

export async function createScheduleTimeConfigAction(formData: FormData) {
  const auth = await requireRole(["program_head", "admin"]);
  if ("error" in auth) return { error: auth.error };

  const programId = formData.get("programId") as string;
  const title = (formData.get("title") as string)?.trim();
  const startHour = parseInt(formData.get("startHour") as string, 10);
  const endHour = parseInt(formData.get("endHour") as string, 10);
  const timeIncrement = parseInt(formData.get("timeIncrement") as string, 10);

  if (!programId || !title) {
    return { error: "Program and title are required" };
  }

  if (isNaN(startHour) || isNaN(endHour) || startHour >= endHour) {
    return { error: "Invalid time range" };
  }

  if (isNaN(timeIncrement) || timeIncrement < 1) {
    return { error: "Invalid time increment" };
  }

  await createScheduleTimeConfig({
    programId,
    title,
    startHour,
    endHour,
    timeIncrement,
    createdByUserId: auth.userId,
  });

  revalidatePath("/program-head/schedule-time-config");
  return { success: true };
}

export async function submitScheduleTimeConfigAction(configId: string) {
  const auth = await requireRole(["program_head", "admin"]);
  if ("error" in auth) return { error: auth.error };

  await submitScheduleTimeConfig(configId);
  revalidatePath("/program-head/schedule-time-config");
  revalidatePath("/dean/schedule-time-config");
  return { success: true };
}
