"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import {
  createProgram,
  updateProgram,
  toggleProgramActive,
  getProgramsList,
} from "@/db/queries";

export async function createProgramAction(formData: FormData) {
  const auth = await requireRole(["registrar", "admin"]);
  if ("error" in auth) return { error: auth.error };

  const code = (formData.get("code") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!code || !name) {
    return { error: "Code and name are required" };
  }

  const existing = await getProgramsList();
  if (existing.some((p) => p.code.toLowerCase() === code.toLowerCase())) {
    return { error: "A program with this code already exists" };
  }

  await createProgram({ code, name, description });
  revalidatePath("/registrar/academics/programs");
  revalidatePath("/registrar/academics/sections");
  revalidatePath("/registrar/academics");
  revalidatePath("/registrar/schedules");
  revalidatePath("/registrar/records/enrollments");
  return { success: true };
}

export async function updateProgramAction(id: string, formData: FormData) {
  const auth = await requireRole(["registrar", "admin"]);
  if ("error" in auth) return { error: auth.error };

  const code = (formData.get("code") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!code || !name) {
    return { error: "Code and name are required" };
  }

  await updateProgram(id, { code, name, description });
  revalidatePath("/registrar/academics/programs");
  revalidatePath("/registrar/academics/sections");
  revalidatePath("/registrar/academics");
  revalidatePath("/registrar/schedules");
  revalidatePath("/registrar/records/enrollments");
  return { success: true };
}

export async function toggleProgramActiveAction(id: string, active: boolean) {
  const auth = await requireRole(["registrar", "admin"]);
  if ("error" in auth) return { error: auth.error };

  await toggleProgramActive(id, active);
  revalidatePath("/registrar/academics/programs");
  revalidatePath("/registrar/academics/sections");
  revalidatePath("/registrar/academics");
  revalidatePath("/registrar/schedules");
  revalidatePath("/registrar/records/enrollments");
  return { success: true };
}
