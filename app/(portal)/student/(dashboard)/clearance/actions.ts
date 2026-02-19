"use server";

import { revalidatePath } from "next/cache";
import { getCurrentStudent } from "@/lib/auth/getCurrentStudent";
import { getOrCreateClearanceRequest } from "@/lib/clearance/queries";
import { getEnrollmentById } from "@/db/queries";

export async function getOrCreateClearanceRequestAction(enrollmentId: string, periodId: string) {
  const current = await getCurrentStudent();
  if (!current) return { error: "Unauthorized" as const };

  const enrollment = await getEnrollmentById(enrollmentId);
  if (!enrollment || enrollment.studentId !== current.studentId)
    return { error: "Enrollment not found or access denied" as const };

  const result = await getOrCreateClearanceRequest(
    enrollmentId,
    periodId,
    current.profile.userId ?? undefined
  );
  if (!result) return { error: "Failed to get or create clearance" as const };

  revalidatePath("/student/clearance");
  revalidatePath(`/student/clearance/${periodId}/print`);
  return { data: result };
}
