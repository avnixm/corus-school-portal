"use server";

import { revalidatePath } from "next/cache";
import {
  getEnrollmentById,
  insertAuditLog,
  getFeeSetupById,
  getFeeSetupLinesByFeeSetupId,
  getFeeSetupApprovalByFeeSetupId,
  getTotalUnitsForEnrollment,
  createAssessmentFromFeeSetup,
} from "@/db/queries";
import { getCurriculumSubjectsAndTotalUnitsForEnrollment } from "@/lib/curriculum/queries";
import { requireRole } from "@/lib/rbac";
import {
  createAssessmentDraft,
  updateAssessmentDraft,
  postAssessment,
  getProgramFeeRulesForEnrollment,
  getAssessmentWithLines,
  type AssessmentLineInput,
} from "@/lib/finance/queries";
import { findBestApprovedFeeSetup } from "@/lib/fees/matching";

async function checkAuth() {
  const result = await requireRole(["finance", "admin"]);
  if ("error" in result) return { error: result.error as "Unauthorized", userId: null };
  return { error: null, userId: result.userId };
}

export async function createAssessmentAction(
  enrollmentId: string,
  lines: AssessmentLineInput[],
  notes?: string
) {
  const { error, userId } = await checkAuth();
  if (error || !userId) return { error: error ?? "Unauthorized" };

  const enrollment = await getEnrollmentById(enrollmentId);
  if (!enrollment) return { error: "Enrollment not found" };
  if (enrollment.status !== "approved") {
    return { error: "Enrollment must be approved before creating an assessment" };
  }

  if (!lines.length) return { error: "At least one line is required" };

  try {
    await createAssessmentDraft(enrollmentId, lines, notes ?? null);
    revalidatePath("/finance/assessments");
    return { success: true };
  } catch (e) {
    return { error: "Failed to create assessment" };
  }
}

export async function updateAssessmentAction(
  assessmentId: string,
  lines: AssessmentLineInput[],
  notes?: string
) {
  const { error } = await checkAuth();
  if (error) return { error };

  if (!lines.length) return { error: "At least one line is required" };

  try {
    await updateAssessmentDraft(assessmentId, lines, notes ?? null);
    revalidatePath("/finance/assessments");
    return { success: true };
  } catch (e) {
    return { error: "Failed to update assessment" };
  }
}

export async function getAssessmentLinesAction(assessmentId: string) {
  const { error } = await checkAuth();
  if (error) return { error, lines: [] };
  const result = await getAssessmentWithLines(assessmentId);
  if (!result) return { lines: [] };
  const lines: AssessmentLineInput[] = result.lines.map((l) => ({
    feeItemId: l.feeItemId,
    description: l.description,
    category: l.category,
    amount: l.amount ?? "0",
    qty: l.qty ?? 1,
  }));
  return { lines };
}

export async function getSuggestedFeeLinesAction(enrollmentId: string) {
  const { error } = await checkAuth();
  if (error) return { error, lines: [] };
  const rules = await getProgramFeeRulesForEnrollment(enrollmentId);
  return {
    lines: rules.map((r) => ({
      feeItemId: r.feeItemId,
      description: `${r.feeCode} – ${r.feeName}`,
      category: r.category,
      amount: r.amount ?? "0",
      qty: 1,
    })),
  };
}

