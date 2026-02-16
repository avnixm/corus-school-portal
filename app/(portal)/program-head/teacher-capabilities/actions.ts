"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import { getProgramHeadScopePrograms } from "@/lib/programHead/scope";
import {
  listCapabilityPackages,
  createCapabilityPackage,
  listCapabilityLines,
  addCapabilityLines,
  removeCapabilityLine,
  updateCapabilityLineNotes,
  submitCapabilityPackage,
  detectCapabilityIssues,
  getCapabilityPackageById,
  listTeachersInDepartment,
  getTeacherById,
  getSubjectById,
} from "@/db/queries";
import { getCapabilityType } from "@/lib/capabilities/eligibility";

export async function listCapabilityPackagesAction(filters: {
  programId: string;
  schoolYearId?: string | null;
  termId?: string | null;
}) {
  const auth = await requireRole(["program_head", "admin"]);
  if ("error" in auth) return { error: auth.error, packages: [] };
  const scope = await getProgramHeadScopePrograms(auth.userId);
  if (scope) {
    const { getProgramById } = await import("@/db/queries");
    const prog = await getProgramById(filters.programId);
    const code = prog?.code;
    if (!code || !scope.includes(code)) return { error: "Unauthorized program", packages: [] };
  }
  const packages = await listCapabilityPackages(filters);
  return { packages };
}

export async function createCapabilityPackageAction(values: {
  programId: string;
  schoolYearId?: string | null;
  termId?: string | null;
  title: string;
}) {
  const auth = await requireRole(["program_head", "admin"]);
  if ("error" in auth) return { error: auth.error };
  const pkg = await createCapabilityPackage({
    ...values,
    createdByUserId: auth.userId,
  });
  revalidatePath("/program-head/teacher-capabilities");
  return { success: true, packageId: pkg?.id };
}

export async function listCapabilityLinesAction(packageId: string) {
  const auth = await requireRole(["program_head", "admin"]);
  if ("error" in auth) return { error: auth.error, lines: [] };
  const pkg = await getCapabilityPackageById(packageId);
  if (!pkg) return { error: "Package not found", lines: [] };
  const lines = await listCapabilityLines(packageId);
  return { lines };
}

export async function addCapabilitiesAction(
  packageId: string,
  items: { teacherId: string; subjectIds: string[]; notes?: string | null }[]
) {
  const auth = await requireRole(["program_head", "admin"]);
  if ("error" in auth) return { error: auth.error };
  const pkg = await getCapabilityPackageById(packageId);
  if (!pkg || pkg.status !== "draft") return { error: "Package not editable" };

  const allLines: { teacherId: string; subjectId: string; capabilityType: "major_department" | "ge" | "cross_department"; notes?: string | null }[] = [];
  for (const item of items) {
    for (const subjectId of item.subjectIds) {
      const teacher = await getTeacherById(item.teacherId);
      const subject = await getSubjectById(subjectId);
      if (!teacher || !subject) continue;
      const capabilityType = getCapabilityType(
        { programId: subject.programId, isGe: subject.isGe },
        teacher.departmentProgramId
      );
      allLines.push({
        teacherId: item.teacherId,
        subjectId,
        capabilityType,
        notes: item.notes ?? null,
      });
    }
  }
  if (allLines.length === 0) return { error: "No valid lines to add" };
  await addCapabilityLines(packageId, allLines);
  revalidatePath("/program-head/teacher-capabilities");
  return { success: true };
}

export async function removeCapabilityLineAction(lineId: string) {
  const auth = await requireRole(["program_head", "admin"]);
  if ("error" in auth) return { error: auth.error };
  await removeCapabilityLine(lineId);
  revalidatePath("/program-head/teacher-capabilities");
  return { success: true };
}

export async function updateCapabilityLineNotesAction(lineId: string, notes: string | null) {
  const auth = await requireRole(["program_head", "admin"]);
  if ("error" in auth) return { error: auth.error };
  await updateCapabilityLineNotes(lineId, notes);
  revalidatePath("/program-head/teacher-capabilities");
  return { success: true };
}

export async function detectCapabilityIssuesAction(packageId: string) {
  const auth = await requireRole(["program_head", "admin"]);
  if ("error" in auth) return { error: auth.error, issues: [] };
  const issues = await detectCapabilityIssues(packageId);
  return { issues };
}

export async function submitCapabilityPackageAction(packageId: string) {
  const auth = await requireRole(["program_head", "admin"]);
  if ("error" in auth) return { error: auth.error };
  const pkg = await getCapabilityPackageById(packageId);
  if (!pkg || pkg.status !== "draft") return { error: "Package not in draft" };
  const { issues } = await detectCapabilityIssuesAction(packageId);
  if (issues && issues.length > 0) return { error: "Resolve issues before submitting", issues };
  await submitCapabilityPackage(packageId);
  revalidatePath("/program-head/teacher-capabilities");
  return { success: true };
}

export async function listSubjectsForCapabilityBuilderAction(programId: string) {
  const auth = await requireRole(["program_head", "admin"]);
  if ("error" in auth) return { error: auth.error, major: [], ge: [], cross: [] };
  const { getSubjectsList } = await import("@/db/queries");
  const all = await getSubjectsList();
  const major: typeof all = [];
  const ge: typeof all = [];
  const cross: typeof all = [];
  for (const s of all) {
    if (!s.active) continue;
    if (s.isGe) ge.push(s);
    else if (s.programId === programId) major.push(s);
    else if (s.programId) cross.push(s);
  }
  return { major, ge, cross };
}

export async function listDepartmentTeachersAction(programId: string) {
  const auth = await requireRole(["program_head", "admin"]);
  if ("error" in auth) return { error: auth.error, teachers: [] };
  const teachers = await listTeachersInDepartment(programId);
  return {
    teachers: teachers.map((t) => ({
      id: t.id,
      name: `${t.firstName} ${t.lastName}`,
      email: t.email,
    })),
  };
}
