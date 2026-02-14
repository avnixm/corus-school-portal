"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import { getUserProfileByUserId } from "@/db/queries";
import { approveEnrollmentById, rejectEnrollmentById, getEnrollmentById } from "@/db/queries";
export async function approveEnrollment(enrollmentId: string, remarks?: string) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await getUserProfileByUserId(session.user.id);
  if (!profile || (profile.role !== "registrar" && profile.role !== "admin")) {
    return { error: "Unauthorized" };
  }

  const enrollment = await getEnrollmentById(enrollmentId);
  if (!enrollment || enrollment.status !== "pending_approval") {
    return { error: "Enrollment not found or already processed" };
  }

  await approveEnrollmentById(enrollmentId, session.user.id, remarks);
  revalidatePath("/registrar");
  revalidatePath("/registrar/approvals");
  revalidatePath("/finance/assessments");
  return { success: true };
}

export async function rejectEnrollment(enrollmentId: string, remarks?: string) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await getUserProfileByUserId(session.user.id);
  if (!profile || (profile.role !== "registrar" && profile.role !== "admin")) {
    return { error: "Unauthorized" };
  }

  const enrollment = await getEnrollmentById(enrollmentId);
  if (!enrollment || enrollment.status !== "pending_approval") {
    return { error: "Enrollment not found or already processed" };
  }

  await rejectEnrollmentById(enrollmentId, session.user.id, remarks);
  revalidatePath("/registrar");
  revalidatePath("/registrar/approvals");
  return { success: true };
}
