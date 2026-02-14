"use server";

import { revalidatePath } from "next/cache";
import {
  createEnrollment,
  getEnrollmentById,
  getProgramById,
  approveEnrollmentById,
  rejectEnrollmentById,
  updateEnrollmentSection,
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
  const sectionId = (formData.get("sectionId") as string)?.trim() || null;

  if (!studentId || !schoolYearId || !termId || !programId) {
    return { error: "Student, school year, term, and program are required" };
  }

  const programRow = await getProgramById(programId);
  if (!programRow) return { error: "Invalid program" };

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

  revalidatePath("/registrar/enrollments");
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

  revalidatePath("/registrar/enrollments");
  revalidatePath("/registrar/approvals");
  revalidatePath("/registrar");
  revalidatePath("/finance/assessments");
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

  revalidatePath("/registrar/enrollments");
  revalidatePath(`/registrar/students/${enrollment.studentId}`);
  return { success: true };
}
