"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import { getUserProfileByUserId } from "@/db/queries";
import {
  createAssessmentDraft,
  updateAssessmentDraft,
  postAssessment,
  getProgramFeeRulesForEnrollment,
  getAssessmentWithLines,
  type AssessmentLineInput,
} from "@/lib/finance/queries";

async function checkAuth() {
  const s = (await auth.getSession())?.data;
  if (!s?.user?.id) return { error: "Not authenticated" as const, userId: null };
  const p = await getUserProfileByUserId(s.user.id);
  if (!p || (p.role !== "finance" && p.role !== "admin"))
    return { error: "Unauthorized" as const, userId: null };
  return { error: null, userId: s.user.id };
}

export async function createAssessmentAction(
  enrollmentId: string,
  lines: AssessmentLineInput[],
  notes?: string
) {
  const { error, userId } = await checkAuth();
  if (error || !userId) return { error: error ?? "Unauthorized" };

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

export async function postAssessmentAction(assessmentId: string) {
  const { error, userId } = await checkAuth();
  if (error || !userId) return { error: error ?? "Unauthorized" };

  try {
    await postAssessment(assessmentId, userId);
    revalidatePath("/finance/assessments");
    revalidatePath("/finance");
    return { success: true };
  } catch (e) {
    return { error: "Failed to post assessment" };
  }
}
