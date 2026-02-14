"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import {
  getUserProfileByUserId,
  insertPendingApplication,
  getPendingApplicationByIdForAction,
  generateNextStudentCode,
  insertStudent,
  insertStudentAddress,
  updatePendingApplicationStatus,
} from "@/db/queries";

function parseName(fullName: string): { firstName: string; middleName: string | null; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], middleName: null, lastName: parts[0] };
  }
  if (parts.length === 2) {
    return { firstName: parts[0], middleName: null, lastName: parts[1] };
  }
  const [firstName, ...rest] = parts;
  const lastName = rest.pop() ?? "";
  const middleName = rest.length > 0 ? rest.join(" ") : null;
  return { firstName, middleName, lastName };
}

export async function submitPendingApplication(formData: FormData) {
  const sessionResponse = await auth.getSession();
  const session = sessionResponse?.data;

  if (!session?.user?.id) {
    return { error: "You must be logged in to submit" };
  }

  const userId = session.user.id;
  const name = (formData.get("name") as string)?.trim();
  const birthday = (formData.get("birthday") as string) || null;
  const program = (formData.get("program") as string) || null;
  const yearLevel = (formData.get("yearLevel") as string) || null;
  const street = (formData.get("street") as string)?.trim() || null;
  const province = (formData.get("province") as string)?.trim() || null;
  const municipality = (formData.get("municipality") as string)?.trim() || null;
  const barangay = (formData.get("barangay") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!name) {
    return { error: "Full name is required" };
  }

  const profile = await getUserProfileByUserId(userId);

  if (!profile || profile.role !== "student") {
    return { error: "Invalid user profile" };
  }

  const { firstName, middleName, lastName } = parseName(name);

  await insertPendingApplication({
    userProfileId: profile.id,
    firstName,
    middleName,
    lastName,
    birthday: birthday || null,
    program,
    yearLevel,
    street,
    province,
    municipality,
    barangay,
    notes,
  });

  redirect("/student/pending-approval");
}

export async function approvePendingApplication(
  applicationId: string,
  registrarProfileId: string
) {
  const app = await getPendingApplicationByIdForAction(applicationId);

  if (!app || app.status !== "pending") {
    return { error: "Application not found or already processed" };
  }

  const studentCode = await generateNextStudentCode();
  const student = await insertStudent({
    userProfileId: app.userProfileId,
    studentCode,
    firstName: app.firstName,
    middleName: app.middleName ?? null,
    lastName: app.lastName,
    birthday: app.birthday,
    program: app.program,
    yearLevel: app.yearLevel,
  });

  if (!student) {
    return { error: "Failed to create student" };
  }

  await insertStudentAddress({
    studentId: student.id,
    street: app.street ?? null,
    province: app.province ?? null,
    municipality: app.municipality ?? null,
    barangay: app.barangay ?? null,
  });

  await updatePendingApplicationStatus(
    applicationId,
    "approved",
    registrarProfileId
  );

  redirect("/registrar/pending");
}

export async function rejectPendingApplication(
  applicationId: string,
  registrarProfileId: string
) {
  const app = await getPendingApplicationByIdForAction(applicationId);

  if (!app || app.status !== "pending") {
    return { error: "Application not found or already processed" };
  }

  await updatePendingApplicationStatus(
    applicationId,
    "rejected",
    registrarProfileId
  );

  redirect("/registrar/pending");
}