export async function generateAssessmentFromFeeSetupAction(
  enrollmentId: string,
  feeSetupId?: string
) {
  const { error } = await checkAuth();
  if (error) return { error };

  const enrollment = await getEnrollmentById(enrollmentId);
  if (!enrollment) return { error: "Enrollment not found" };
  if (enrollment.status !== "approved") {
    return { error: "Enrollment must be approved" };
  }

  const programId = enrollment.programId ?? null;
  const yearLevel = enrollment.yearLevel ?? null;
  const curriculum = await getCurriculumSubjectsAndTotalUnitsForEnrollment({
    programId,
    schoolYearId: enrollment.schoolYearId,
    termId: enrollment.termId,
    yearLevel,
  });
  if (!curriculum) {
    return {
      error:
        "No published curriculum found for this Program/Year/Term. Ask registrar to publish curriculum.",
    };
  }

  let setupId = feeSetupId;
  if (!setupId) {
    const best = await findBestApprovedFeeSetup(enrollmentId);
    if (!best) {
      return {
        error:
          "No approved fee setup matches this enrollment (program/year/term). Create and get one approved first.",
      };
    }
    setupId = best.id;
  } else {
    const setup = await getFeeSetupById(setupId);
    if (!setup || setup.status !== "approved") {
      return { error: "Fee setup not found or not approved" };
    }
    const approval = await getFeeSetupApprovalByFeeSetupId(setupId);
    if (
      !approval ||
      approval.programHeadStatus !== "approved" ||
      approval.deanStatus !== "approved"
    ) {
      return { error: "Fee setup requires Program Head + Dean approval" };
    }
    if (setup.programId !== enrollment.programId) {
      return { error: "Fee setup program does not match enrollment" };
    }
  }

  const totalUnits = curriculum.totalUnits;
  const lines = await getFeeSetupLinesByFeeSetupId(setupId);
  const setup = await getFeeSetupById(setupId);
  if (!setup) return { error: "Fee setup not found" };
  const tuitionPerUnit = parseFloat(setup.tuitionPerUnit ?? "0");
  const tuitionAmount = totalUnits * tuitionPerUnit;

  let labTotal = 0;
  let miscTotal = 0;
  let otherTotal = 0;
  const feeLines: Array<{
    sourceFeeSetupLineId: string | null;
    description: string;
    category: "lab" | "misc" | "other";
    amount: string;
    qty: number;
    lineTotal: string;
    sortOrder: number;
  }> = [];

  let sortOrder = 1;
  for (const l of lines) {
    const amt = parseFloat(l.amount ?? "0") * (l.qty ?? 1);
    const cat =
      l.lineType === "lab_fee"
        ? ("lab" as const)
        : l.lineType === "misc_fee"
          ? ("misc" as const)
          : ("other" as const);
    if (l.lineType === "lab_fee") labTotal += amt;
    else if (l.lineType === "misc_fee") miscTotal += amt;
    else otherTotal += amt;
    feeLines.push({
      sourceFeeSetupLineId: l.id,
      description: l.label,
      category: cat,
      amount: l.amount ?? "0",
      qty: l.qty ?? 1,
      lineTotal: String(amt),
      sortOrder: sortOrder++,
    });
  }

  const tuitionLine = {
    sourceFeeSetupLineId: null as string | null,
    description: `Tuition (${totalUnits} units × ₱${tuitionPerUnit.toFixed(2)})`,
    category: "tuition" as const,
    amount: String(tuitionPerUnit),
    qty: totalUnits,
    lineTotal: String(tuitionAmount),
    sortOrder: 0,
  };

  const total = tuitionAmount + labTotal + miscTotal + otherTotal;

  try {
    const assessment = await createAssessmentFromFeeSetup({
      enrollmentId,
      feeSetupId: setupId,
      totalUnits,
      tuitionPerUnit: String(tuitionPerUnit),
      tuitionAmount: String(tuitionAmount),
      labTotal: String(labTotal),
      miscTotal: String(miscTotal),
      otherTotal: String(otherTotal),
      total: String(total),
      lines: [tuitionLine, ...feeLines],
    });
    if (!assessment) return { error: "Failed to create assessment" };
    revalidatePath("/finance/assessments");
    return { success: true, assessmentId: assessment.id };
  } catch (e) {
    return { error: "Failed to generate assessment" };
  }
}

export async function postAssessmentAction(assessmentId: string) {
  const { error, userId } = await checkAuth();
  if (error || !userId) return { error: error ?? "Unauthorized" };

  try {
    const result = await postAssessment(assessmentId, userId);
    if (!result) {
      return { error: "Assessment not found, not in draft, or enrollment is not approved" };
    }
    await insertAuditLog({
      actorUserId: userId,
      action: "ASSESSMENT_POST",
      entityType: "assessment",
      entityId: assessmentId,
    });
    revalidatePath("/finance/assessments");
    revalidatePath("/finance");
    return { success: true };
  } catch (e) {
    return { error: "Failed to post assessment" };
  }
}
