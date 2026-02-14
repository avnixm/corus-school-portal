"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import { getUserProfileByUserId } from "@/db/queries";
import {
  createProgram,
  updateProgram,
  toggleProgramActive,
  deleteProgram,
  getProgramHeadAssignmentsByProgramCode,
  assignProgramHead,
  unassignProgramHead,
  insertAuditLog,
} from "@/db/queries";

async function requireAdmin() {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" as const, userId: null };
  const profile = await getUserProfileByUserId(session.user.id);
  if (!profile || profile.role !== "admin") {
    return { error: "Unauthorized" as const, userId: null };
  }
  return { error: null as null, userId: session.user.id };
}

export async function createProgramAction(formData: FormData) {
  const { error, userId } = await requireAdmin();
  if (error) return { error };

  const code = (formData.get("code") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  if (!code || !name) return { error: "Code and name are required" };

  try {
    await createProgram({ code, name, active: true });
    await insertAuditLog({
      actorUserId: userId,
      action: "PROGRAM_CREATE",
      entityType: "programs",
      after: { code, name },
    });
  } catch (e) {
    return { error: "Failed to create program (maybe duplicate code)" };
  }
  revalidatePath("/admin/programs");
  return { success: true };
}

export async function updateProgramAction(
  id: string,
  formData: FormData
) {
  const { error, userId } = await requireAdmin();
  if (error) return { error };

  const code = (formData.get("code") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const activeRaw = formData.get("active");
  const active = activeRaw === "true" || activeRaw === "on";

  await updateProgram(id, {
    ...(code && { code }),
    ...(name && { name }),
    active,
  });
  await insertAuditLog({
    actorUserId: userId,
    action: "PROGRAM_UPDATE",
    entityType: "programs",
    entityId: id,
    after: { code, name, active },
  });
  revalidatePath("/admin/programs");
  return { success: true };
}

export async function toggleProgramActiveAction(id: string, active: boolean) {
  const { error, userId } = await requireAdmin();
  if (error) return { error };

  await toggleProgramActive(id, active);
  await insertAuditLog({
    actorUserId: userId,
    action: "PROGRAM_UPDATE",
    entityType: "programs",
    entityId: id,
    after: { active },
  });
  revalidatePath("/admin/programs");
  return { success: true };
}

export async function deleteProgramAction(id: string, programCode: string) {
  const { error, userId } = await requireAdmin();
  if (error) return { error };

  const assignments = await getProgramHeadAssignmentsByProgramCode(programCode);
  if (assignments.length > 0) {
    return { error: "Cannot delete: program has program head assignments. Unassign them first." };
  }

  await deleteProgram(id);
  await insertAuditLog({
    actorUserId: userId,
    action: "PROGRAM_DELETE",
    entityType: "programs",
    entityId: id,
    after: { programCode },
  });
  revalidatePath("/admin/programs");
  return { success: true };
}

export async function assignProgramHeadAction(userId: string, programCode: string) {
  const { error, userId: actorId } = await requireAdmin();
  if (error) return { error };

  try {
    await assignProgramHead(userId, programCode);
    await insertAuditLog({
      actorUserId: actorId,
      action: "PROGRAM_HEAD_ASSIGN",
      entityType: "program_head_assignments",
      after: { userId, programCode },
    });
  } catch {
    return { error: "Assignment already exists or invalid" };
  }
  revalidatePath("/admin/programs");
  return { success: true };
}

export async function unassignProgramHeadAction(assignmentId: string) {
  const { error, userId } = await requireAdmin();
  if (error) return { error };

  await unassignProgramHead(assignmentId);
  await insertAuditLog({
    actorUserId: userId,
    action: "PROGRAM_HEAD_UNASSIGN",
    entityType: "program_head_assignments",
    entityId: assignmentId,
  });
  revalidatePath("/admin/programs");
  return { success: true };
}
