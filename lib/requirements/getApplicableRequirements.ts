import "server-only";
import {
  getRequirementRulesForContext,
  getOrCreateStudentRequirementSubmission,
  getRequirementFilesBySubmissionId,
} from "@/db/queries";
import { db } from "@/lib/db";
import { requirements } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export type ApplicableRequirement = {
  requirement: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    instructions: string | null;
    allowedFileTypes: string[];
    maxFiles: number;
  };
  rule: {
    id: string;
    isRequired: boolean;
    sortOrder: number;
  };
  submission: {
    id: string;
    status: "missing" | "submitted" | "verified" | "rejected";
    submittedAt: Date | null;
    verifiedAt: Date | null;
    registrarRemarks: string | null;
    markAsToFollow: boolean;
  };
  files: { id: string; fileName: string; fileType: string; fileSize: number; storageKey: string }[];
};

export async function getApplicableRequirements(params: {
  studentId: string;
  enrollmentId: string | null;
  appliesTo: "enrollment" | "clearance" | "graduation";
  program?: string | null;
  yearLevel?: string | null;
  schoolYearId?: string | null;
  termId?: string | null;
}): Promise<ApplicableRequirement[]> {
  let rules = await getRequirementRulesForContext({
    appliesTo: params.appliesTo,
    program: params.program ?? null,
    yearLevel: params.yearLevel ?? null,
    schoolYearId: params.schoolYearId ?? null,
    termId: params.termId ?? null,
  });
  // Fallback: if no rules match this context (e.g. new program/term), use generic enrollment rules
  // so students can still see and submit common forms (Form 137, Birth Cert, etc.)
  if (rules.length === 0 && params.appliesTo === "enrollment" && params.enrollmentId) {
    rules = await getRequirementRulesForContext({
      appliesTo: "enrollment",
      program: null,
      yearLevel: null,
      schoolYearId: null,
      termId: null,
    });
  }
  if (rules.length === 0) return [];

  const requirementIds = [...new Set(rules.map((r) => r.requirementId))];
  const reqRows = await db.select().from(requirements).where(inArray(requirements.id, requirementIds));
  const reqMap = new Map(reqRows.map((r) => [r.id, r]));

  const result: ApplicableRequirement[] = [];
  for (const rule of rules) {
    const req = reqMap.get(rule.requirementId);
    if (!req || !req.isActive) continue;
    const submission = await getOrCreateStudentRequirementSubmission(
      params.studentId,
      params.enrollmentId,
      rule.requirementId
    );
    const files = await getRequirementFilesBySubmissionId(submission.id);
    result.push({
      requirement: {
        id: req.id,
        code: req.code,
        name: req.name,
        description: req.description,
        instructions: req.instructions,
        allowedFileTypes: (req.allowedFileTypes ?? []) as string[],
        maxFiles: req.maxFiles,
      },
      rule: {
        id: rule.id,
        isRequired: rule.isRequired,
        sortOrder: rule.sortOrder,
      },
      submission: {
        id: submission.id,
        status: submission.status,
        submittedAt: submission.submittedAt,
        verifiedAt: submission.verifiedAt,
        registrarRemarks: submission.registrarRemarks,
        markAsToFollow: submission.markAsToFollow ?? false,
      },
      files: files.map((f) => ({
        id: f.id,
        fileName: f.fileName,
        fileType: f.fileType,
        fileSize: f.fileSize,
        storageKey: f.storageKey,
      })),
    });
  }
  result.sort((a, b) => a.rule.sortOrder - b.rule.sortOrder);
  return result;
}
