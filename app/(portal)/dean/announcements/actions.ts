"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { createAnnouncement, updateAnnouncement, deleteAnnouncement } from "@/db/queries";

type Audience = "all" | "students" | "teachers" | "registrar" | "finance" | "program_head" | "dean";

export async function createDeanAnnouncement(formData: FormData) {
  const user = await getCurrentUserWithRole();
  if (!user || (user.role !== "dean" && user.role !== "admin")) {
    return { error: "Unauthorized" };
  }
  const title = (formData.get("title") as string)?.trim();
  const body = (formData.get("body") as string)?.trim();
  const audience = (formData.get("audience") as Audience) || "all";
  const pinned = formData.get("pinned") === "on";
  const program = (formData.get("program") as string)?.trim() || null;
  if (!title || !body) return { error: "Title and body are required" };
  await createAnnouncement({
    title,
    body,
    audience,
    program,
    pinned,
    createdByUserId: user.userId,
  });
  revalidatePath("/dean/announcements");
  revalidatePath("/dean");
  return { success: true };
}

export async function updateDeanAnnouncement(id: string, formData: FormData) {
  const user = await getCurrentUserWithRole();
  if (!user || (user.role !== "dean" && user.role !== "admin")) {
    return { error: "Unauthorized" };
  }
  const title = (formData.get("title") as string)?.trim();
  const body = (formData.get("body") as string)?.trim();
  const audience = (formData.get("audience") as Audience) || "all";
  const pinned = formData.get("pinned") === "on";
  const program = (formData.get("program") as string)?.trim() || null;
  if (!title || !body) return { error: "Title and body are required" };
  await updateAnnouncement(id, { title, body, audience, program, pinned });
  revalidatePath("/dean/announcements");
  revalidatePath("/dean");
  return { success: true };
}

export async function toggleDeanAnnouncementPinned(id: string, pinned: boolean) {
  const user = await getCurrentUserWithRole();
  if (!user || (user.role !== "dean" && user.role !== "admin")) {
    return { error: "Unauthorized" };
  }
  await updateAnnouncement(id, { pinned });
  revalidatePath("/dean/announcements");
  revalidatePath("/dean");
  return { success: true };
}

export async function deleteDeanAnnouncement(id: string) {
  const user = await getCurrentUserWithRole();
  if (!user || (user.role !== "dean" && user.role !== "admin")) {
    return { error: "Unauthorized" };
  }
  await deleteAnnouncement(id);
  revalidatePath("/dean/announcements");
  revalidatePath("/dean");
  return { success: true };
}
