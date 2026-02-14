"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { getProfileAndStudentByUserId } from "@/db/queries";
import {
  getOrCreateStudentForUser,
  updateStudentStep,
  updateStudentAddress,
} from "@/lib/student/profile";
import { db } from "@/lib/db";
import { studentAddresses, students } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const personalSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(128),
  middleName: z.string().max(128).optional().nullable(),
  lastName: z.string().min(1, "Last name is required").max(128),
  birthday: z.string().min(1, "Date of birth is required"),
});

const contactSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  mobile: z.string().min(1, "Mobile number is required").max(32),
});

const addressSchema = z.object({
  addressLine1: z.string().min(1, "Street / House no. is required").max(255),
  barangay: z.string().min(1, "Barangay is required").max(128),
  city: z.string().min(1, "City is required").max(128),
  province: z.string().min(1, "Province is required").max(128),
  zip: z.string().max(16).optional().nullable(),
});

const guardianSchema = z.object({
  guardianName: z.string().min(1, "Guardian name is required").max(255),
  guardianRelationship: z.string().min(1, "Relationship is required").max(64),
  guardianMobile: z.string().min(1, "Guardian mobile is required").max(32),
});

const academicSchema = z.object({
  studentType: z.enum(["New", "Transferee", "Returnee"]),
  previousSchool: z.string().max(64).optional().nullable(),
  lastGradeCompleted: z.string().max(32).optional().nullable(),
});

export type ProfileStepPayload =
  | { step: 1; data: z.infer<typeof personalSchema> }
  | { step: 2; data: z.infer<typeof contactSchema> }
  | { step: 3; data: z.infer<typeof addressSchema> }
  | { step: 4; data: z.infer<typeof guardianSchema> }
  | { step: 5; data: z.infer<typeof academicSchema> };

export type ProfileInitial = {
  ok: true;
  email: string;
  student: {
    id: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    email: string | null;
    contactNo: string | null;
    birthday: string | null;
    addressStreet: string | null;
    addressBarangay: string | null;
    addressMunicipality: string | null;
    addressProvince: string | null;
    guardianName: string | null;
    guardianRelationship: string | null;
    guardianMobile: string | null;
    studentType: string | null;
    lastSchoolId: string | null;
    lastSchoolYearCompleted: string | null;
  };
} | { ok: false; redirect: "login" | "dashboard" };

async function getAddressForStudent(studentId: string) {
  const [addr] = await db
    .select()
    .from(studentAddresses)
    .where(eq(studentAddresses.studentId, studentId))
    .limit(1);
  return addr;
}

export async function getProfileInitial(): Promise<ProfileInitial> {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { ok: false, redirect: "login" };

  const profile = await getProfileAndStudentByUserId(session.user.id);
  if (!profile?.profile) return { ok: false, redirect: "login" };
  if (profile.profile.role !== "student") return { ok: false, redirect: "login" };

  const user = await getCurrentUserWithRole();
  if (!user || user.role !== "student") return { ok: false, redirect: "login" };

  const studentRow = profile.student as typeof profile.student & {
    guardianName?: string | null;
    guardianRelationship?: string | null;
    guardianMobile?: string | null;
    studentType?: string | null;
    profileCompletedAt?: Date | null;
  };

  if (profile.student) {
    if (studentRow?.profileCompletedAt) return { ok: false, redirect: "dashboard" };
    const addr = await getAddressForStudent(profile.student.id);
    return {
      ok: true,
      email: user.email ?? "",
      student: {
        id: profile.student.id,
        firstName: profile.student.firstName,
        middleName: profile.student.middleName,
        lastName: profile.student.lastName,
        email: profile.student.email,
        contactNo: profile.student.contactNo,
        birthday: profile.student.birthday ?? null,
        addressStreet: addr?.street ?? null,
        addressBarangay: addr?.barangay ?? null,
        addressMunicipality: addr?.municipality ?? null,
        addressProvince: addr?.province ?? null,
        guardianName: studentRow?.guardianName ?? null,
        guardianRelationship: studentRow?.guardianRelationship ?? null,
        guardianMobile: studentRow?.guardianMobile ?? null,
        studentType: studentRow?.studentType ?? null,
        lastSchoolId: profile.student.lastSchoolId,
        lastSchoolYearCompleted: profile.student.lastSchoolYearCompleted,
      },
    };
  }

  const result = await getOrCreateStudentForUser(
    profile.profile.id,
    user.email ?? null
  );
  if (!result) return { ok: false, redirect: "login" };

  const s = result.student;
  return {
    ok: true,
    email: user.email ?? "",
    student: {
      id: s.id,
      firstName: s.firstName,
      middleName: s.middleName,
      lastName: s.lastName,
      email: s.email,
      contactNo: s.contactNo,
      birthday: s.birthday,
      addressStreet: s.addressStreet,
      addressBarangay: s.addressBarangay,
      addressMunicipality: s.addressMunicipality,
      addressProvince: s.addressProvince,
      guardianName: s.guardianName,
      guardianRelationship: s.guardianRelationship,
      guardianMobile: s.guardianMobile,
      studentType: s.studentType,
      lastSchoolId: s.lastSchoolId,
      lastSchoolYearCompleted: s.lastSchoolYearCompleted,
    },
  };
}

