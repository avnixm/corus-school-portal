"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import { getUserProfileByUserId, generateNextStudentCode } from "@/db/queries";
import { db } from "@/lib/db";
import { students } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function createStudent(formData: FormData) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await getUserProfileByUserId(session.user.id);
  if (!profile || (profile.role !== "registrar" && profile.role !== "admin")) {
    return { error: "Unauthorized" };
  }

  const firstName = (formData.get("firstName") as string)?.trim();
  const middleName = (formData.get("middleName") as string)?.trim() || null;
  const lastName = (formData.get("lastName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim() || null;
  const contactNo = (formData.get("contactNo") as string)?.trim() || null;

  if (!firstName || !lastName) {
    return { error: "First name and last name are required" };
  }

  const studentCode = await generateNextStudentCode();
  await db.insert(students).values({
    studentCode,
    firstName,
    middleName,
    lastName,
    email,
    contactNo,
  });

  revalidatePath("/registrar/records/students");
  revalidatePath("/registrar/records");
  revalidatePath("/registrar");
  return { success: true };
}

export async function updateStudent(id: string, formData: FormData) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await getUserProfileByUserId(session.user.id);
  if (!profile || (profile.role !== "registrar" && profile.role !== "admin")) {
    return { error: "Unauthorized" };
  }

  const studentNo = (formData.get("studentNo") as string)?.trim() ?? null;
  const firstName = (formData.get("firstName") as string)?.trim();
  const middleName = (formData.get("middleName") as string)?.trim() || null;
  const lastName = (formData.get("lastName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim() || null;
  const contactNo = (formData.get("contactNo") as string)?.trim() || null;

  if (!firstName || !lastName) {
    return { error: "First name and last name are required" };
  }

  await db
    .update(students)
    .set({
      studentCode: studentNo,
      firstName,
      middleName,
      lastName,
      email,
      contactNo,
      updatedAt: new Date(),
    })
    .where(and(eq(students.id, id), isNull(students.deletedAt)));

  revalidatePath("/registrar/records/students");
  revalidatePath("/registrar/records");
  revalidatePath(`/registrar/students/${id}`);
  revalidatePath("/registrar");
  return { success: true };
}

export async function deleteStudent(id: string) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await getUserProfileByUserId(session.user.id);
  if (!profile || (profile.role !== "registrar" && profile.role !== "admin")) {
    return { error: "Unauthorized" };
  }

  await db
    .update(students)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(students.id, id));

  revalidatePath("/registrar/records/students");
  revalidatePath("/registrar/records");
  revalidatePath("/registrar");
  return { success: true };
}
