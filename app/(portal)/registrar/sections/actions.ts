"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import { getUserProfileByUserId } from "@/db/queries";
import { createSection, updateSection } from "@/db/queries";

export async function createSectionAction(formData: FormData) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await getUserProfileByUserId(session.user.id);
  if (!profile || (profile.role !== "registrar" && profile.role !== "admin")) {
    return { error: "Unauthorized" };
  }

  const name = (formData.get("name") as string)?.trim();
  const yearLevel = (formData.get("yearLevel") as string)?.trim() || null;
  const program = (formData.get("program") as string)?.trim() || null;

  if (!name) {
    return { error: "Name is required" };
  }

  await createSection({ name, yearLevel, program });
  revalidatePath("/registrar/sections");
  revalidatePath("/registrar");
  return { success: true };
}

export async function updateSectionAction(id: string, formData: FormData) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await getUserProfileByUserId(session.user.id);
  if (!profile || (profile.role !== "registrar" && profile.role !== "admin")) {
    return { error: "Unauthorized" };
  }

  const name = (formData.get("name") as string)?.trim();
  const yearLevel = (formData.get("yearLevel") as string)?.trim() || null;
  const program = (formData.get("program") as string)?.trim() || null;

  if (!name) {
    return { error: "Name is required" };
  }

  await updateSection(id, { name, yearLevel, program });
  revalidatePath("/registrar/sections");
  return { success: true };
}
