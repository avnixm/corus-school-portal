"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import { getUserProfileByUserId, createScheduleWithDays, deleteSchedule, isSubjectAllowedForSection, getSectionById } from "@/db/queries";
import { getSubjectsAvailableForSection } from "@/lib/subjects/queries";

export async function createScheduleAction(formData: FormData) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await getUserProfileByUserId(session.user.id);
  if (!profile || (profile.role !== "registrar" && profile.role !== "admin")) {
    return { error: "Unauthorized" };
  }

  const schoolYearId = (formData.get("schoolYearId") as string)?.trim();
  const termId = (formData.get("termId") as string)?.trim();
  const sectionId = (formData.get("sectionId") as string)?.trim();
  const subjectId = (formData.get("subjectId") as string)?.trim();
  const teacherName = (formData.get("teacherName") as string)?.trim() || null;
  const room = (formData.get("room") as string)?.trim() || null;
  const timeIn = (formData.get("timeIn") as string)?.trim() || null;
  const timeOut = (formData.get("timeOut") as string)?.trim() || null;
  const daysRaw = formData.get("days");
  const days = Array.isArray(daysRaw)
    ? daysRaw.filter((d): d is string => typeof d === "string")
    : typeof daysRaw === "string"
    ? daysRaw.split(",").filter(Boolean)
    : [];

  if (!schoolYearId || !termId || !sectionId || !subjectId) {
    return { error: "School year, term, section, and subject are required" };
  }

  if (days.length === 0) {
    return { error: "At least one day is required" };
  }

  const allowed = await isSubjectAllowedForSection(subjectId, sectionId);
  if (!allowed.allowed) {
    return { error: allowed.error ?? "This subject cannot be scheduled for the selected section" };
  }

  await createScheduleWithDays({
    schoolYearId,
    termId,
    sectionId,
    subjectId,
    teacherName,
    room,
    timeIn,
    timeOut,
    days,
  });

  revalidatePath("/registrar/schedules");
  revalidatePath("/registrar");
  return { success: true };
}

/** Returns subjects allowed for the section (GE + section's program). */
export async function getSubjectsForSectionAction(sectionId: string) {
  const section = await getSectionById(sectionId);
  if (!section) return [];
  return getSubjectsAvailableForSection(section.programId);
}

export async function deleteScheduleAction(id: string) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await getUserProfileByUserId(session.user.id);
  if (!profile || (profile.role !== "registrar" && profile.role !== "admin")) {
    return { error: "Unauthorized" };
  }

  await deleteSchedule(id);
  revalidatePath("/registrar/schedules");
  return { success: true };
}
