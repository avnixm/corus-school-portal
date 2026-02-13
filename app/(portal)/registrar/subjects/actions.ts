"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import { getUserProfileByUserId } from "@/db/queries";
import { createSubject, updateSubject, toggleSubjectActive } from "@/db/queries";

export async function createSubjectAction(formData: FormData) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await getUserProfileByUserId(session.user.id);
  if (!profile || (profile.role !== "registrar" && profile.role !== "admin")) {
    return { error: "Unauthorized" };
  }

  const code = (formData.get("code") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const units = (formData.get("units") as string)?.trim() || null;

  if (!code || !description) {
    return { error: "Code and description are required" };
  }

  await createSubject({ code, description, units: units || null });
  revalidatePath("/registrar/subjects");
  revalidatePath("/registrar");
  return { success: true };
}

export async function updateSubjectAction(id: string, formData: FormData) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await getUserProfileByUserId(session.user.id);
  if (!profile || (profile.role !== "registrar" && profile.role !== "admin")) {
    return { error: "Unauthorized" };
  }

  const code = (formData.get("code") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const units = (formData.get("units") as string)?.trim() || null;

  if (!code || !description) {
    return { error: "Code and description are required" };
  }

  await updateSubject(id, {
    code,
    description,
    units: units || null,
  });
  revalidatePath("/registrar/subjects");
  return { success: true };
}

export async function toggleSubjectActiveAction(id: string, active: boolean) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await getUserProfileByUserId(session.user.id);
  if (!profile || (profile.role !== "registrar" && profile.role !== "admin")) {
    return { error: "Unauthorized" };
  }

  await toggleSubjectActive(id, active);
  revalidatePath("/registrar/subjects");
  return { success: true };
}
