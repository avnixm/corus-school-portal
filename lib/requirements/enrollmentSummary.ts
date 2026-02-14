import "server-only";
import { getApplicableRequirements } from "./getApplicableRequirements";
import type { ApplicableRequirement } from "./getApplicableRequirements";

export type EnrollmentRequirementsSummary = {
  required: number;
  verified: number;
  missingNames: string[];
  unverifiedNames: string[];
};

export async function getEnrollmentRequirementsSummary(params: {
  studentId: string;
  enrollmentId: string;
  program: string | null;
  yearLevel: string | null;
  schoolYearId: string;
  termId: string;
}): Promise<EnrollmentRequirementsSummary> {
  const applicable = await getApplicableRequirements({
    studentId: params.studentId,
    enrollmentId: params.enrollmentId,
    appliesTo: "enrollment",
    program: params.program,
    yearLevel: params.yearLevel,
    schoolYearId: params.schoolYearId,
    termId: params.termId,
  });
  const required = applicable.filter((a) => a.rule.isRequired);
  const verified = required.filter((a) => a.submission.status === "verified");
  const missing = required.filter((a) => a.submission.status === "missing");
  const unverified = required.filter(
    (a) => a.submission.status === "submitted" || a.submission.status === "rejected"
  );
  return {
    required: required.length,
    verified: verified.length,
    missingNames: missing.map((a) => a.requirement.name),
    unverifiedNames: unverified.map((a) => a.requirement.name),
  };
}
