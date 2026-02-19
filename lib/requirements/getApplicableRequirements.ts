import "server-only";
import {
  getRequirementRulesForContext,
  getOrCreateStudentRequirementSubmissionsBatch,
  getRequirementFilesBySubmissionIds,
} from "@/db/queries";
import { db } from "@/lib/db";
import { requirements } from "@/db/schema";
import { inArray } from "drizzle-orm";

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
  const [reqRows, submissions] = await Promise.all([
    db
      .select({
        id: requirements.id,
        code: requirements.code,
        name: requirements.name,
        description: requirements.description,
        instructions: requirements.instructions,
        allowedFileTypes: requirements.allowedFileTypes,
        maxFiles: requirements.maxFiles,
        isActive: requirements.isActive,
      })
      .from(requirements)
      .where(inArray(requirements.id, requirementIds)),
    getOrCreateStudentRequirementSubmissionsBatch(
      params.studentId,
      params.enrollmentId,
      requirementIds
    ),
  ]);
  const reqMap = new Map(reqRows.map((r) => [r.id, r]));
  const submissionByReq = new Map(submissions.map((s) => [s.requirementId, s]));
  const submissionIds = submissions.map((s) => s.id);
  const filesRows =
    submissionIds.length > 0
      ? await getRequirementFilesBySubmissionIds(submissionIds)
      : [];
  const filesBySubmissionId = new Map<string, typeof filesRows>();
  for (const f of filesRows) {
    const list = filesBySubmissionId.get(f.submissionId) ?? [];
    list.push(f);
    filesBySubmissionId.set(f.submissionId, list);
  }

  const result: ApplicableRequirement[] = [];
  for (const rule of rules) {
    const req = reqMap.get(rule.requirementId);
    if (!req || !req.isActive) continue;
    const submission = submissionByReq.get(rule.requirementId);
    if (!submission) continue;
    const files = filesBySubmissionId.get(submission.id) ?? [];
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
        status: submission.status as "missing" | "submitted" | "verified" | "rejected",
        submittedAt: submission.submittedAt,
        verifiedAt: submission.verifiedAt,
        registrarRemarks: submission.registrarRemarks,
        markAsToFollow: submission.markAsToFollow,
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
