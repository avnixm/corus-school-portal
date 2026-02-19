"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import {
  getProgramsList,
  createProgram,
  updateProgram,
  toggleProgramActive,
  deleteProgram,
  createSubject,
  updateSubject,
  toggleSubjectActive,
  deleteSubject,
  getSubjectsList,
} from "@/db/queries";
import { validateCreateSubject, validateUpdateSubject } from "@/lib/subjects/validation";

export async function createProgramAction(formData: FormData) {
  const auth = await requireRole(["registrar", "admin"]);
  if ("error" in auth) return { error: auth.error };
  const code = (formData.get("code") as string)?.trim()?.toUpperCase();
  const name = (formData.get("name") as string)?.trim();
  const active = formData.get("active") === "true";
  if (!code || !name) return { error: "Code and name are required" };
  await createProgram({ code, name, active });
  revalidatePath("/registrar/academics");
  revalidatePath("/registrar");
  return { success: true };
}

export async function updateProgramAction(id: string, formData: FormData) {
  const auth = await requireRole(["registrar", "admin"]);
  if ("error" in auth) return { error: auth.error };
  const code = (formData.get("code") as string)?.trim()?.toUpperCase();
  const name = (formData.get("name") as string)?.trim();
  const active = formData.get("active") === "true";
  await updateProgram(id, { code, name, active });
  revalidatePath("/registrar/academics");
  revalidatePath("/registrar");
  return { success: true };
}

export async function toggleProgramActiveAction(id: string, active: boolean) {
  const auth = await requireRole(["registrar", "admin"]);
  if ("error" in auth) return { error: auth.error };
  await toggleProgramActive(id, active);
  revalidatePath("/registrar/academics");
  revalidatePath("/registrar");
  return { success: true };
}

export async function deleteProgramAction(id: string) {
  const auth = await requireRole(["registrar", "admin"]);
  if ("error" in auth) return { error: auth.error };
  await deleteProgram(id);
  revalidatePath("/registrar/academics");
  revalidatePath("/registrar");
  return { success: true };
}

export async function createSubjectAction(formData: FormData) {
  const auth = await requireRole(["registrar", "admin"]);
  if ("error" in auth) return { error: auth.error };
  const type = (formData.get("type") as string) === "GE" ? "GE" : "PROGRAM";
  const programId = (formData.get("programId") as string)?.trim() || null;
  const code = (formData.get("code") as string)?.trim();
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const unitsRaw = (formData.get("units") as string)?.trim();
  const units = unitsRaw ? parseInt(unitsRaw, 10) : 0;
  const active = formData.get("active") !== "false";
  if (isNaN(units) || units < 0) return { error: "Units must be 0 or greater" };
  const validation = validateCreateSubject({ type, programId, code, title, units });
  if (!validation.ok) return { error: validation.error };
  const existing = await getSubjectsList({ programId: programId ?? undefined, geOnly: type === "GE" });
  const duplicate = existing.some((s) => s.code === code && (type === "GE" ? s.isGe : s.programId === programId));
  if (duplicate) return { error: "A subject with this code already exists for this program or as GE" };
  await createSubject({ type, programId, code, title, description, units, active });
  revalidatePath("/registrar/academics");
  revalidatePath("/registrar/academics/subjects");
  revalidatePath("/registrar/schedules");
  return { success: true };
}

export async function updateSubjectAction(id: string, formData: FormData) {
  const auth = await requireRole(["registrar", "admin"]);
  if ("error" in auth) return { error: auth.error };
  const code = (formData.get("code") as string)?.trim();
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const unitsRaw = (formData.get("units") as string)?.trim();
  const units = unitsRaw !== "" ? parseInt(unitsRaw, 10) : undefined;
  const type = (formData.get("type") as string) === "GE" ? "GE" : "PROGRAM";
  const programId = (formData.get("programId") as string)?.trim() || null;
  const active = formData.get("active") !== "false";
  const validation = validateUpdateSubject({ code, title, units, type, programId });
  if (!validation.ok) return { error: validation.error };
  await updateSubject(id, {
    code: code || undefined,
    title: title || undefined,
    description,
    units,
    type,
    programId,
    active,
  });
  revalidatePath("/registrar/academics");
  revalidatePath("/registrar/academics/subjects");
  revalidatePath("/registrar/schedules");
  return { success: true };
}

export async function toggleSubjectActiveAction(id: string, active: boolean) {
  const auth = await requireRole(["registrar", "admin"]);
  if ("error" in auth) return { error: auth.error };
  await toggleSubjectActive(id, active);
  revalidatePath("/registrar/academics");
  revalidatePath("/registrar/academics/subjects");
  revalidatePath("/registrar/schedules");
  return { success: true };
}

export async function deleteSubjectAction(id: string) {
  const auth = await requireRole(["registrar", "admin"]);
  if ("error" in auth) return { error: auth.error };
  await deleteSubject(id);
  revalidatePath("/registrar/academics");
  revalidatePath("/registrar/academics/subjects");
  revalidatePath("/registrar/schedules");
  return { success: true };
}
