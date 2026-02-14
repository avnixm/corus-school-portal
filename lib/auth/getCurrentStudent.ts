import "server-only";
import { getCurrentUserWithRole } from "./getCurrentUserWithRole";
import { getProfileAndStudentByUserId } from "@/db/queries";

export type CurrentStudent = {
  readonly studentId: string;
  readonly userProfileId: string;
  readonly profile: {
    id: string;
    userId: string;
    email: string | null;
    fullName: string | null;
    role: string;
  };
  readonly student: {
    id: string;
    studentCode: string | null;
    firstName: string;
    middleName: string | null;
    lastName: string;
    program: string | null;
    yearLevel: string | null;
  };
};

export type CurrentUserWithStudent = {
  readonly profile: {
    id: string;
    userId: string;
    email: string | null;
    fullName: string | null;
    role: string;
  };
  readonly student: {
    id: string;
    studentCode: string | null;
    firstName: string;
    middleName: string | null;
    lastName: string;
    program: string | null;
    yearLevel: string | null;
  } | null;
};

/**
 * Resolves the current auth user to their linked user_profile and student record.
 * Returns profile + student (student may be null if not yet linked).
 * Returns null if not authenticated or no user_profile exists.
 */
export async function getCurrentStudent(): Promise<CurrentStudent | null> {
  const data = await getCurrentUserWithStudent();
  if (!data?.student?.id || String(data.student.id).trim() === "") return null;
  return {
    studentId: data.student.id,
    userProfileId: data.profile.id,
    profile: data.profile,
    student: data.student,
  };
}

/**
 * Gets current user's profile and linked student (student may be null).
 * Use for Profile page and pages that need profile even without student.
 */
export async function getCurrentUserWithStudent(): Promise<CurrentUserWithStudent | null> {
  const user = await getCurrentUserWithRole();
  if (!user?.userId) return null;

  const result = await getProfileAndStudentByUserId(user.userId);
  if (!result) return null;

  const { profile, student } = result;

  return {
    profile: {
      id: profile.id,
      userId: profile.userId,
      email: profile.email,
      fullName: profile.fullName,
      role: profile.role,
    },
    student: student
      ? {
          id: student.id,
          studentCode: student.studentCode,
          firstName: student.firstName,
          middleName: student.middleName,
          lastName: student.lastName,
          program: student.program,
          yearLevel: student.yearLevel,
        }
      : null,
  };
}
