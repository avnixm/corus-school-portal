// path: lib/requirements/progress.ts

import "server-only";
import { getApplicableRequirements } from "./getApplicableRequirements";
import { getEnrollmentById } from "@/db/queries";
import type { ApplicableRequirement } from "./getApplicableRequirements";

export type RequirementProgress = {
  verifiedCount: number;
  requiredCount: number;
  blocking: { name: string; status: string }[];
};

/**
 * Returns progress for an enrollment: verified count, required count, and list of blocking items (missing or rejected).
 */
export async function computeRequirementProgress(
  enrollmentId: string
): Promise<RequirementProgress | null> {
  const enrollment = await getEnrollmentById(enrollmentId);
  if (!enrollment) return null;

  const applicable = await getApplicableRequirements({
    studentId: enrollment.studentId,
    enrollmentId,
    appliesTo: "enrollment",
    program: enrollment.program,
    yearLevel: enrollment.yearLevel,
    schoolYearId: enrollment.schoolYearId,
    termId: enrollment.termId,
  });

  const required = applicable.filter((a) => a.rule.isRequired);
  const verifiedCount = required.filter((a) => a.submission.status === "verified").length;
  const requiredCount = required.length;
  const blocking = required
    .filter(
      (a) =>
        a.submission.status === "missing" ||
        a.submission.status === "rejected" ||
        a.submission.status === "submitted"
    )
    .map((a) => ({ name: a.requirement.name, status: a.submission.status }));

  return { verifiedCount, requiredCount, blocking };
}

/**
 * Returns applicable requirements with status and files for an enrollment.
 */
export async function getApplicableRequirementsForEnrollment(
  enrollmentId: string
): Promise<ApplicableRequirement[]> {
  const enrollment = await getEnrollmentById(enrollmentId);
  if (!enrollment) return [];

  return getApplicableRequirements({
    studentId: enrollment.studentId,
    enrollmentId,
    appliesTo: "enrollment",
    program: enrollment.program,
    yearLevel: enrollment.yearLevel,
    schoolYearId: enrollment.schoolYearId,
    termId: enrollment.termId,
  });
}

/**
 * Ensures student_requirement_submissions rows exist for all requirements that apply to this enrollment.
 * Safe to call on every enrollment load; getOrCreateStudentRequirementSubmission is idempotent.
 */
export async function ensureEnrollmentRequirementSubmissions(
  enrollmentId: string
): Promise<void> {
  await getApplicableRequirementsForEnrollment(enrollmentId);
}

/**
 * Returns names of required forms that are still missing (no file submitted, not marked to follow).
 * Used to gate schedule/billing/grades for enrolled students who have not submitted required documents.
 */
export async function getEnrolledStudentMissingRequiredFormNames(
  enrollmentId: string
): Promise<string[]> {
  const applicable = await getApplicableRequirementsForEnrollment(enrollmentId);
  const required = applicable.filter((a) => a.rule.isRequired);
  const missing = required.filter(
    (a) =>
      a.submission.status === "missing" && !(a.submission.markAsToFollow ?? false)
  );
  return missing.map((a) => a.requirement.name);
}
