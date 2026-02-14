"use server";

import { revalidatePath } from "next/cache";
import {
  approveEnrollmentById,
  rejectEnrollmentById,
  getEnrollmentById,
  insertAuditLog,
} from "@/db/queries";
import { requireRole } from "@/lib/rbac";

/** Canonical enrollment approval: updates status, writes enrollment_approvals, ensures enrollment_finance_status. */
export async function approveEnrollment(enrollmentId: string, remarks?: string) {
  const auth = await requireRole(["registrar", "admin"]);
  if ("error" in auth) return { error: auth.error };

  const enrollment = await getEnrollmentById(enrollmentId);
  if (!enrollment || enrollment.status !== "pending_approval") {
    return { error: "Enrollment not found or already processed" };
  }

  await approveEnrollmentById(enrollmentId, auth.userId, remarks);
  await insertAuditLog({
    actorUserId: auth.userId,
    action: "ENROLLMENT_APPROVE",
    entityType: "enrollment",
    entityId: enrollmentId,
  });
  revalidatePath("/registrar");
  revalidatePath("/registrar/approvals");
  revalidatePath("/finance/assessments");
  return { success: true };
}

export async function rejectEnrollment(enrollmentId: string, remarks?: string): Promise<{ success?: true; error?: string }> {
  const auth = await requireRole(["registrar", "admin"]);
  if ("error" in auth) return { error: auth.error };

  const enrollment = await getEnrollmentById(enrollmentId);
  if (!enrollment || enrollment.status !== "pending_approval") {
    return { error: "Enrollment not found or already processed" };
  }

  await rejectEnrollmentById(enrollmentId, auth.userId, remarks?.trim() || undefined);
  revalidatePath("/registrar");
  revalidatePath("/registrar/approvals");
  revalidatePath("/student/enrollment");
  return { success: true };
}
