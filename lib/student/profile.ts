import { db } from "@/lib/db";
import { students, studentAddresses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateNextStudentCode } from "@/db/queries";

export type StudentDraft = {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  suffix: string | null;
  email: string | null;
  contactNo: string | null;
  alternateContact: string | null;
  birthday: string | null;
  sex: string | null;
  gender: string | null;
  religion: string | null;
  placeOfBirth: string | null;
  citizenship: string | null;
  civilStatus: string | null;
  lrn: string | null;
  program: string | null;
  yearLevel: string | null;
  lastSchoolId: string | null;
  lastSchoolYearCompleted: string | null;
  shsStrand: string | null;
  guardianName: string | null;
  guardianRelationship: string | null;
  guardianMobile: string | null;
  guardianConsentAt: Date | null;
  studentType: string | null;
  addressStreet: string | null;
  addressBarangay: string | null;
  addressMunicipality: string | null;
  addressProvince: string | null;
  addressZip: string | null;
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

    const ex = existing as typeof existing & { 
      sex?: string | null; 
      gender?: string | null; 
      religion?: string | null; 
      suffix?: string | null;
      alternateContact?: string | null;
      placeOfBirth?: string | null;
      citizenship?: string | null;
      civilStatus?: string | null;
      lrn?: string | null;
      shsStrand?: string | null;
      guardianName?: string | null; 
      guardianRelationship?: string | null; 
      guardianMobile?: string | null;
      guardianConsentAt?: Date | null;
      studentType?: string | null;
    };
    return {
      student: {
        id: existing.id,
        firstName: existing.firstName,
        middleName: existing.middleName,
        lastName: existing.lastName,
        suffix: ex?.suffix ?? null,
        email: existing.email,
        contactNo: existing.contactNo,
        alternateContact: ex?.alternateContact ?? null,
        birthday: existing.birthday,
        sex: ex?.sex ?? null,
        gender: ex?.gender ?? null,
        religion: ex?.religion ?? null,
        placeOfBirth: ex?.placeOfBirth ?? null,
        citizenship: ex?.citizenship ?? null,
        civilStatus: ex?.civilStatus ?? null,
        lrn: ex?.lrn ?? null,
        program: existing.program,
        yearLevel: existing.yearLevel,
        lastSchoolId: existing.lastSchoolId,
        lastSchoolYearCompleted: existing.lastSchoolYearCompleted,
        shsStrand: ex?.shsStrand ?? null,
        guardianName: ex?.guardianName ?? null,
        guardianRelationship: ex?.guardianRelationship ?? null,
        guardianMobile: ex?.guardianMobile ?? null,
        guardianConsentAt: ex?.guardianConsentAt ?? null,
        studentType: ex?.studentType ?? null,
        addressStreet: addr?.street ?? null,
        addressBarangay: addr?.barangay ?? null,
        addressMunicipality: addr?.municipality ?? null,
        addressProvince: addr?.province ?? null,
        addressZip: addr?.zipCode ?? null,
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

  const c = created as typeof created & { 
    sex?: string | null; 
    gender?: string | null; 
    religion?: string | null;
    suffix?: string | null;
    alternateContact?: string | null;
    placeOfBirth?: string | null;
    citizenship?: string | null;
    civilStatus?: string | null;
    lrn?: string | null;
    shsStrand?: string | null;
    guardianName?: string | null; 
    guardianRelationship?: string | null; 
    guardianMobile?: string | null;
    guardianConsentAt?: Date | null;
    studentType?: string | null;
  };
  return {
    student: {
      id: created.id,
      firstName: created.firstName,
      middleName: created.middleName,
      lastName: created.lastName,
      suffix: c?.suffix ?? null,
      email: created.email,
      contactNo: created.contactNo,
      alternateContact: c?.alternateContact ?? null,
      birthday: created.birthday,
      sex: c?.sex ?? null,
      gender: c?.gender ?? null,
      religion: c?.religion ?? null,
      placeOfBirth: c?.placeOfBirth ?? null,
      citizenship: c?.citizenship ?? null,
      civilStatus: c?.civilStatus ?? null,
      lrn: c?.lrn ?? null,
      program: created.program,
      yearLevel: created.yearLevel,
      lastSchoolId: created.lastSchoolId,
      lastSchoolYearCompleted: created.lastSchoolYearCompleted,
      shsStrand: c?.shsStrand ?? null,
      guardianName: c?.guardianName ?? null,
      guardianRelationship: c?.guardianRelationship ?? null,
      guardianMobile: c?.guardianMobile ?? null,
      guardianConsentAt: c?.guardianConsentAt ?? null,
      studentType: c?.studentType ?? null,
      addressStreet: addr?.street ?? null,
      addressBarangay: addr?.barangay ?? null,
      addressMunicipality: addr?.municipality ?? null,
      addressProvince: addr?.province ?? null,
      addressZip: addr?.zipCode ?? null,
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
    suffix: string | null;
    email: string | null;
    contactNo: string | null;
    alternateContact: string | null;
    birthday: string | null;
    sex: string | null;
    gender: string | null;
    religion: string | null;
    placeOfBirth: string | null;
    citizenship: string | null;
    civilStatus: string | null;
    lrn: string | null;
    program: string | null;
    yearLevel: string | null;
    lastSchoolId: string | null;
    lastSchoolYearCompleted: string | null;
    shsStrand: string | null;
    guardianName: string | null;
    guardianRelationship: string | null;
    guardianMobile: string | null;
    guardianConsentAt: Date | null;
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
    zipCode: string | null;
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