export type SaveResult = { ok: true } | { ok: false; error: string };

export async function saveStudentProfileStep(payload: ProfileStepPayload): Promise<SaveResult> {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { ok: false, error: "Not authenticated" };

  const profile = await getProfileAndStudentByUserId(session.user.id);
  if (!profile?.profile || !profile.student)
    return { ok: false, error: "Profile or student not found" };

  const studentId = profile.student.id;

  if (payload.step === 1) {
    const parsed = personalSchema.safeParse(payload.data);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const msg = first?.message ?? "Invalid data";
      return { ok: false, error: msg };
    }
    await updateStudentStep(studentId, {
      firstName: parsed.data.firstName,
      middleName: parsed.data.middleName || null,
      lastName: parsed.data.lastName,
      birthday: parsed.data.birthday,
    });
  } else if (payload.step === 2) {
    const parsed = contactSchema.safeParse(payload.data);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const msg = first?.message ?? "Invalid data";
      return { ok: false, error: msg };
    }
    await updateStudentStep(studentId, {
      email: parsed.data.email,
      contactNo: parsed.data.mobile,
    });
  } else if (payload.step === 3) {
    const parsed = addressSchema.safeParse(payload.data);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const msg = first?.message ?? "Invalid data";
      return { ok: false, error: msg };
    }
    await updateStudentAddress(studentId, {
      street: parsed.data.addressLine1,
      barangay: parsed.data.barangay,
      municipality: parsed.data.city,
      province: parsed.data.province,
    });
  } else if (payload.step === 4) {
    const parsed = guardianSchema.safeParse(payload.data);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const msg = first?.message ?? "Invalid data";
      return { ok: false, error: msg };
    }
    await updateStudentStep(studentId, {
      guardianName: parsed.data.guardianName,
      guardianRelationship: parsed.data.guardianRelationship,
      guardianMobile: parsed.data.guardianMobile,
    });
  } else if (payload.step === 5) {
    const parsed = academicSchema.safeParse(payload.data);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const msg = first?.message ?? "Invalid data";
      return { ok: false, error: msg };
    }
    await updateStudentStep(studentId, {
      studentType: parsed.data.studentType,
      lastSchoolId: parsed.data.previousSchool || null,
      lastSchoolYearCompleted: parsed.data.lastGradeCompleted || null,
    });
  }

  revalidatePath("/student/complete-profile");
  return { ok: true };
}

export async function finalizeStudentProfile(confirmed: boolean): Promise<SaveResult> {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { ok: false, error: "Not authenticated" };
  if (!confirmed) return { ok: false, error: "Please confirm the information is correct" };

  const profile = await getProfileAndStudentByUserId(session.user.id);
  if (!profile?.profile || !profile.student)
    return { ok: false, error: "Profile or student not found" };

  const s = profile.student;
  const addr = await getAddressForStudent(s.id);

  const errors: string[] = [];
  if (!s.firstName || s.firstName === "—") errors.push("First name");
  if (!s.lastName || s.lastName === "—") errors.push("Last name");
  if (!s.birthday) errors.push("Date of birth");
  if (!s.email) errors.push("Email");
  if (!s.contactNo) errors.push("Mobile number");
  if (!addr?.street) errors.push("Address line");
  if (!addr?.barangay) errors.push("Barangay");
  if (!addr?.municipality) errors.push("City");
  if (!addr?.province) errors.push("Province");
  const studentExt = s as typeof s & { guardianName?: string | null; guardianRelationship?: string | null; guardianMobile?: string | null; studentType?: string | null };
  if (!studentExt?.guardianName) errors.push("Guardian name");
  if (!studentExt?.guardianRelationship) errors.push("Guardian relationship");
  if (!studentExt?.guardianMobile) errors.push("Guardian mobile");
  if (!studentExt?.studentType) errors.push("Student type");

  if (errors.length > 0) {
    return { ok: false, error: `Missing required fields: ${errors.join(", ")}` };
  }

  await updateStudentStep(profile.student.id, {
    profileCompletedAt: new Date(),
  });

  revalidatePath("/student");
  revalidatePath("/student/complete-profile");
  redirect("/student");
}
