"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/db/cache";
import {
  createEnrollment,
  getEnrollmentById,
  getProgramById,
  approveEnrollmentById,
  rejectEnrollmentById,
  updateEnrollmentSection,
  pickBalancedSectionForEnrollment,
} from "@/db/queries";
import { requireRole } from "@/lib/rbac";
import { finalizeEnrollmentClasses } from "@/lib/enrollment/finalizeEnrollmentClasses";

export async function createEnrollmentAction(formData: FormData) {
  const auth = await requireRole(["registrar", "admin"]);
  if ("error" in auth) return { error: auth.error };

  const studentId = (formData.get("studentId") as string)?.trim();
  const schoolYearId = (formData.get("schoolYearId") as string)?.trim();
  const termId = (formData.get("termId") as string)?.trim();
  const programId = (formData.get("programId") as string)?.trim();
  const yearLevel = (formData.get("yearLevel") as string)?.trim() || null;
  let sectionId = (formData.get("sectionId") as string)?.trim() || null;

  if (!studentId || !schoolYearId || !termId || !programId) {
    return { error: "Student, school year, term, and program are required" };
  }

  const programRow = await getProgramById(programId);
  if (!programRow) return { error: "Invalid program" };

  // If registrar didn't pick a specific block/section, auto-assign one
  // based on program + year level + school year + term, keeping blocks balanced.
  if (!sectionId && yearLevel) {
    sectionId =
      (await pickBalancedSectionForEnrollment({
        programId,
        yearLevel,
        schoolYearId,
        termId,
      })) ?? null;
  }

  try {
    await createEnrollment({
      studentId,
      schoolYearId,
      termId,
      programId,
      program: programRow.code,
      yearLevel,
      sectionId: sectionId || null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create enrollment";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return { error: "Student already has an enrollment for this school year and term" };
    }
    return { error: msg };
  }

  revalidatePath("/registrar/records/enrollments");
  revalidatePath("/registrar/records");
  revalidatePath("/registrar");
  revalidatePath(`/registrar/students/${studentId}`);
  return { success: true };
}

/**
 * Updates enrollment status. For approved/rejected, delegates to the canonical
 * flow (approveEnrollmentById / rejectEnrollmentById) so enrollment_approvals
 * and enrollment_finance_status stay in sync. Prefer the approvals page and
 * approveEnrollment / rejectEnrollment actions when possible.
 */
export async function updateEnrollmentStatus(
  enrollmentId: string,
  status: "approved" | "rejected"
) {
  const auth = await requireRole(["registrar", "admin"]);
  if ("error" in auth) return { error: auth.error };

  const enrollment = await getEnrollmentById(enrollmentId);
  if (!enrollment) return { error: "Enrollment not found" };
  if (enrollment.status !== "pending_approval") {
    return { error: "Enrollment not found or already processed" };
  }

  if (status === "approved") {
    await approveEnrollmentById(enrollmentId, auth.userId);
  } else {
    await rejectEnrollmentById(enrollmentId, auth.userId);
  }

  revalidatePath("/registrar/records/enrollments");
  revalidatePath("/registrar/records");
  revalidatePath("/registrar/approvals");
  revalidatePath("/registrar");
  revalidatePath("/finance/assessments");
  revalidateTag(CACHE_TAGS.registrarApprovals, "max");
  revalidateTag(CACHE_TAGS.enrollment(enrollmentId), "max");
  revalidateTag(CACHE_TAGS.studentDashboard(enrollment.studentId), "max");
  revalidateTag(CACHE_TAGS.finance(enrollmentId), "max");
  return { success: true };
}

/** Assign section to an enrollment (e.g. already approved). Finalizes class enrollments when section has schedules. */
export async function assignSectionToEnrollmentAction(
  enrollmentId: string,
  sectionId: string | null
) {
  const auth = await requireRole(["registrar", "admin"]);
  if ("error" in auth) return { error: auth.error };

  const enrollment = await getEnrollmentById(enrollmentId);
  if (!enrollment) return { error: "Enrollment not found" };

  await updateEnrollmentSection(enrollmentId, sectionId);
  if (enrollment.status === "approved" || enrollment.status === "enrolled") {
    await finalizeEnrollmentClasses(enrollmentId);
  }

  revalidatePath("/registrar/records/enrollments");
  revalidatePath("/registrar/records");
  revalidatePath(`/registrar/students/${enrollment.studentId}`);
  return { success: true };
}
