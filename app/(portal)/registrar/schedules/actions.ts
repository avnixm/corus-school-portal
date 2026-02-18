"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import {
  getUserProfileByUserId,
  createScheduleWithDays,
  deleteSchedule,
  isSubjectAllowedForSection,
  getSectionById,
  getTeacherById,
  createScheduleApproval,
} from "@/db/queries";
import { listEligibleTeachersForSubject, validateTeacherCapability } from "@/lib/capabilities/eligibility";
import { getSubjectsAvailableForSection } from "@/lib/subjects/queries";
import { db } from "@/lib/db";
import { classSchedules } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function createScheduleAction(formData: FormData) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await getUserProfileByUserId(session.user.id);
  if (!profile || (profile.role !== "registrar" && profile.role !== "program_head" && profile.role !== "admin")) {
    return { error: "Unauthorized" };
  }

  const schoolYearId = (formData.get("schoolYearId") as string)?.trim();
  const termId = (formData.get("termId") as string)?.trim();
  const sectionId = (formData.get("sectionId") as string)?.trim();
  const subjectId = (formData.get("subjectId") as string)?.trim();
  const teacherId = (formData.get("teacherId") as string)?.trim();
  const room = (formData.get("room") as string)?.trim() || null;
  const timeIn = (formData.get("timeIn") as string)?.trim() || null;
  const timeOut = (formData.get("timeOut") as string)?.trim() || null;
  const daysRaw = formData.getAll("days");
  const days = daysRaw.filter((d): d is string => typeof d === "string");

  if (!schoolYearId || !termId || !sectionId || !subjectId) {
    return { error: "School year, term, section, and subject are required" };
  }

  if (!teacherId) {
    return { error: "Teacher is required" };
  }

  if (days.length === 0) {
    return { error: "At least one day is required" };
  }

  const allowed = await isSubjectAllowedForSection(subjectId, sectionId);
  if (!allowed.allowed) {
    return { error: allowed.error ?? "This subject cannot be scheduled for the selected section" };
  }

  const hasCapability = await validateTeacherCapability(teacherId, subjectId);
  if (!hasCapability) {
    return { error: "Teacher is not approved to teach this subject. Request capability approval." };
  }

  const teacher = await getTeacherById(teacherId);
  const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : null;

  const schedule = await createScheduleWithDays({
    schoolYearId,
    termId,
    sectionId,
    subjectId,
    teacherUserProfileId: teacherId,
    teacherName,
    room,
    timeIn,
    timeOut,
    days,
  });

  await createScheduleApproval({
    scheduleId: schedule.id,
    schoolYearId,
    termId,
    submittedByUserId: session.user.id,
    hasTeacherOverride: false,
    overrideReason: null,
  });

  // Set schedule to pending approval
  await db.update(classSchedules)
    .set({ status: "pending_approval" })
    .where(eq(classSchedules.id, schedule.id));

  revalidatePath("/registrar/schedules");
  revalidatePath("/program-head/schedules");
  revalidatePath("/registrar");
  return { success: true };
}

/** Returns subjects allowed for the section (GE + section's program). */
export async function getSubjectsForSectionAction(sectionId: string) {
  const section = await getSectionById(sectionId);
  if (!section) return [];
  return getSubjectsAvailableForSection(section.programId);
}

/** Returns eligible teachers for a subject (recommended + department match) given section context. */
export async function getEligibleTeachersForSubjectAction(subjectId: string, sectionId: string) {
  const section = await getSectionById(sectionId);
  const contextProgramId = section?.programId ?? null;
  return listEligibleTeachersForSubject(subjectId, contextProgramId);
}

/** Returns approved time configuration for a section's program. */
export async function getApprovedTimeConfigForSectionAction(sectionId: string) {
  const section = await getSectionById(sectionId);
  if (!section?.programId) return null;
  const { getApprovedTimeConfigForProgram } = await import("@/db/queries");
  return getApprovedTimeConfigForProgram(section.programId);
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
