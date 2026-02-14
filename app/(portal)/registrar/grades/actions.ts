// path: app/(portal)/registrar/grades/actions.ts
"use server";

import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import {
  returnGradeSubmission,
  approveGradeSubmission,
  releaseGradeSubmission,
  getGradeSubmissionById,
  insertAuditLog,
} from "@/db/queries";

export async function returnSubmissionAction(submissionId: string, remarks: string) {
  const user = await getCurrentUserWithRole();
  if (!user || (user.role !== "registrar" && user.role !== "admin"))
    return { error: "Unauthorized" };
  const sub = await getGradeSubmissionById(submissionId);
  if (!sub) return { error: "Submission not found" };
  if (sub.status !== "submitted") return { error: "Only submitted grades can be returned" };
  await returnGradeSubmission(submissionId, user.userId, remarks.trim() || "Please revise.");
  await insertAuditLog({
    actorUserId: user.userId,
    action: "GRADE_RETURN",
    entityType: "grade_submission",
    entityId: submissionId,
  });
  return { error: null };
}

export async function approveSubmissionAction(submissionId: string) {
  const user = await getCurrentUserWithRole();
  if (!user || (user.role !== "registrar" && user.role !== "admin"))
    return { error: "Unauthorized" };
  const sub = await getGradeSubmissionById(submissionId);
  if (!sub) return { error: "Submission not found" };
  if (sub.status !== "submitted") return { error: "Only submitted grades can be approved" };
  await approveGradeSubmission(submissionId, user.userId);
  await insertAuditLog({
    actorUserId: user.userId,
    action: "GRADE_APPROVE",
    entityType: "grade_submission",
    entityId: submissionId,
  });
  return { error: null };
}

export async function releaseSubmissionAction(submissionId: string) {
  const user = await getCurrentUserWithRole();
  if (!user || (user.role !== "registrar" && user.role !== "admin"))
    return { error: "Unauthorized" };
  const sub = await getGradeSubmissionById(submissionId);
  if (!sub) return { error: "Submission not found" };
  if (sub.status !== "approved") return { error: "Only approved grades can be released" };
  await releaseGradeSubmission(submissionId);
  await insertAuditLog({
    actorUserId: user.userId,
    action: "GRADE_RELEASE",
    entityType: "grade_submission",
    entityId: submissionId,
  });
  return { error: null };
}

export async function approveAndReleaseAction(submissionId: string) {
  const user = await getCurrentUserWithRole();
  if (!user || (user.role !== "registrar" && user.role !== "admin"))
    return { error: "Unauthorized" };
  const sub = await getGradeSubmissionById(submissionId);
  if (!sub) return { error: "Submission not found" };
  if (sub.status !== "submitted") return { error: "Only submitted grades can be approved and released" };
  await approveGradeSubmission(submissionId, user.userId);
  await releaseGradeSubmission(submissionId);
  await insertAuditLog({
    actorUserId: user.userId,
    action: "GRADE_RELEASE",
    entityType: "grade_submission",
    entityId: submissionId,
  });
  return { error: null };
}
