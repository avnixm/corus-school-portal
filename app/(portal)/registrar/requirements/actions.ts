"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import { getUserProfileByUserId } from "@/db/queries";
import {
  createRequirement,
  updateRequirement,
  verifyRequirement,
  rejectRequirement,
} from "@/db/queries";

export async function createRequirementAction(formData: FormData) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await getUserProfileByUserId(session.user.id);
  if (!profile || (profile.role !== "registrar" && profile.role !== "admin")) {
    return { error: "Unauthorized" };
  }

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!name) {
    return { error: "Name is required" };
  }

  await createRequirement({ name, description });
  revalidatePath("/registrar/requirements");
  revalidatePath("/registrar");
  return { success: true };
}

export async function updateRequirementAction(id: string, formData: FormData) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await getUserProfileByUserId(session.user.id);
  if (!profile || (profile.role !== "registrar" && profile.role !== "admin")) {
    return { error: "Unauthorized" };
  }

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!name) {
    return { error: "Name is required" };
  }

  await updateRequirement(id, { name, description });
  revalidatePath("/registrar/requirements");
  return { success: true };
}

export async function verifyRequirementAction(id: string) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await getUserProfileByUserId(session.user.id);
  if (!profile || (profile.role !== "registrar" && profile.role !== "admin")) {
    return { error: "Unauthorized" };
  }

  await verifyRequirement(id, session.user.id);
  revalidatePath("/registrar/requirements");
  revalidatePath("/registrar");
  return { success: true };
}

export async function rejectRequirementAction(id: string, notes: string) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await getUserProfileByUserId(session.user.id);
  if (!profile || (profile.role !== "registrar" && profile.role !== "admin")) {
    return { error: "Unauthorized" };
  }

  await rejectRequirement(id, notes);
  revalidatePath("/registrar/requirements");
  revalidatePath("/registrar");
  return { success: true };
}
