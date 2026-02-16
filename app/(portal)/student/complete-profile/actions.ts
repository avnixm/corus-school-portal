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
import { computeProfileCompleteness } from "@/lib/student/profileCompleteness";
import { db } from "@/lib/db";
import { studentAddresses, students } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const personalSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(128),
  middleName: z.string().max(128).optional().nullable(),
  lastName: z.string().min(1, "Last name is required").max(128),
  birthday: z.string().min(1, "Date of birth is required"),
  sex: z.enum(["Male", "Female", "Other"], { message: "Sex / Gender is required" }),
  gender: z.enum(["Male", "Female", "Other"], { message: "Sex / Gender is required" }),
  religion: z.string().min(1, "Religion is required").max(128),
  placeOfBirth: z.string().min(1, "Place of birth is required").max(128),
  citizenship: z.string().min(1, "Citizenship is required").max(64),
  civilStatus: z.string().min(1, "Civil status is required").max(32),
  lrn: z.string().min(1, "LRN (Learner Reference Number) is required").max(16).regex(/^\d{12}$/, "LRN must be 12 digits"),
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
  zip: z.string().min(1, "ZIP code is required").regex(/^\d{4}$/, "Philippine ZIP must be 4 digits").max(16),
});

const guardianSchema = z.object({
  guardianName: z.string().min(1, "Guardian name is required").max(255),
  guardianRelationship: z.string().min(1, "Relationship is required").max(64),
  guardianMobile: z.string().min(1, "Guardian mobile is required").max(32),
});

