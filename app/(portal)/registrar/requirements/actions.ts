"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import { getUserProfileByUserId } from "@/db/queries";
import {
  createRequirement,
  updateRequirement,
  deleteRequirement,
  deleteRequirementCascade,
  verifyRequirement,
  rejectRequirement,
  insertRequirementRule,
  updateRequirementRule,
  deleteRequirementRule,
  verifySubmission,
  rejectSubmission,
  insertAuditLog,
} from "@/db/queries";

function requireRegistrar() {
  return auth.getSession().then(async (s) => {
    const session = s?.data;
    if (!session?.user?.id) return { error: "Not authenticated" as const };
    const profile = await getUserProfileByUserId(session.user.id);
    if (!profile || (profile.role !== "registrar" && profile.role !== "admin")) {
      return { error: "Unauthorized" as const };
    }
    return { userId: session.user.id };
  });
}

export async function createRequirementAction(formData: FormData) {
  const authResult = await requireRegistrar();
  if ("error" in authResult) return { error: authResult.error };

  const code = (formData.get("code") as string)?.trim()?.toUpperCase().replace(/\s+/g, "_") || "";
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const instructions = (formData.get("instructions") as string)?.trim() || null;
  const allowedTypes = (formData.get("allowedFileTypes") as string)?.trim();
  const allowedFileTypes = allowedTypes ? allowedTypes.split(/[\s,]+/).filter(Boolean) : ["pdf", "jpg", "png"];
  const maxFiles = Math.max(1, parseInt(String(formData.get("maxFiles")), 10) || 1);

  if (!code || !name) return { error: "Code and name are required" };

  try {
    await createRequirement({ code, name, description, instructions, allowedFileTypes, maxFiles });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("column") || msg.includes("Failed query") || msg.includes("does not exist")) {
      return { error: "Requirements table may be outdated. Run database migrations (e.g. npm run db:push or apply schema) to add columns: code, instructions, allowed_file_types, max_files, is_active." };
    }
    return { error: msg };
  }
  revalidatePath("/registrar/requirements");
  revalidatePath("/registrar");
  return { success: true };
}

