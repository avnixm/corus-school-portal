import "server-only";
import {
  hasActiveCapability,
  listTeachersWithActiveCapabilityForSubject,
  listTeachersInDepartment,
  getTeacherById,
} from "@/db/queries";
export type CapabilityType = "major_department" | "ge" | "cross_department";

export function getCapabilityType(
  subject: { programId: string | null; isGe: boolean },
  teacherDepartmentProgramId: string | null
): CapabilityType {
  if (subject.isGe) return "ge";
  if (teacherDepartmentProgramId && subject.programId === teacherDepartmentProgramId) return "major_department";
  return "cross_department";
}

export async function validateTeacherCapability(teacherId: string, subjectId: string): Promise<boolean> {
  return hasActiveCapability(teacherId, subjectId);
}

export type EligibleTeacher = {
  teacherId: string;
  teacherName: string;
  email: string | null;
  departmentProgramId: string | null;
  eligibility: "recommended" | "department_match";
};

export async function listEligibleTeachersForSubject(
  subjectId: string,
  contextProgramId: string | null
): Promise<{ recommended: EligibleTeacher[]; departmentMatch: EligibleTeacher[] }> {
  const recommendedRows = await listTeachersWithActiveCapabilityForSubject(subjectId);
  const recommended: EligibleTeacher[] = recommendedRows.map((r) => ({
    teacherId: r.teacherId,
    teacherName: r.teacherName,
    email: r.email,
    departmentProgramId: r.departmentProgramId,
    eligibility: "recommended" as const,
  }));

  const recommendedIds = new Set(recommended.map((r) => r.teacherId));

  let departmentMatch: EligibleTeacher[] = [];
  if (contextProgramId) {
    const deptTeachers = await listTeachersInDepartment(contextProgramId);
    for (const t of deptTeachers) {
      if (recommendedIds.has(t.id)) continue;
      const hasCap = await hasActiveCapability(t.id, subjectId);
      if (!hasCap) {
        departmentMatch.push({
          teacherId: t.id,
          teacherName: `${t.firstName} ${t.lastName}`,
          email: t.email,
          departmentProgramId: t.departmentProgramId,
          eligibility: "department_match",
        });
      }
    }
  }

  return { recommended, departmentMatch };
}
