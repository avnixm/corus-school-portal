import "server-only";
import { getSystemSetting } from "@/db/queries";
import type { ApplicableRequirement } from "./getApplicableRequirements";

export type EnrollmentSubmitPolicy = {
  canSubmit: boolean;
  requireVerified: boolean;
  requireSubmitted: boolean;
  missingRequired: ApplicableRequirement[];
  unverifiedRequired: ApplicableRequirement[];
  message?: string;
};

export async function getEnrollmentRequirementsPolicy(
  applicable: ApplicableRequirement[]
): Promise<EnrollmentSubmitPolicy> {
  const requireVerified =
    (await getSystemSetting("enrollment_requires_verified_requirements"))?.value === true;
  const requireSubmitted =
    (await getSystemSetting("enrollment_requires_submitted_requirements"))?.value !== false;
  const allowSubmitBeforeRequirements =
    (await getSystemSetting("enrollment_allow_submit_before_requirements"))?.value === true;

  const required = applicable.filter((a) => a.rule.isRequired);
  // Missing = no file and not marked "to follow"; to-follow allows enrollment submit without the document
  const missingRequired = required.filter(
    (a) => a.submission.status === "missing" && !(a.submission.markAsToFollow ?? false)
  );
  const unverifiedRequired = required.filter(
    (a) => a.submission.status === "submitted" || a.submission.status === "rejected"
  );

  let canSubmit = true;
  let message: string | undefined;
  if (!allowSubmitBeforeRequirements) {
    if (requireVerified && unverifiedRequired.length > 0) {
      canSubmit = false;
      message = `Wait for registrar verification. Pending: ${unverifiedRequired.map((a) => a.requirement.name).join(", ")}`;
    }
    if (requireSubmitted && missingRequired.length > 0) {
      canSubmit = false;
      message = `Submit at least these forms: ${missingRequired.map((a) => a.requirement.name).join(", ")}`;
    }
  }

  return {
    canSubmit,
    requireVerified: requireVerified ?? false,
    requireSubmitted: requireSubmitted ?? true,
    missingRequired,
    unverifiedRequired,
    message,
  };
}
