"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import { getUserProfileByUserId } from "@/db/queries";
import { createAnnouncement, updateAnnouncement, deleteAnnouncement } from "@/db/queries";

export async function createAnnouncementAction(formData: FormData) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await getUserProfileByUserId(session.user.id);
  if (!profile || (profile.role !== "registrar" && profile.role !== "admin")) {
    return { error: "Unauthorized" };
  }

  const title = (formData.get("title") as string)?.trim();
  const body = (formData.get("body") as string)?.trim();
  const audienceRaw = (formData.get("audience") as string)?.trim() || "all";
  const validAudiences = ["all", "students", "teachers", "registrar", "finance", "program_head", "dean"] as const;
  const audience = validAudiences.includes(audienceRaw as typeof validAudiences[number])
    ? (audienceRaw as typeof validAudiences[number])
    : "all";

  if (!title || !body) {
    return { error: "Title and body are required" };
  }

  await createAnnouncement({
    title,
    body,
    audience,
    createdByUserId: session.user.id,
  });
  revalidatePath("/registrar/announcements");
  revalidatePath("/registrar");
  return { success: true };
}

export async function updateAnnouncementAction(id: string, formData: FormData) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await getUserProfileByUserId(session.user.id);
  if (!profile || (profile.role !== "registrar" && profile.role !== "admin")) {
    return { error: "Unauthorized" };
  }

  const title = (formData.get("title") as string)?.trim();
  const body = (formData.get("body") as string)?.trim();
  const audienceRaw = (formData.get("audience") as string)?.trim() || "all";
  const validAudiences = ["all", "students", "teachers", "registrar", "finance", "program_head", "dean"] as const;
  const audience = validAudiences.includes(audienceRaw as typeof validAudiences[number])
    ? (audienceRaw as typeof validAudiences[number])
    : "all";

  if (!title || !body) {
    return { error: "Title and body are required" };
  }

  await updateAnnouncement(id, { title, body, audience });
  revalidatePath("/registrar/announcements");
  return { success: true };
}

export async function deleteAnnouncementAction(id: string) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await getUserProfileByUserId(session.user.id);
  if (!profile || (profile.role !== "registrar" && profile.role !== "admin")) {
    return { error: "Unauthorized" };
  }

  await deleteAnnouncement(id);
  revalidatePath("/registrar/announcements");
  revalidatePath("/registrar");
  return { success: true };
}
