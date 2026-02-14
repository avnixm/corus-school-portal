"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import {
  addTeacherSubjectPermissions,
  removeTeacherSubjectPermission,
  updateTeacherSubjectPermission,
} from "@/db/queries";

export async function addTeacherSubjectPermissionsAction(formData: FormData) {
  const auth = await requireRole(["registrar", "admin"]);
  if ("error" in auth) return { error: auth.error };

  const teacherId = formData.get("teacherId") as string;
  const subjectIdsStr = formData.get("subjectIds") as string;
  const notes = formData.get("notes") as string | null;

  if (!teacherId || !subjectIdsStr) {
    return { error: "Teacher and subjects are required" };
  }

  const subjectIds = JSON.parse(subjectIdsStr);
  if (!Array.isArray(subjectIds) || subjectIds.length === 0) {
    return { error: "At least one subject is required" };
  }

  await addTeacherSubjectPermissions({
    teacherId,
    subjectIds,
    notes,
    createdByUserId: auth.userId,
  });

  revalidatePath("/registrar/teachers");
  return { success: true };
}

export async function removeTeacherSubjectPermissionAction(
  teacherId: string,
  subjectId: string
) {
  const auth = await requireRole(["registrar", "admin"]);
  if ("error" in auth) return { error: auth.error };

  await removeTeacherSubjectPermission(teacherId, subjectId);
  revalidatePath("/registrar/teachers");
  return { success: true };
}

export async function updateTeacherSubjectPermissionAction(
  teacherId: string,
  subjectId: string,
  updates: { notes?: string; canTeach?: boolean }
) {
  const auth = await requireRole(["registrar", "admin"]);
  if ("error" in auth) return { error: auth.error };

  await updateTeacherSubjectPermission(teacherId, subjectId, updates);
  revalidatePath("/registrar/teachers");
  return { success: true };
}
