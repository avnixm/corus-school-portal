"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import { getProfileAndStudentByUserId } from "@/db/queries";
import {
  getActiveSchoolYear,
  getActiveTerm,
  getEnrollmentForStudentActiveTerm,
  getEnrollmentById,
  insertDraftEnrollment,
  updateDraftEnrollment,
  setEnrollmentPendingApproval,
  setEnrollmentCancelled,
  resetRejectedEnrollmentToDraft,
} from "@/db/queries";
import { getApplicableRequirements } from "@/lib/requirements/getApplicableRequirements";
import { getEnrollmentRequirementsPolicy } from "@/lib/requirements/policy";
import { ensureEnrollmentRequirementSubmissions } from "@/lib/requirements/progress";
import { insertAuditLog } from "@/db/queries";

export type EnrollmentActionResult = { error?: string; enrollmentId?: string };

export async function createOrUpdateDraftEnrollment(formData: FormData): Promise<EnrollmentActionResult> {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await getProfileAndStudentByUserId(session.user.id);
  if (!profile?.student) return { error: "Student profile required" };

  const sy = await getActiveSchoolYear();
  const term = await getActiveTerm();
  if (!sy || !term) return { error: "No active school year or term set" };

  const programId = (formData.get("programId") as string)?.trim();
  const program = (formData.get("program") as string)?.trim() || null;
  const yearLevel = (formData.get("yearLevel") as string)?.trim() || null;
  const sectionId = (formData.get("sectionId") as string)?.trim() || null;

  if (!programId) return { error: "Program is required" };
  if (!yearLevel) return { error: "Year level is required" };

  const existing = await getEnrollmentForStudentActiveTerm(profile.student.id);

  if (existing) {
    if (existing.status !== "preregistered") {
      return { error: "Enrollment already submitted or processed. You cannot edit it." };
    }
    const id = await updateDraftEnrollment(existing.id, profile.student.id, {
      programId,
      program,
      yearLevel,
      sectionId: sectionId || null,
    });
    if (!id) return { error: "Failed to update draft" };
    revalidatePath("/student/enrollment");
    revalidatePath("/student");
    return { enrollmentId: existing.id };
  }

  const row = await insertDraftEnrollment({
    studentId: profile.student.id,
    schoolYearId: sy.id,
    termId: term.id,
    programId,
    program,
    yearLevel,
    sectionId: sectionId || null,
  });
  if (!row) return { error: "Failed to create enrollment (duplicate or conflict)" };

  await ensureEnrollmentRequirementSubmissions(row.id);
  revalidatePath("/student/enrollment");
  revalidatePath("/student");
  return { enrollmentId: row.id };
}

export async function submitEnrollment(enrollmentId: string): Promise<EnrollmentActionResult> {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await getProfileAndStudentByUserId(session.user.id);
  if (!profile?.student) return { error: "Student profile required" };

  const enrollment = await getEnrollmentById(enrollmentId);
  if (!enrollment || enrollment.studentId !== profile.student.id) {
    return { error: "Enrollment not found or access denied" };
  }
  if (enrollment.status !== "preregistered") {
    return { error: "Only draft enrollments can be submitted" };
  }

  await ensureEnrollmentRequirementSubmissions(enrollmentId);
  const applicable = await getApplicableRequirements({
    studentId: profile.student.id,
    enrollmentId,
    appliesTo: "enrollment",
    program: enrollment.program,
    yearLevel: enrollment.yearLevel,
    schoolYearId: enrollment.schoolYearId,
    termId: enrollment.termId,
  });
  const policy = await getEnrollmentRequirementsPolicy(applicable);
  if (!policy.canSubmit) {
    return {
      error: policy.message ?? "Complete required forms before submitting enrollment.",
    };
  }

  await setEnrollmentPendingApproval(enrollmentId);
  await insertAuditLog({
    actorUserId: session.user.id,
    action: "enrollment_submit",
    entityType: "enrollment",
    entityId: enrollmentId,
    after: { status: "pending_approval" },
  });

  revalidatePath("/student/enrollment");
  revalidatePath("/student");
  return { enrollmentId };
}

export async function cancelEnrollment(enrollmentId: string): Promise<EnrollmentActionResult> {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await getProfileAndStudentByUserId(session.user.id);
  if (!profile?.student) return { error: "Student profile required" };

  const enrollment = await getEnrollmentById(enrollmentId);
  if (!enrollment || enrollment.studentId !== profile.student.id) {
    return { error: "Enrollment not found or access denied" };
  }
  if (enrollment.status !== "preregistered" && enrollment.status !== "pending_approval") {
    return { error: "Only draft or pending enrollments can be cancelled" };
  }

  await setEnrollmentCancelled(enrollmentId);
  await insertAuditLog({
    actorUserId: session.user.id,
    action: "enrollment_cancel",
    entityType: "enrollment",
    entityId: enrollmentId,
    after: { status: "cancelled" },
  });

  revalidatePath("/student/enrollment");
  revalidatePath("/student");
  return { enrollmentId };
}

export async function startNewEnrollment(enrollmentId: string): Promise<EnrollmentActionResult> {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await getProfileAndStudentByUserId(session.user.id);
  if (!profile?.student) return { error: "Student profile required" };

  const enrollment = await getEnrollmentById(enrollmentId);
  if (!enrollment || enrollment.studentId !== profile.student.id) {
    return { error: "Enrollment not found or access denied" };
  }
  if (enrollment.status !== "rejected") {
    return { error: "Only rejected enrollments can be restarted" };
  }

  const ok = await resetRejectedEnrollmentToDraft(enrollmentId);
  if (!ok) return { error: "Could not reset enrollment" };

  await insertAuditLog({
    actorUserId: session.user.id,
    action: "enrollment_restart_from_rejected",
    entityType: "enrollment",
    entityId: enrollmentId,
    after: { status: "preregistered" },
  });

  revalidatePath("/student/enrollment");
  revalidatePath("/student");
  return { enrollmentId };
}
