"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import { getProfileAndStudentByUserId } from "@/db/queries";
import {
  getRequirementSubmissionById,
  updateStudentRequirementSubmission,
  setSubmissionMarkAsToFollow,
  getRequirementFilesBySubmissionId,
  deleteRequirementFile,
  insertRequirementFile,
  getPendingRequirementRequestsBySubmissionId,
  markRequirementRequestFulfilled,
} from "@/db/queries";
import { insertAuditLog } from "@/db/queries";

export async function createOrUpdateSubmission(enrollmentId: string | null, requirementId: string) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };
  const profile = await getProfileAndStudentByUserId(session.user.id);
  if (!profile?.student) return { error: "Student profile required" };
  const { getOrCreateStudentRequirementSubmission } = await import("@/db/queries");
  await getOrCreateStudentRequirementSubmission(profile.student.id, enrollmentId, requirementId);
  revalidatePath("/student/requirements");
  revalidatePath("/student/enrollment");
  revalidatePath("/student");
  return { success: true };
}

export async function attachFileToSubmission(
  submissionId: string,
  fileMeta: { fileName: string; fileType: string; fileSize: number; storageKey: string; url?: string | null }
) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };
  const profile = await getProfileAndStudentByUserId(session.user.id);
  if (!profile?.student) return { error: "Student profile required" };
  const submission = await getRequirementSubmissionById(submissionId);
  if (!submission || submission.studentId !== profile.student.id) return { error: "Forbidden" };
  if (submission.status === "verified") return { error: "Cannot add files to verified submission" };
  await insertRequirementFile({
    submissionId,
    fileName: fileMeta.fileName,
    fileType: fileMeta.fileType,
    fileSize: fileMeta.fileSize,
    storageKey: fileMeta.storageKey,
    url: fileMeta.url ?? null,
  });
  revalidatePath("/student/requirements");
  revalidatePath("/student/enrollment");
  return { success: true };
}

export async function removeFile(fileId: string) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };
  const profile = await getProfileAndStudentByUserId(session.user.id);
  if (!profile?.student) return { error: "Student profile required" };
  const { requirementFiles, studentRequirementSubmissions } = await import("@/db/schema");
  const { db } = await import("@/lib/db");
  const { eq, and } = await import("drizzle-orm");
  const files = await db
    .select({ id: requirementFiles.id, submissionId: requirementFiles.submissionId })
    .from(requirementFiles)
    .innerJoin(
      studentRequirementSubmissions,
      eq(requirementFiles.submissionId, studentRequirementSubmissions.id)
    )
    .where(
      and(
        eq(requirementFiles.id, fileId),
        eq(studentRequirementSubmissions.studentId, profile.student.id)
      )
    )
    .limit(1);
  const row = files[0];
  if (!row) return { error: "Forbidden" };
  const sub = await getRequirementSubmissionById(row.submissionId);
  if (sub?.status === "verified") return { error: "Cannot remove file from verified submission" };
  await deleteRequirementFile(fileId);
  revalidatePath("/student/requirements");
  revalidatePath("/student/enrollment");
  return { success: true };
}

export async function markAsToFollowAction(submissionId: string, markAsToFollow: boolean) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };
  const profile = await getProfileAndStudentByUserId(session.user.id);
  if (!profile?.student) return { error: "Student profile required" };
  const submission = await getRequirementSubmissionById(submissionId);
  if (!submission || submission.studentId !== profile.student.id) return { error: "Forbidden" };
  if (submission.status === "verified") return { error: "Cannot change to-follow for verified submission" };
  await setSubmissionMarkAsToFollow(submissionId, markAsToFollow);
  revalidatePath("/student/requirements");
  revalidatePath("/student/enrollment");
  revalidatePath("/student");
  return { success: true };
}

export async function submitRequirement(submissionId: string) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };
  const profile = await getProfileAndStudentByUserId(session.user.id);
  if (!profile?.student) return { error: "Student profile required" };
  const submission = await getRequirementSubmissionById(submissionId);
  if (!submission || submission.studentId !== profile.student.id) return { error: "Forbidden" };
  const files = await getRequirementFilesBySubmissionId(submissionId);
  if (files.length === 0) return { error: "Add at least one file before submitting" };
  await updateStudentRequirementSubmission(submissionId, {
    status: "submitted",
    submittedAt: new Date(),
    markAsToFollow: false,
  });
  const pendingRequests = await getPendingRequirementRequestsBySubmissionId(submissionId);
  for (const req of pendingRequests) {
    await markRequirementRequestFulfilled(req.id);
  }
  await insertAuditLog({
    actorUserId: session.user.id,
    action: "requirement_submit",
    entityType: "student_requirement_submission",
    entityId: submissionId,
    after: { status: "submitted" },
  });
  revalidatePath("/student/requirements");
  revalidatePath("/student/enrollment");
  revalidatePath("/student");
  return { success: true };
}

/** Alias: remove requirement file (only when status !== verified). */
export const removeRequirementFile = removeFile;

export async function resubmitRequirement(submissionId: string) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };
  const profile = await getProfileAndStudentByUserId(session.user.id);
  if (!profile?.student) return { error: "Student profile required" };
  const submission = await getRequirementSubmissionById(submissionId);
  if (!submission || submission.studentId !== profile.student.id) return { error: "Forbidden" };
  await updateStudentRequirementSubmission(submissionId, {
    status: "submitted",
    submittedAt: new Date(),
    registrarRemarks: null,
  });
  await insertAuditLog({
    actorUserId: session.user.id,
    action: "requirement_resubmit",
    entityType: "student_requirement_submission",
    entityId: submissionId,
    after: { status: "submitted" },
  });
  revalidatePath("/student/requirements");
  revalidatePath("/student/enrollment");
  revalidatePath("/student");
  return { success: true };
}
