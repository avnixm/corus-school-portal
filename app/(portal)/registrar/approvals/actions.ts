"use server";

import { revalidatePath } from "next/cache";
import {
  approveEnrollmentById,
  rejectEnrollmentById,
  getEnrollmentById,
  insertAuditLog,
  createRequirementRequest,
  getRequirementSubmissionById,
} from "@/db/queries";
import { requireRole } from "@/lib/rbac";
import { getEnrollmentRequirementsSummary } from "@/lib/requirements/enrollmentSummary";

export type ApproveEnrollmentOptions = {
  remarks?: string;
  override?: boolean;
};

/** Canonical enrollment approval: updates status, writes enrollment_approvals, ensures enrollment_finance_status. */
export async function approveEnrollment(
  enrollmentId: string,
  options?: ApproveEnrollmentOptions
): Promise<{ success?: true; error?: string }> {
  const auth = await requireRole(["registrar", "admin"]);
  if ("error" in auth) return { error: auth.error };

  const enrollment = await getEnrollmentById(enrollmentId);
  if (!enrollment || enrollment.status !== "pending_approval") {
    return { error: "Enrollment not found or already processed" };
  }

  const override = options?.override === true;
  const remarks = options?.remarks?.trim();

  if (!override) {
    const summary = await getEnrollmentRequirementsSummary({
      studentId: enrollment.studentId,
      enrollmentId: enrollment.id,
      program: enrollment.program,
      yearLevel: enrollment.yearLevel,
      schoolYearId: enrollment.schoolYearId,
      termId: enrollment.termId,
    });
    if (summary.required > 0 && summary.verified < summary.required) {
      return {
        error:
          "Verify all required documents before approving enrollment. Use “Override and approve” with a reason if needed.",
      };
    }
  } else {
    if (!remarks) {
      return { error: "Override reason is required when approving without all documents verified." };
    }
  }

  await approveEnrollmentById(enrollmentId, auth.userId, remarks ?? undefined);
  await insertAuditLog({
    actorUserId: auth.userId,
    action: "ENROLLMENT_APPROVE",
    entityType: "enrollment",
    entityId: enrollmentId,
    after: override ? { override: true, remarks } : undefined,
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

/** Request that the student submit a requirement document (e.g. when marked "to follow" or missing). */
export async function createRequirementRequestAction(
  enrollmentId: string,
  submissionId: string,
  message?: string | null
): Promise<{ success?: true; error?: string }> {
  const auth = await requireRole(["registrar", "admin"]);
  if ("error" in auth) return { error: auth.error };

  const enrollment = await getEnrollmentById(enrollmentId);
  if (!enrollment) return { error: "Enrollment not found" };
  const submission = await getRequirementSubmissionById(submissionId);
  if (!submission || submission.enrollmentId !== enrollmentId) {
    return { error: "Submission not found or does not belong to this enrollment" };
  }

  await createRequirementRequest({
    enrollmentId,
    submissionId,
    requestedByUserId: auth.userId,
    message: message?.trim() || null,
  });
  revalidatePath("/registrar/approvals");
  revalidatePath(`/registrar/approvals/${enrollmentId}/review`);
  revalidatePath(`/registrar/students/${enrollment.studentId}`);
  revalidatePath("/student/enrollment");
  revalidatePath("/student/requirements");
  return { success: true };
}
