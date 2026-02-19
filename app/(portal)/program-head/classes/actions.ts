"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { getProgramHeadScopePrograms } from "@/lib/programHead/scope";
import { getSectionById, getProgramById, createSection, updateSection, toggleSectionActive } from "@/db/queries";

/** Ensures the section belongs to a program in the program head's scope. Returns error message or null if allowed. */
export async function assertSectionInProgramHeadScope(
  sectionId: string,
  userId: string
): Promise<{ error: string } | null> {
  const scope = await getProgramHeadScopePrograms(userId);
  const section = await getSectionById(sectionId);
  if (!section) return { error: "Section not found" };
  if (!section.programId) return { error: "Section has no program" };
  const program = await getProgramById(section.programId);
  if (!program) return { error: "Program not found" };
  if (scope !== null && (scope.length === 0 || !scope.includes(program.code))) {
    return { error: "You do not have access to this section" };
  }
  return null;
}

export async function createClassAction(formData: FormData) {
  const user = await getCurrentUserWithRole();
  if (!user || user.role !== "program_head") return { error: "Unauthorized" };

  const scope = await getProgramHeadScopePrograms(user.userId);
  if (scope !== null && scope.length === 0) return { error: "Set your program scope in Settings first" };

  const programId = (formData.get("programId") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const yearLevel = (formData.get("yearLevel") as string)?.trim() || null;
  const maxCapacityRaw = (formData.get("maxCapacity") as string)?.trim();
  const maxCapacity =
    maxCapacityRaw === "" || maxCapacityRaw === undefined
      ? null
      : Math.max(0, parseInt(maxCapacityRaw, 10));
  if (maxCapacity !== null && (Number.isNaN(maxCapacity) || maxCapacity < 0))
    return { error: "Max students must be a non-negative number" };

  if (!programId || !name) return { error: "Program and section name are required" };

  if (scope !== null) {
    const program = await getProgramById(programId);
    if (!program || !scope.includes(program.code)) return { error: "You can only create sections for your programs" };
  }

  await createSection({ programId, name, yearLevel, maxCapacity: maxCapacity ?? null });
  revalidatePath("/program-head/classes");
  revalidatePath("/program-head/sections");
  return { success: true };
}

export async function updateClassAction(sectionId: string, formData: FormData) {
  const user = await getCurrentUserWithRole();
  if (!user || user.role !== "program_head") return { error: "Unauthorized" };

  const err = await assertSectionInProgramHeadScope(sectionId, user.userId);
  if (err) return err;

  const scope = await getProgramHeadScopePrograms(user.userId);
  const programId = (formData.get("programId") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const yearLevel = (formData.get("yearLevel") as string)?.trim() || null;
  const maxCapacityRaw = (formData.get("maxCapacity") as string)?.trim();
  const maxCapacity =
    maxCapacityRaw === "" || maxCapacityRaw === undefined
      ? null
      : Math.max(0, parseInt(maxCapacityRaw, 10));
  if (maxCapacity !== null && (Number.isNaN(maxCapacity) || maxCapacity < 0))
    return { error: "Max students must be a non-negative number" };
  if (!name) return { error: "Section name is required" };

  if (programId && scope !== null) {
    const program = await getProgramById(programId);
    if (!program || !scope.includes(program.code)) return { error: "You can only assign sections to your programs" };
  }

  await updateSection(sectionId, {
    ...(programId && { programId }),
    name,
    yearLevel,
    maxCapacity: maxCapacity ?? null,
  });
  revalidatePath("/program-head/classes");
  revalidatePath("/program-head/sections");
  return { success: true };
}

export async function deactivateClassAction(sectionId: string) {
  const user = await getCurrentUserWithRole();
  if (!user || user.role !== "program_head") return { error: "Unauthorized" };

  const err = await assertSectionInProgramHeadScope(sectionId, user.userId);
  if (err) return err;

  await toggleSectionActive(sectionId, false);
  revalidatePath("/program-head/classes");
  revalidatePath("/program-head/sections");
  return { success: true };
}
