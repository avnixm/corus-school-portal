"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import { getUserProfileByUserId } from "@/db/queries";
import { createEnrollment, getEnrollmentById } from "@/db/queries";
import { db } from "@/lib/db";
import { enrollments } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function createEnrollmentAction(formData: FormData) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await getUserProfileByUserId(session.user.id);
  if (!profile || (profile.role !== "registrar" && profile.role !== "admin")) {
    return { error: "Unauthorized" };
  }

  const studentId = (formData.get("studentId") as string)?.trim();
  const schoolYearId = (formData.get("schoolYearId") as string)?.trim();
  const termId = (formData.get("termId") as string)?.trim();
  const program = (formData.get("program") as string)?.trim() || null;
  const yearLevel = (formData.get("yearLevel") as string)?.trim() || null;
  const sectionId = (formData.get("sectionId") as string)?.trim() || null;

  if (!studentId || !schoolYearId || !termId) {
    return { error: "Student, school year, and term are required" };
  }

  try {
    await createEnrollment({
      studentId,
      schoolYearId,
      termId,
      program,
      yearLevel,
      sectionId: sectionId || null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create enrollment";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return { error: "Student already has an enrollment for this school year and term" };
    }
    return { error: msg };
  }

  revalidatePath("/registrar/enrollments");
  revalidatePath("/registrar");
  revalidatePath(`/registrar/students/${studentId}`);
  return { success: true };
}

export async function updateEnrollmentStatus(
  enrollmentId: string,
  status: "approved" | "rejected"
) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await getUserProfileByUserId(session.user.id);
  if (!profile || (profile.role !== "registrar" && profile.role !== "admin")) {
    return { error: "Unauthorized" };
  }

  const enrollment = await getEnrollmentById(enrollmentId);
  if (!enrollment) return { error: "Enrollment not found" };

  await db
    .update(enrollments)
    .set({ status, updatedAt: new Date() })
    .where(eq(enrollments.id, enrollmentId));

  revalidatePath("/registrar/enrollments");
  revalidatePath("/registrar/approvals");
  revalidatePath("/registrar");
  return { success: true };
}
