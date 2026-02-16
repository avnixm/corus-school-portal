/**
 * QW3: Profile completeness helper
 * Computes completeness percentage and returns missing required fields
 */

type Student = {
  firstName: string | null;
  lastName: string | null;
  birthday?: string | null;
  email?: string | null;
  contactNo?: string | null;
  sex?: string | null;
  gender?: string | null;
  religion?: string | null;
  placeOfBirth?: string | null;
  citizenship?: string | null;
  civilStatus?: string | null;
  lrn?: string | null;
  guardianName?: string | null;
  guardianMobile?: string | null;
  studentType?: string | null;
  lastSchoolId?: string | null;
  lastSchoolYearCompleted?: string | null;
  shsStrand?: string | null;
};

type StudentAddress = {
  street?: string | null;
  barangay?: string | null;
  municipality?: string | null;
  province?: string | null;
  zipCode?: string | null;
};

export type ProfileCompletenessResult = {
  percentage: number;
  missingFields: string[];
  isComplete: boolean;
};

export function computeProfileCompleteness(
  student: Student,
  address?: StudentAddress | null
): ProfileCompletenessResult {
  const requiredFields: Array<[keyof Student | string, string, () => boolean]> = [
    ["firstName", "First name", () => !!student.firstName && student.firstName !== "—"],
    ["lastName", "Last name", () => !!student.lastName && student.lastName !== "—"],
    ["birthday", "Birthday", () => !!student.birthday],
    ["sex", "Sex / Gender", () => !!student.sex || !!student.gender],
    ["religion", "Religion", () => !!student.religion],
    ["placeOfBirth", "Place of birth", () => !!student.placeOfBirth],
    ["citizenship", "Citizenship", () => !!student.citizenship],
    ["civilStatus", "Civil status", () => !!student.civilStatus],
    ["lrn", "LRN (12 digits)", () => !!student.lrn && /^\d{12}$/.test(String(student.lrn).trim())],
    ["email", "Email", () => !!student.email],
    ["contactNo", "Mobile number", () => !!student.contactNo],
    ["guardianName", "Guardian name", () => !!student.guardianName],
    ["guardianMobile", "Guardian mobile", () => !!student.guardianMobile],
    ["studentType", "Student type", () => !!student.studentType],
    ["lastSchoolId", "Previous school", () => !!student.lastSchoolId && String(student.lastSchoolId).trim() !== ""],
    ["lastSchoolYearCompleted", "Last grade completed", () => !!student.lastSchoolYearCompleted && String(student.lastSchoolYearCompleted).trim() !== ""],
    ["shsStrand", "SHS strand", () => !!student.shsStrand && String(student.shsStrand).trim() !== ""],
    ["address.street", "Street / House no.", () => !!address?.street],
    ["address.barangay", "Barangay", () => !!address?.barangay],
    ["address.municipality", "City/Municipality", () => !!address?.municipality],
    ["address.province", "Province", () => !!address?.province],
    ["address.zipCode", "ZIP code", () => !!address?.zipCode && /^\d{4}$/.test(String(address.zipCode).trim())],
  ];

  const missingFields: string[] = [];
  let filledCount = 0;

  for (const [_key, label, check] of requiredFields) {
    if (check()) {
      filledCount++;
    } else {
      missingFields.push(label);
    }
  }

  const percentage = Math.round((filledCount / requiredFields.length) * 100);
  const isComplete = missingFields.length === 0;

  return { percentage, missingFields, isComplete };
}
