"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import {
  listTeachersWithDepartmentAndCapabilityCount,
  updateTeacherDepartment,
  listActiveCapabilitiesByTeacher,
} from "@/db/queries";

export async function listTeachersAction(search?: string) {
  const auth = await requireRole(["registrar", "admin"]);
  if ("error" in auth) return { error: auth.error, teachers: [] };
  const teachers = await listTeachersWithDepartmentAndCapabilityCount(search);
  return { teachers };
}

export async function updateTeacherDepartmentAction(teacherId: string, programId: string | null) {
  const auth = await requireRole(["registrar", "admin"]);
  if ("error" in auth) return { error: auth.error };

  await updateTeacherDepartment(teacherId, programId);
  revalidatePath("/registrar/teachers");
  return { success: true };
}

export async function getTeacherCapabilitiesAction(teacherId: string) {
  const auth = await requireRole(["registrar", "admin"]);
  if ("error" in auth) return { error: auth.error, capabilities: null };
  const rows = await listActiveCapabilitiesByTeacher(teacherId);
  const major: typeof rows = [];
  const ge: typeof rows = [];
  const cross: typeof rows = [];
  for (const r of rows) {
    if (r.capabilityType === "major_department") major.push(r);
    else if (r.capabilityType === "ge") ge.push(r);
    else cross.push(r);
  }
  return { capabilities: { major, ge, cross } };
}