const academicSchema = z.object({
  studentType: z.enum(["New", "Transferee", "Returnee"]),
  previousSchool: z.string().min(1, "Previous school is required").max(128),
  lastGradeCompleted: z.string().min(1, "Last grade completed is required").max(32),
  shsStrand: z.string().min(1, "SHS strand is required").max(64),
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
    suffix: string | null;
    email: string | null;
    contactNo: string | null;
    alternateContact: string | null;
    birthday: string | null;
    placeOfBirth: string | null;
    citizenship: string | null;
    civilStatus: string | null;
    sex: string | null;
    gender: string | null;
    religion: string | null;
    lrn: string | null;
    addressStreet: string | null;
    addressBarangay: string | null;
    addressMunicipality: string | null;
    addressProvince: string | null;
    addressZip: string | null;
    mailingStreet: string | null;
    mailingBarangay: string | null;
    mailingMunicipality: string | null;
    mailingProvince: string | null;
    mailingZip: string | null;
    sameAsMailing: boolean | null;
    emergencyName: string | null;
    emergencyRelationship: string | null;
    emergencyMobile: string | null;
    guardianName: string | null;
    guardianRelationship: string | null;
    guardianMobile: string | null;
    guardianConsentAt: string | null;
    studentType: string | null;
    lastSchoolId: string | null;
    lastSchoolYearCompleted: string | null;
    shsStrand: string | null;
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
    sex?: string | null;
    gender?: string | null;
    religion?: string | null;
    guardianName?: string | null;
    guardianRelationship?: string | null;
    guardianMobile?: string | null;
    studentType?: string | null;
    profileCompletedAt?: Date | null;
  };

  const profileCompletedAt = (profile.student as { profileCompletedAt?: Date | null })?.profileCompletedAt;

  if (profile.student) {
    const addr = await getAddressForStudent(profile.student.id);
    const completeness = computeProfileCompleteness(profile.student, addr ?? null);

    if (studentRow?.profileCompletedAt && completeness.isComplete) {
      return { ok: false, redirect: "dashboard" };
    }
    return {
      ok: true,
      email: user.email ?? "",
      student: {
        id: profile.student.id,
        firstName: profile.student.firstName,
        middleName: profile.student.middleName,
        lastName: profile.student.lastName,
        suffix: (studentRow as any)?.suffix ?? null,
        email: profile.student.email,
        contactNo: profile.student.contactNo,
        alternateContact: (studentRow as any)?.alternateContact ?? null,
        birthday: profile.student.birthday ?? null,
        placeOfBirth: (studentRow as any)?.placeOfBirth ?? null,
        citizenship: (studentRow as any)?.citizenship ?? null,
        civilStatus: (studentRow as any)?.civilStatus ?? null,
        sex: studentRow?.sex ?? null,
        gender: studentRow?.gender ?? null,
        religion: studentRow?.religion ?? null,
        lrn: (studentRow as any)?.lrn ?? null,
        addressStreet: addr?.street ?? null,
        addressBarangay: addr?.barangay ?? null,
        addressMunicipality: addr?.municipality ?? null,
        addressProvince: addr?.province ?? null,
        addressZip: addr?.zipCode ?? null,
        mailingStreet: null,
        mailingBarangay: null,
        mailingMunicipality: null,
        mailingProvince: null,
        mailingZip: null,
        sameAsMailing: null,
        emergencyName: null,
        emergencyRelationship: null,
        emergencyMobile: null,
        guardianName: studentRow?.guardianName ?? null,
        guardianRelationship: studentRow?.guardianRelationship ?? null,
        guardianMobile: studentRow?.guardianMobile ?? null,
        guardianConsentAt: (studentRow as any)?.guardianConsentAt?.toISOString() ?? null,
        studentType: studentRow?.studentType ?? null,
        lastSchoolId: profile.student.lastSchoolId,
        lastSchoolYearCompleted: profile.student.lastSchoolYearCompleted,
        shsStrand: (studentRow as any)?.shsStrand ?? null,
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
      suffix: s.suffix,
      email: s.email,
      contactNo: s.contactNo,
      alternateContact: s.alternateContact,
      birthday: s.birthday,
      placeOfBirth: s.placeOfBirth,
      citizenship: s.citizenship,
      civilStatus: s.civilStatus,
      sex: s.sex,
      gender: s.gender,
      religion: s.religion,
      lrn: s.lrn,
      addressStreet: s.addressStreet,
      addressBarangay: s.addressBarangay,
      addressMunicipality: s.addressMunicipality,
      addressProvince: s.addressProvince,
      addressZip: s.addressZip,
      mailingStreet: null,
      mailingBarangay: null,
      mailingMunicipality: null,
      mailingProvince: null,
      mailingZip: null,
      sameAsMailing: null,
      emergencyName: null,
      emergencyRelationship: null,
      emergencyMobile: null,
      guardianName: s.guardianName,
      guardianRelationship: s.guardianRelationship,
      guardianMobile: s.guardianMobile,
      guardianConsentAt: s.guardianConsentAt?.toISOString() ?? null,
      studentType: s.studentType,
      lastSchoolId: s.lastSchoolId,
      lastSchoolYearCompleted: s.lastSchoolYearCompleted,
      shsStrand: s.shsStrand,
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
      sex: parsed.data.sex,
      gender: parsed.data.gender,
      religion: parsed.data.religion,
      placeOfBirth: parsed.data.placeOfBirth,
      citizenship: parsed.data.citizenship,
      civilStatus: parsed.data.civilStatus,
      lrn: parsed.data.lrn,
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
      zipCode: parsed.data.zip,
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
      lastSchoolId: parsed.data.previousSchool,
      lastSchoolYearCompleted: parsed.data.lastGradeCompleted,
      shsStrand: parsed.data.shsStrand,
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

  const completeness = computeProfileCompleteness(s, addr ?? null);
  if (!completeness.isComplete) {
    return {
      ok: false,
      error: `Complete all required fields before finishing: ${completeness.missingFields.join(", ")}. Go back and fill in the missing information.`,
    };
  }

  await updateStudentStep(profile.student.id, {
    profileCompletedAt: new Date(),
  });

  revalidatePath("/student");
  revalidatePath("/student/complete-profile");
  redirect("/student");
}
