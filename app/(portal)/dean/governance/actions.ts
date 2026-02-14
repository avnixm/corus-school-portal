"use server";

import { revalidatePath } from "next/cache";
import { createGovernanceFlag, resolveGovernanceFlag } from "@/lib/dean/queries";
import { requireRole } from "@/lib/rbac";

export async function createFlagAction(formData: FormData) {
  const auth = await requireRole(["dean", "admin"]);
  if ("error" in auth) return { error: auth.error };
  const enrollmentId = (formData.get("enrollmentId") as string)?.trim() || null;
  const studentId = (formData.get("studentId") as string)?.trim() || null;
  const flagType = formData.get("flagType") as "finance_hold" | "academic_hold" | "disciplinary_hold" | "exception";
  const notes = (formData.get("notes") as string)?.trim() || null;
  if (!enrollmentId && !studentId) return { error: "Enrollment or student is required" };
  if (!flagType || !["finance_hold", "academic_hold", "disciplinary_hold", "exception"].includes(flagType)) {
    return { error: "Valid flag type is required" };
  }
  await createGovernanceFlag({
    enrollmentId: enrollmentId || undefined,
    studentId: studentId || undefined,
    flagType,
    notes,
    createdByUserId: auth.userId,
  });
  revalidatePath("/dean/governance");
  return { success: true };
}

export async function resolveFlagAction(flagId: string, notes?: string | null) {
  const auth = await requireRole(["dean", "admin"]);
  if ("error" in auth) return { error: auth.error };
  await resolveGovernanceFlag(flagId, auth.userId, notes);
  revalidatePath("/dean/governance");
  return { success: true };
}

export async function resolveFlagFormAction(formData: FormData) {
  const flagId = formData.get("flagId") as string;
  if (!flagId) return { error: "Flag ID required" };
  return resolveFlagAction(flagId);
}
