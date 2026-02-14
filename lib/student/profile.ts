import { db } from "@/lib/db";
import { students, studentAddresses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateNextStudentCode } from "@/db/queries";

export type StudentDraft = {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  email: string | null;
  contactNo: string | null;
  birthday: string | null;
  program: string | null;
  yearLevel: string | null;
  lastSchoolId: string | null;
  lastSchoolYearCompleted: string | null;
  guardianName: string | null;
  guardianRelationship: string | null;
  guardianMobile: string | null;
  studentType: string | null;
  addressStreet: string | null;
  addressBarangay: string | null;
  addressMunicipality: string | null;
  addressProvince: string | null;
};

export async function getOrCreateStudentForUser(userProfileId: string, defaultEmail: string | null): Promise<{ student: StudentDraft; addressId: string | null } | null> {
  const [existing] = await db
    .select()
    .from(students)
    .where(eq(students.userProfileId, userProfileId))
    .limit(1);

  if (existing) {
    const [addr] = await db
      .select()
      .from(studentAddresses)
      .where(eq(studentAddresses.studentId, existing.id))
      .limit(1);

    const ex = existing as typeof existing & { guardianName?: string | null; guardianRelationship?: string | null; guardianMobile?: string | null; studentType?: string | null };
    return {
      student: {
        id: existing.id,
        firstName: existing.firstName,
        middleName: existing.middleName,
        lastName: existing.lastName,
        email: existing.email,
        contactNo: existing.contactNo,
        birthday: existing.birthday,
        program: existing.program,
        yearLevel: existing.yearLevel,
        lastSchoolId: existing.lastSchoolId,
        lastSchoolYearCompleted: existing.lastSchoolYearCompleted,
        guardianName: ex?.guardianName ?? null,
        guardianRelationship: ex?.guardianRelationship ?? null,
        guardianMobile: ex?.guardianMobile ?? null,
        studentType: ex?.studentType ?? null,
        addressStreet: addr?.street ?? null,
        addressBarangay: addr?.barangay ?? null,
        addressMunicipality: addr?.municipality ?? null,
        addressProvince: addr?.province ?? null,
      },
      addressId: addr?.id ?? null,
    };
  }

  const studentCode = await generateNextStudentCode();
  const [created] = await db
    .insert(students)
    .values({
      userProfileId,
      studentCode,
      firstName: "—",
      lastName: "—",
      email: defaultEmail ?? null,
    })
    .returning();

  if (!created) return null;

  const [addr] = await db
    .insert(studentAddresses)
    .values({ studentId: created.id })
    .returning();

  const c = created as typeof created & { guardianName?: string | null; guardianRelationship?: string | null; guardianMobile?: string | null; studentType?: string | null };
  return {
    student: {
      id: created.id,
      firstName: created.firstName,
      middleName: created.middleName,
      lastName: created.lastName,
      email: created.email,
      contactNo: created.contactNo,
      birthday: created.birthday,
      program: created.program,
      yearLevel: created.yearLevel,
      lastSchoolId: created.lastSchoolId,
      lastSchoolYearCompleted: created.lastSchoolYearCompleted,
      guardianName: c?.guardianName ?? null,
      guardianRelationship: c?.guardianRelationship ?? null,
      guardianMobile: c?.guardianMobile ?? null,
      studentType: c?.studentType ?? null,
      addressStreet: addr?.street ?? null,
      addressBarangay: addr?.barangay ?? null,
      addressMunicipality: addr?.municipality ?? null,
      addressProvince: addr?.province ?? null,
    },
    addressId: addr?.id ?? null,
  };
}

export async function updateStudentStep(
  studentId: string,
  payload: Partial<{
    firstName: string;
    middleName: string | null;
    lastName: string;
    email: string | null;
    contactNo: string | null;
    birthday: string | null;
    program: string | null;
    yearLevel: string | null;
    lastSchoolId: string | null;
    lastSchoolYearCompleted: string | null;
    guardianName: string | null;
    guardianRelationship: string | null;
    guardianMobile: string | null;
    studentType: string | null;
    profileCompletedAt: Date | null;
  }>
) {
  await db
    .update(students)
    .set({ ...payload, updatedAt: new Date() })
    .where(eq(students.id, studentId));
}

export async function updateStudentAddress(
  studentId: string,
  payload: Partial<{
    street: string | null;
    barangay: string | null;
    municipality: string | null;
    province: string | null;
  }>
) {
  const [existing] = await db
    .select()
    .from(studentAddresses)
    .where(eq(studentAddresses.studentId, studentId))
    .limit(1);

  if (existing) {
    await db
      .update(studentAddresses)
      .set(payload)
      .where(eq(studentAddresses.id, existing.id));
  } else {
    await db.insert(studentAddresses).values({
      studentId,
      ...payload,
    });
  }
}
