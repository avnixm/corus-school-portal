"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import { getUserProfileByUserId } from "@/db/queries";
import { createAnnouncement, updateAnnouncement, deleteAnnouncement } from "@/db/queries";
import { db } from "@/lib/db";
import { announcements } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function createAnnouncementAction(formData: FormData) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await getUserProfileByUserId(session.user.id);
  const canCreate = profile && ["registrar", "finance", "dean", "admin"].includes(profile.role);
  if (!profile || !canCreate) {
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
  revalidatePath("/finance/announcements");
  revalidatePath("/finance");
  return { success: true };
}

export async function updateAnnouncementAction(id: string, formData: FormData) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await getUserProfileByUserId(session.user.id);
  const canUpdate = profile && ["registrar", "finance", "dean", "admin"].includes(profile.role);
  if (!profile || !canUpdate) {
    return { error: "Unauthorized" };
  }

  // Check ownership - only creator or admin can edit
  const [announcement] = await db
    .select()
    .from(announcements)
    .where(eq(announcements.id, id))
    .limit(1);

  if (!announcement) {
    return { error: "Announcement not found" };
  }

  if (announcement.createdByUserId !== session.user.id && profile.role !== "admin") {
    return { error: "You can only edit your own announcements" };
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
  revalidatePath("/finance/announcements");
  return { success: true };
}

export async function deleteAnnouncementAction(id: string) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await getUserProfileByUserId(session.user.id);
  const canDelete = profile && ["registrar", "finance", "dean", "admin"].includes(profile.role);
  if (!profile || !canDelete) {
    return { error: "Unauthorized" };
  }

  // Check ownership - only creator or admin can delete
  const [announcement] = await db
    .select()
    .from(announcements)
    .where(eq(announcements.id, id))
    .limit(1);

  if (!announcement) {
    return { error: "Announcement not found" };
  }

  if (announcement.createdByUserId !== session.user.id && profile.role !== "admin") {
    return { error: "You can only delete your own announcements" };
  }

  await deleteAnnouncement(id);
  revalidatePath("/registrar/announcements");
  revalidatePath("/registrar");
  revalidatePath("/finance/announcements");
  revalidatePath("/finance");
  return { success: true };
}
