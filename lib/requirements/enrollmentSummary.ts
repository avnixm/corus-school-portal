import "server-only";
import {
  getRequirementRulesForEnrollmentAll,
  getSubmissionsWithRequirementNamesByEnrollmentIds,
} from "@/db/queries";
import { db } from "@/lib/db";
import { requirements } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { getApplicableRequirements } from "./getApplicableRequirements";

export type EnrollmentRequirementsSummary = {
  required: number;
  verified: number;
  missingNames: string[];
  unverifiedNames: string[];
};

export type EnrollmentRequirementsSummaryContext = {
  enrollmentId: string;
  studentId: string;
  program: string | null;
  yearLevel: string | null;
  schoolYearId: string;
  termId: string;
};

/** Batch: compute requirements summary for many enrollments in 2 queries. */
export async function getEnrollmentRequirementsSummariesBatch(
  contexts: EnrollmentRequirementsSummaryContext[]
): Promise<Map<string, EnrollmentRequirementsSummary>> {
  const byEnrollmentId = new Map<string, EnrollmentRequirementsSummary>();
  if (contexts.length === 0) return byEnrollmentId;
  const enrollmentIds = contexts.map((c) => c.enrollmentId);
  const contextByEnrollmentId = new Map(contexts.map((c) => [c.enrollmentId, c]));

  const [allRules, submissions] = await Promise.all([
    getRequirementRulesForEnrollmentAll(),
    getSubmissionsWithRequirementNamesByEnrollmentIds(enrollmentIds),
  ]);
  const reqIds = [...new Set(allRules.map((r) => r.requirementId))];
  const reqRows =
    reqIds.length > 0
      ? await db
          .select({ id: requirements.id, name: requirements.name })
          .from(requirements)
          .where(inArray(requirements.id, reqIds))
      : [];
  const requirementIdToName = new Map(reqRows.map((r) => [r.id, r.name]));

  const submissionsByEnrollment = new Map<string, { requirementId: string; status: string; requirementName: string }[]>();
  for (const s of submissions) {
    const eid = s.enrollmentId ?? "";
    if (!eid) continue;
    const list = submissionsByEnrollment.get(eid) ?? [];
    list.push({
      requirementId: s.requirementId,
      status: s.status,
      requirementName: s.requirementName,
    });
    submissionsByEnrollment.set(eid, list);
  }

  for (const ctx of contexts) {
    const matchingRules = allRules.filter((r) => {
      if (ctx.program != null && r.program != null && r.program !== ctx.program) return false;
      if (ctx.yearLevel != null && r.yearLevel != null && r.yearLevel !== ctx.yearLevel) return false;
      if (ctx.schoolYearId != null && r.schoolYearId != null && r.schoolYearId !== ctx.schoolYearId) return false;
      if (ctx.termId != null && r.termId != null && r.termId !== ctx.termId) return false;
      return true;
    });
    const requiredRules = matchingRules.filter((r) => r.isRequired);
    const subs = submissionsByEnrollment.get(ctx.enrollmentId) ?? [];
    const subByReqId = new Map(subs.map((s) => [s.requirementId, s]));

    let verified = 0;
    const missingNames: string[] = [];
    const unverifiedNames: string[] = [];
    for (const rule of requiredRules) {
      const sub = subByReqId.get(rule.requirementId);
      const status = sub?.status ?? "missing";
      const name = sub?.requirementName ?? requirementIdToName.get(rule.requirementId) ?? "—";
      if (status === "verified") verified += 1;
      else if (status === "missing") missingNames.push(name);
      else if (status === "submitted" || status === "rejected") unverifiedNames.push(name);
    }
    byEnrollmentId.set(ctx.enrollmentId, {
      required: requiredRules.length,
      verified,
      missingNames,
      unverifiedNames,
    });
  }
  return byEnrollmentId;
}

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
