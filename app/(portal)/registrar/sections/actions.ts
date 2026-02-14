"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import { createSection, updateSection, toggleSectionActive } from "@/db/queries";

export async function createSectionAction(formData: FormData) {
  const auth = await requireRole(["registrar", "admin"]);
  if ("error" in auth) return { error: auth.error };

  const programId = (formData.get("programId") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const yearLevel = (formData.get("yearLevel") as string)?.trim() || null;

  if (!programId || !name) {
    return { error: "Program and section name are required" };
  }

  await createSection({ programId, name, yearLevel });
  revalidatePath("/registrar/sections");
  revalidatePath("/registrar/schedules");
  revalidatePath("/registrar");
  return { success: true };
}

export async function updateSectionAction(id: string, formData: FormData) {
  const auth = await requireRole(["registrar", "admin"]);
  if ("error" in auth) return { error: auth.error };

  const programId = (formData.get("programId") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const yearLevel = (formData.get("yearLevel") as string)?.trim() || null;

  if (!name) {
    return { error: "Section name is required" };
  }

  await updateSection(id, {
    ...(programId && { programId }),
    name,
    yearLevel,
  });
  revalidatePath("/registrar/sections");
  revalidatePath("/registrar/schedules");
  return { success: true };
}

export async function toggleSectionActiveAction(id: string, active: boolean) {
  const auth = await requireRole(["registrar", "admin"]);
  if ("error" in auth) return { error: auth.error };

  await toggleSectionActive(id, active);
  revalidatePath("/registrar/sections");
  revalidatePath("/registrar/schedules");
  return { success: true };
}
