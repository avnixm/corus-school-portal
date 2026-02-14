// path: app/(portal)/registrar/curriculum/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import {
  getCurriculumVersionById,
  createCurriculumVersion,
  cloneCurriculumVersion as dbCloneCurriculumVersion,
  updateCurriculumVersionStatus,
  hasOtherPublishedCurriculumForProgramYear,
  getCurriculumBlocksByVersionId,
  getOrCreateCurriculumBlock,
  getCurriculumBlockSubjectsByBlockId,
  addCurriculumBlockSubject,
  updateCurriculumBlockSubject,
  removeCurriculumBlockSubject,
  getCurriculumVersionsList,
} from "@/db/queries";
import { getSubjectsList } from "@/db/queries";

async function requireRegistrar() {
  const auth = await requireRole(["registrar", "admin"]);
  if ("error" in auth) return { error: auth.error as string, userId: null as string | null };
  return { error: null, userId: auth.userId };
}

export async function createCurriculumVersionAction(formData: FormData) {
  const { error, userId } = await requireRegistrar();
  if (error) return { error };
  const programId = (formData.get("programId") as string)?.trim();
  const schoolYearId = (formData.get("schoolYearId") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  if (!programId || !schoolYearId || !name) return { error: "Program, school year, and name are required" };
  const version = await createCurriculumVersion({
    programId,
    schoolYearId,
    name,
    createdByUserId: userId ?? undefined,
  });
  if (!version) return { error: "Failed to create curriculum version" };
  revalidatePath("/registrar/curriculum");
  return { success: true, versionId: version.id };
}

export async function cloneCurriculumVersionAction(formData: FormData) {
  const { error, userId } = await requireRegistrar();
  if (error) return { error };
  const fromVersionId = (formData.get("fromVersionId") as string)?.trim();
  const programId = (formData.get("programId") as string)?.trim() || undefined;
  const schoolYearId = (formData.get("schoolYearId") as string)?.trim() || undefined;
  const name = (formData.get("name") as string)?.trim();
  if (!fromVersionId || !name) return { error: "Source version and name are required" };
  const fromVersion = await getCurriculumVersionById(fromVersionId);
  if (!fromVersion) return { error: "Source version not found" };
  const targetProgramId = programId ?? fromVersion.programId;
  const targetSchoolYearId = schoolYearId ?? fromVersion.schoolYearId;
  const newVersion = await dbCloneCurriculumVersion({
    fromVersionId,
    programId: targetProgramId,
    schoolYearId: targetSchoolYearId,
    name,
    createdByUserId: userId ?? undefined,
  });
  if (!newVersion) return { error: "Failed to clone curriculum version" };
  revalidatePath("/registrar/curriculum");
  return { success: true, versionId: newVersion.id };
}

export async function addOrUpdateCurriculumBlockAction(values: {
  versionId: string;
  yearLevel: string;
  termId: string;
  sortOrder?: number;
}) {
  const { error } = await requireRegistrar();
  if (error) return { error };
  const version = await getCurriculumVersionById(values.versionId);
  if (!version) return { error: "Curriculum version not found" };
  if (version.status !== "draft") return { error: "Only draft versions can be edited" };
  const block = await getOrCreateCurriculumBlock({
    curriculumVersionId: values.versionId,
    yearLevel: values.yearLevel,
    termId: values.termId,
    sortOrder: values.sortOrder,
  });
  revalidatePath("/registrar/curriculum");
  revalidatePath(`/registrar/curriculum/${values.versionId}`);
  return { success: true, blockId: block.id };
}

export async function addSubjectToBlockAction(values: {
  blockId: string;
  subjectId: string;
  withLab?: boolean;
  prereqText?: string | null;
  sortOrder?: number;
}) {
  const { error } = await requireRegistrar();
  if (error) return { error };
  const { getCurriculumBlockById } = await import("@/db/queries");
  const block = await getCurriculumBlockById(values.blockId);
  if (!block) return { error: "Block not found" };
  const version = await getCurriculumVersionById(block.curriculumVersionId);
  if (!version || version.status !== "draft") return { error: "Only draft versions can be edited" };
  const validSubjects = await getSubjectsList({ programId: version.programId });
  const validIds = new Set(validSubjects.map((s) => s.id));
  if (!validIds.has(values.subjectId)) {
    return { error: "Subject not found or not valid for this program (must be GE or program-specific)" };
  }
  const added = await addCurriculumBlockSubject({
    curriculumBlockId: values.blockId,
    subjectId: values.subjectId,
    withLab: values.withLab ?? false,
    prereqText: values.prereqText ?? null,
    sortOrder: values.sortOrder ?? 0,
  });
  if (!added) return { error: "Subject already in block or failed to add" };
  revalidatePath("/registrar/curriculum");
  revalidatePath(`/registrar/curriculum/${block.curriculumVersionId}`);
  return { success: true };
}

export async function updateBlockSubjectAction(
  id: string,
  values: { withLab?: boolean; prereqText?: string | null; sortOrder?: number }
) {
  const { error } = await requireRegistrar();
  if (error) return { error };
  await updateCurriculumBlockSubject(id, values);
  revalidatePath("/registrar/curriculum");
  return { success: true };
}

export async function removeSubjectFromBlockAction(blockSubjectId: string) {
  const { error } = await requireRegistrar();
  if (error) return { error };
  await removeCurriculumBlockSubject(blockSubjectId);
  revalidatePath("/registrar/curriculum");
  return { success: true };
}

export async function publishCurriculumVersionAction(versionId: string) {
  const { error } = await requireRegistrar();
  if (error) return { error };
  const version = await getCurriculumVersionById(versionId);
  if (!version) return { error: "Curriculum version not found" };
  if (version.status !== "draft") return { error: "Only draft versions can be published" };
  const otherPublished = await hasOtherPublishedCurriculumForProgramYear(
    version.programId,
    version.schoolYearId,
    versionId
  );
  if (otherPublished) {
    return { error: "Another published curriculum already exists for this program and school year" };
  }
  const blocks = await getCurriculumBlocksByVersionId(versionId);
  const blocksWithSubjects = await Promise.all(
    blocks.map(async (b) => ({
      ...b,
      subjectCount: (await getCurriculumBlockSubjectsByBlockId(b.id)).length,
    }))
  );
  const emptyBlocks = blocksWithSubjects.filter((b) => b.subjectCount < 1);
  if (emptyBlocks.length === blocksWithSubjects.length) {
    return { error: "Add at least one subject to at least one block before publishing" };
  }
  await updateCurriculumVersionStatus(versionId, "published");
  revalidatePath("/registrar/curriculum");
  revalidatePath(`/registrar/curriculum/${versionId}`);
  return { success: true };
}

export async function archiveCurriculumVersionAction(versionId: string) {
  const { error } = await requireRegistrar();
  if (error) return { error };
  const version = await getCurriculumVersionById(versionId);
  if (!version) return { error: "Curriculum version not found" };
  await updateCurriculumVersionStatus(versionId, "archived");
  revalidatePath("/registrar/curriculum");
  revalidatePath(`/registrar/curriculum/${versionId}`);
  return { success: true };
}

export async function getSubjectsForCurriculumVersionAction(versionId: string) {
  const { error } = await requireRegistrar();
  if (error) return { error, subjects: [] };
  const version = await getCurriculumVersionById(versionId);
  if (!version) return { error: "Version not found", subjects: [] };
  const subjects = await getSubjectsList({ programId: version.programId });
  return {
    subjects: subjects.map((s) => ({
      id: String(s.id),
      code: s.code,
      title: s.title ?? "",
      units: String(s.units ?? "0"),
      isGe: Boolean(s.isGe),
    })),
  };
}

export async function addSubjectsToBlockAction(values: {
  blockId: string;
  items: Array<{ subjectId: string; withLab?: boolean; prereqText?: string | null }>;
}) {
  const { error } = await requireRegistrar();
  if (error) return { error };
  const { getCurriculumBlockById } = await import("@/db/queries");
  const block = await getCurriculumBlockById(values.blockId);
  if (!block) return { error: "Block not found" };
  const version = await getCurriculumVersionById(block.curriculumVersionId);
  if (!version || version.status !== "draft") return { error: "Only draft versions can be edited" };
  const validSubjects = await getSubjectsList({ programId: version.programId });
  const validIds = new Set(validSubjects.map((s) => s.id));
  const existing = await getCurriculumBlockSubjectsByBlockId(values.blockId);
  const existingSubjectIds = new Set(existing.map((s) => s.subjectId));
  let nextSortOrder = existing.length > 0 ? Math.max(...existing.map((s) => s.sortOrder)) + 1 : 0;
  let addedCount = 0;
  for (const item of values.items) {
    if (!validIds.has(item.subjectId) || existingSubjectIds.has(item.subjectId)) continue;
    const added = await addCurriculumBlockSubject({
      curriculumBlockId: values.blockId,
      subjectId: item.subjectId,
      withLab: item.withLab ?? false,
      prereqText: item.prereqText ?? null,
      sortOrder: nextSortOrder++,
    });
    if (added) {
      addedCount++;
      existingSubjectIds.add(item.subjectId);
    }
  }
  revalidatePath("/registrar/curriculum");
  revalidatePath(`/registrar/curriculum/${block.curriculumVersionId}`);
  return { success: true, addedCount };
}