export async function updateRequirementAction(id: string, formData: FormData) {
  const authResult = await requireRegistrar();
  if ("error" in authResult) return { error: authResult.error };

  const code = (formData.get("code") as string)?.trim()?.toUpperCase().replace(/\s+/g, "_");
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const instructions = (formData.get("instructions") as string)?.trim() || null;
  const allowedTypes = (formData.get("allowedFileTypes") as string)?.trim();
  const allowedFileTypes = allowedTypes ? allowedTypes.split(/[\s,]+/).filter(Boolean) : undefined;
  const maxFilesRaw = formData.get("maxFiles");
  const maxFiles = maxFilesRaw != null ? Math.max(1, parseInt(String(maxFilesRaw), 10) || 1) : undefined;
  const isActive = formData.get("isActive") === "true" || formData.get("isActive") === "on";

  if (!name) return { error: "Name is required" };

  try {
    await updateRequirement(id, {
      ...(code != null && code !== "" && { code }),
      name,
        description,
      instructions,
      ...(allowedFileTypes && { allowedFileTypes }),
      ...(maxFiles != null && { maxFiles }),
      isActive,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }
  revalidatePath("/registrar/requirements");
  return { success: true };
}

export async function toggleRequirementActiveAction(id: string, isActive: boolean) {
  const authResult = await requireRegistrar();
  if ("error" in authResult) return { error: authResult.error };
  await updateRequirement(id, { isActive });
  revalidatePath("/registrar/requirements");
  return { success: true };
}

export async function deleteRequirementAction(id: string) {
  const authResult = await requireRegistrar();
  if ("error" in authResult) return { error: authResult.error };
  try {
    await deleteRequirementCascade(id);
    await deleteRequirement(id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }
  revalidatePath("/registrar/requirements");
  return { success: true };
}

export async function createRuleAction(formData: FormData) {
  const authResult = await requireRegistrar();
  if ("error" in authResult) return { error: authResult.error };

  const requirementId = (formData.get("requirementId") as string)?.trim();
  const appliesTo = ((formData.get("appliesTo") as string) || "enrollment") as "enrollment" | "clearance" | "graduation";
  const program = (formData.get("program") as string)?.trim() || null;
  const yearLevel = (formData.get("yearLevel") as string)?.trim() || null;
  const schoolYearId = (formData.get("schoolYearId") as string)?.trim() || null;
  const termId = (formData.get("termId") as string)?.trim() || null;
  const isRequired = formData.get("isRequired") !== "false";
  const sortOrder = parseInt(String(formData.get("sortOrder")), 10) || 0;

  if (!requirementId) return { error: "Requirement is required" };
  await insertRequirementRule({
    requirementId,
    appliesTo,
    program,
    yearLevel,
    schoolYearId,
    termId,
    isRequired,
    sortOrder,
  });
  revalidatePath("/registrar/requirements");
  return { success: true };
}

export async function updateRuleAction(id: string, formData: FormData) {
  const authResult = await requireRegistrar();
  if ("error" in authResult) return { error: authResult.error };
  const appliesTo = formData.get("appliesTo") as "enrollment" | "clearance" | "graduation" | undefined;
  const program = (formData.get("program") as string)?.trim() || null;
  const yearLevel = (formData.get("yearLevel") as string)?.trim() || null;
  const schoolYearId = (formData.get("schoolYearId") as string)?.trim() || null;
  const termId = (formData.get("termId") as string)?.trim() || null;
  const isRequired = formData.get("isRequired") === "true";
  const sortOrder = parseInt(String(formData.get("sortOrder")), 10);
  await updateRequirementRule(id, {
    ...(appliesTo && { appliesTo }),
    program,
    yearLevel,
    schoolYearId,
    termId,
    isRequired,
    sortOrder,
  });
  revalidatePath("/registrar/requirements");
  return { success: true };
}

export async function deleteRuleAction(id: string) {
  const authResult = await requireRegistrar();
  if ("error" in authResult) return { error: authResult.error };
  await deleteRequirementRule(id);
  revalidatePath("/registrar/requirements");
  return { success: true };
}

export async function verifyRequirementAction(id: string) {
  const authResult = await requireRegistrar();
  if ("error" in authResult) return { error: authResult.error };
  await verifyRequirement(id, authResult.userId);
  revalidatePath("/registrar/requirements");
  revalidatePath("/registrar/requirements/queue");
  revalidatePath("/registrar");
  return { success: true };
}

export async function rejectRequirementAction(id: string, notes: string) {
  const authResult = await requireRegistrar();
  if ("error" in authResult) return { error: authResult.error };
  await rejectRequirement(id, notes);
  revalidatePath("/registrar/requirements");
  revalidatePath("/registrar/requirements/queue");
  revalidatePath("/registrar");
  return { success: true };
}

export async function verifySubmissionAction(submissionId: string, messageToStudent?: string | null) {
  const authResult = await requireRegistrar();
  if ("error" in authResult) return { error: authResult.error };
  await verifySubmission(submissionId, authResult.userId, messageToStudent?.trim() || null);
  await insertAuditLog({
    actorUserId: authResult.userId,
    action: "requirement_verify",
    entityType: "student_requirement_submission",
    entityId: submissionId,
    after: { status: "verified" },
  });
  revalidatePath("/registrar/requirements");
  revalidatePath("/registrar/requirements/queue");
  revalidatePath("/registrar/approvals");
  return { success: true };
}

export async function rejectSubmissionAction(submissionId: string, remarks: string) {
  const authResult = await requireRegistrar();
  if ("error" in authResult) return { error: authResult.error };
  if (!remarks?.trim()) return { error: "Remarks are required" };
  await rejectSubmission(submissionId, remarks.trim());
  await insertAuditLog({
    actorUserId: authResult.userId,
    action: "requirement_reject",
    entityType: "student_requirement_submission",
    entityId: submissionId,
    after: { status: "rejected", remarks: remarks.trim() },
  });
  revalidatePath("/registrar/requirements");
  revalidatePath("/registrar/requirements/queue");
  revalidatePath("/registrar/approvals");
  return { success: true };
}
