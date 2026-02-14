"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import {
  getProfileAndStudentByUserId,
  generateNextStudentCode,
  insertStudent,
  insertStudentAddress,
} from "@/db/queries";

export type SetupResult = { error?: string };

export type SetupFormDefaults =
  | { ok: true; email: string; name: string }
  | { ok: false; redirect: "login" | "student" };

/**
 * Returns form defaults for the setup page. Used by client so the page can be static/cached.
 */
export async function getSetupFormDefaults(): Promise<SetupFormDefaults> {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { ok: false, redirect: "login" };
  const profile = await getProfileAndStudentByUserId(session.user.id);
  if (!profile?.profile) return { ok: false, redirect: "login" };
  if (profile.student) return { ok: false, redirect: "student" };
  const user = await getCurrentUserWithRole();
  if (!user || user.role !== "student") return { ok: false, redirect: "login" };
  return {
    ok: true,
    email: user.email ?? "",
    name: user.name ?? "",
  };
}


/**
 * Ensures the current user has a linked student record.
 * Returns studentId if exists, otherwise null (caller should show setup).
 */
export async function ensureStudentProfile(): Promise<{ studentId: string } | { studentId: null }> {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { studentId: null };
  const profile = await getProfileAndStudentByUserId(session.user.id);
  if (!profile?.profile) return { studentId: null };
  if (profile.student) return { studentId: profile.student.id };
  return { studentId: null };
}

/**
 * Creates student record and links to current user's profile (Student Profile Setup).
 * Redirects to /student on success.
 */
export async function createStudentFromSetup(formData: FormData): Promise<SetupResult> {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await getProfileAndStudentByUserId(session.user.id);
  if (!profile?.profile) return { error: "Profile not found" };
  if (profile.student) {
    redirect("/student");
  }

  const firstName = (formData.get("firstName") as string)?.trim();
  const middleName = (formData.get("middleName") as string)?.trim() || null;
  const lastName = (formData.get("lastName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim() || profile.profile.email || null;
  const contactNo = (formData.get("contactNo") as string)?.trim() || null;
  const street = (formData.get("street") as string)?.trim() || null;
  const province = (formData.get("province") as string)?.trim() || null;
  const municipality = (formData.get("municipality") as string)?.trim() || null;
  const barangay = (formData.get("barangay") as string)?.trim() || null;

  if (!firstName || !lastName) return { error: "First name and last name are required" };

  const studentCode = await generateNextStudentCode();
  const student = await insertStudent({
    userProfileId: profile.profile.id,
    studentCode,
    firstName,
    middleName,
    lastName,
    email,
    contactNo,
  });
  if (!student) return { error: "Failed to create student record" };

  if (street || province || municipality || barangay) {
    await insertStudentAddress({
      studentId: student.id,
      street,
      province,
      municipality,
      barangay,
    });
  }

  revalidatePath("/student");
  revalidatePath("/student/setup");
  redirect("/student");
}
