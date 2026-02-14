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

/** Create the draft curriculum for this program + school year (one per program per year). */
export async function createCurriculumForProgramYearAction(
  programId: string,
  schoolYearId: string,
  name: string
) {
  const { error, userId } = await requireRegistrar();
  if (error) return { error, versionId: null };
  const drafts = await getCurriculumVersionsList({ programId, schoolYearId, status: "draft" });
  if (drafts.length > 0) {
    revalidatePath("/registrar/curriculum");
    return { versionId: drafts[0].id, error: null };
  }
  const version = await createCurriculumVersion({
    programId,
    schoolYearId,
    name,
    createdByUserId: userId ?? undefined,
  });
  if (!version) return { error: "Failed to create curriculum", versionId: null };
  revalidatePath("/registrar/curriculum");
  return { versionId: version.id, error: null };
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
  const hasAnySubjects = blocksWithSubjects.some((b) => b.subjectCount > 0);
  if (!hasAnySubjects) {
    return { error: "Add at least one subject to at least one block before publishing." };
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
  return { success: true };
}

export async function deleteCurriculumVersionAction(versionId: string) {
  const { error } = await requireRegistrar();
  if (error) return { error };
  const version = await getCurriculumVersionById(versionId);
  if (!version) return { error: "Curriculum version not found" };
  if (version.status === "published") {
    return { error: "Cannot delete a published curriculum. Archive it first." };
  }
  const { deleteCurriculumVersion } = await import("@/db/queries");
  await deleteCurriculumVersion(versionId);
  revalidatePath("/registrar/curriculum");
  return { success: true };
}

export async function getSubjectsForCurriculumVersionAction(versionId: string) {
  const { error } = await requireRegistrar();
  if (error) return { error, subjects: [] };
  const version = await getCurriculumVersionById(versionId);
  if (!version) return { error: "Version not found", subjects: [] };
  // Same query as Registrar → Subjects table: program + GE, active only
  const rows = await getSubjectsList({ programId: version.programId });
  const activeSubjects = rows.filter((s) => s.active);
  return {
    subjects: activeSubjects.map((s) => ({
      id: String(s.id),
      code: s.code,
      title: s.title ?? "",
      units: String(s.units ?? "0"),
      isGe: Boolean(s.isGe),
    })),
  };
}

/** List subjects for program + GE (for global search when program is known). */
export async function listSubjectsForProgramAction(programId: string) {
  const { error } = await requireRegistrar();
  if (error) return { error, subjects: [] };
  const subjects = await getSubjectsList({ programId });
  return {
    subjects: subjects.map((s) => ({
      id: String(s.id),
      code: s.code,
      title: (s.title ?? "") as string,
      units: String(s.units ?? "0"),
      type: (s as { isGe?: boolean }).isGe ? "ge" : "program",
    })),
  };
}

export async function addSubjectsToTermAction(values: {
  versionId: string;
  yearLevel: string;
  termId: string;
  items: Array<{ subjectId: string; withLab?: boolean }>;
}) {
  const { error } = await requireRegistrar();
  if (error) return { error };
  const version = await getCurriculumVersionById(values.versionId);
  if (!version) return { error: "Curriculum version not found" };
  if (version.status !== "draft") return { error: "Only draft versions can be edited" };
  const validSubjects = await getSubjectsList({ programId: version.programId });
  const validIds = new Set(validSubjects.map((s) => s.id));
  const items = values.items.filter((item) => validIds.has(item.subjectId));
  if (items.length === 0) return { error: "No valid subjects to add" };
  const { getOrCreateCurriculumBlock, getCurriculumBlockSubjectsByBlockId } = await import("@/db/queries");
  const block = await getOrCreateCurriculumBlock({
    curriculumVersionId: values.versionId,
    yearLevel: values.yearLevel,
    termId: values.termId,
  });
  const existing = await getCurriculumBlockSubjectsByBlockId(block.id);
  const existingSet = new Set(existing.map((s) => s.subjectId));
  let sortOrder = existing.length ? Math.max(...existing.map((s) => s.sortOrder)) + 1 : 0;
  for (const item of items) {
    if (existingSet.has(item.subjectId)) continue;
    await addCurriculumBlockSubject({
      curriculumBlockId: block.id,
      subjectId: item.subjectId,
      withLab: item.withLab ?? false,
      sortOrder: sortOrder++,
    });
    existingSet.add(item.subjectId);
  }
  revalidatePath("/registrar/curriculum");
  return { success: true };
}

export async function moveSubjectBetweenTermsAction(values: {
  blockSubjectId: string;
  toTermId: string;
}) {
  const { error } = await requireRegistrar();
  if (error) return { error };
  const { getCurriculumBlockSubjectById, getOrCreateCurriculumBlock, getCurriculumBlockSubjectsByBlockId } =
    await import("@/db/queries");
  const row = await getCurriculumBlockSubjectById(values.blockSubjectId);
  if (!row) return { error: "Block subject not found" };
  const version = await getCurriculumVersionById(row.curriculumVersionId);
  if (!version || version.status !== "draft") return { error: "Only draft versions can be edited" };
  if (row.termId === values.toTermId) return { success: true };
  const toBlock = await getOrCreateCurriculumBlock({
    curriculumVersionId: row.curriculumVersionId,
    yearLevel: row.yearLevel,
    termId: values.toTermId,
  });
  const existingTo = await getCurriculumBlockSubjectsByBlockId(toBlock.id);
  if (existingTo.some((s) => s.subjectId === row.subjectId)) {
    await removeCurriculumBlockSubject(values.blockSubjectId);
    revalidatePath("/registrar/curriculum");
    return { success: true };
  }
  const nextSort = existingTo.length ? Math.max(...existingTo.map((s) => s.sortOrder)) + 1 : 0;
  await removeCurriculumBlockSubject(values.blockSubjectId);
  await addCurriculumBlockSubject({
    curriculumBlockId: toBlock.id,
    subjectId: row.subjectId,
    withLab: row.withLab ?? false,
    prereqText: row.prereqText ?? null,
    sortOrder: nextSort,
  });
  revalidatePath("/registrar/curriculum");
  return { success: true };
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

// --- Builder bulk actions ---

const YEAR_LEVELS_ORDER = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

/** Add a year to the draft (creates empty blocks for each term). Call this when user explicitly adds a year; do not auto-create all years. */
export async function addYearToVersionAction(versionId: string, yearLevel: string) {
  const { error } = await requireRegistrar();
  if (error) return { error };
  const version = await getCurriculumVersionById(versionId);
  if (!version) return { error: "Curriculum version not found" };
  if (version.status !== "draft") return { error: "Only draft versions can be edited" };
  if (!YEAR_LEVELS_ORDER.includes(yearLevel)) return { error: "Invalid year level" };
  const { getTermsBySchoolYearId, getOrCreateCurriculumBlock } = await import("@/db/queries");
  const terms = await getTermsBySchoolYearId(version.schoolYearId);
  for (const term of terms) {
    await getOrCreateCurriculumBlock({
      curriculumVersionId: versionId,
      yearLevel,
      termId: term.id,
    });
  }
  revalidatePath("/registrar/curriculum");
  return { success: true };
}

/** Create empty blocks for all four years (optional; use "Auto-fill Years" in header if desired). Not run automatically. */
export async function createAllYearBlocksForVersion(versionId: string) {
  const { error } = await requireRegistrar();
  if (error) return { error };
  const version = await getCurriculumVersionById(versionId);
  if (!version) return { error: "Curriculum version not found" };
  if (version.status !== "draft") return { error: "Only draft versions can be edited" };
  const { getTermsBySchoolYearId, getOrCreateCurriculumBlock } = await import("@/db/queries");
  const terms = await getTermsBySchoolYearId(version.schoolYearId);
  const existing = await getCurriculumBlocksByVersionId(versionId);
  const existingKeys = new Set(existing.map((b) => `${b.yearLevel}:${b.termId}`));
  for (const yearLevel of YEAR_LEVELS_ORDER) {
    for (const term of terms) {
      const key = `${yearLevel}:${term.id}`;
      if (existingKeys.has(key)) continue;
      await getOrCreateCurriculumBlock({
        curriculumVersionId: versionId,
        yearLevel,
        termId: term.id,
      });
    }
  }
  revalidatePath("/registrar/curriculum");
  return { success: true };
}

export async function addSubjectsToYearAction(values: {
  versionId: string;
  yearLevel: string;
  subjectIds: string[];
  distribution: "smart" | "manual";
  manualTermMap?: Record<string, string>;
  targetUnitsPerTerm?: number;
}) {
  const { error } = await requireRegistrar();
  if (error) return { error };
  const version = await getCurriculumVersionById(values.versionId);
  if (!version) return { error: "Curriculum version not found" };
  if (version.status !== "draft") return { error: "Only draft versions can be edited" };
  const validSubjects = await getSubjectsList({ programId: version.programId });
  const validIds = new Set(validSubjects.map((s) => s.id));
  const subjectIds = values.subjectIds.filter((id) => validIds.has(id));
  if (subjectIds.length === 0) return { error: "No valid subjects to add" };

  const { getTermsBySchoolYearId, getOrCreateCurriculumBlock, getCurriculumBlockSubjectsByBlockId } =
    await import("@/db/queries");
  const terms = await getTermsBySchoolYearId(version.schoolYearId);
  const targetUnits = values.targetUnitsPerTerm ?? 24;

  const blocksByTermId = new Map<string, string>();
  for (const term of terms) {
    const block = await getOrCreateCurriculumBlock({
      curriculumVersionId: values.versionId,
      yearLevel: values.yearLevel,
      termId: term.id,
    });
    blocksByTermId.set(term.id, block.id);
  }

  const termOrder = terms.map((t) => t.id);
  const firstTermId = termOrder[0];
  const secondTermId = termOrder[1];

  if (values.distribution === "manual" && values.manualTermMap) {
    let sortOrder0 = 0,
      sortOrder1 = 0;
    const existing0 = await getCurriculumBlockSubjectsByBlockId(blocksByTermId.get(firstTermId)!);
    const existing1 = secondTermId
      ? await getCurriculumBlockSubjectsByBlockId(blocksByTermId.get(secondTermId)!)
      : [];
    sortOrder0 = existing0.length ? Math.max(...existing0.map((s) => s.sortOrder)) + 1 : 0;
    sortOrder1 = existing1.length ? Math.max(...existing1.map((s) => s.sortOrder)) + 1 : 0;
    for (const subjectId of subjectIds) {
      const termId = values.manualTermMap[subjectId] ?? firstTermId;
      const blockId = blocksByTermId.get(termId);
      if (!blockId) continue;
      const existing = await getCurriculumBlockSubjectsByBlockId(blockId);
      if (existing.some((s) => s.subjectId === subjectId)) continue;
      await addCurriculumBlockSubject({
        curriculumBlockId: blockId,
        subjectId,
        sortOrder: termId === firstTermId ? sortOrder0++ : sortOrder1++,
      });
    }
  } else {
    const subjectUnits = new Map<string, number>();
    for (const s of validSubjects) {
      if (subjectIds.includes(s.id))
        subjectUnits.set(s.id, parseFloat(String(s.units ?? "0")));
    }
    let currentTermIndex = 0;
    let currentTermUnits = 0;
    const existingFirst = await getCurriculumBlockSubjectsByBlockId(blocksByTermId.get(firstTermId)!);
    currentTermUnits = existingFirst.reduce(
      (sum, s) => sum + parseFloat(String((s as { units?: string }).units ?? "0")),
      0
    );
    const unitsBySubject = (sid: string) => subjectUnits.get(sid) ?? 0;
    let sortOrderFirst = existingFirst.length ? Math.max(...existingFirst.map((s) => s.sortOrder)) + 1 : 0;
    let sortOrderSecond = 0;
    if (secondTermId) {
      const existingSecond = await getCurriculumBlockSubjectsByBlockId(blocksByTermId.get(secondTermId)!);
      sortOrderSecond = existingSecond.length ? Math.max(...existingSecond.map((s) => s.sortOrder)) + 1 : 0;
    }
    for (const subjectId of subjectIds) {
      const units = unitsBySubject(subjectId);
      const blockIdForFirst = blocksByTermId.get(firstTermId)!;
      const blockIdForSecond = secondTermId ? blocksByTermId.get(secondTermId) : null;
      if (currentTermUnits + units <= targetUnits || !blockIdForSecond) {
        const existing = await getCurriculumBlockSubjectsByBlockId(blockIdForFirst);
        if (!existing.some((s) => s.subjectId === subjectId)) {
          await addCurriculumBlockSubject({
            curriculumBlockId: blockIdForFirst,
            subjectId,
            sortOrder: sortOrderFirst++,
          });
          currentTermUnits += units;
        }
      } else {
        if (blockIdForSecond) {
          const existing = await getCurriculumBlockSubjectsByBlockId(blockIdForSecond);
          if (!existing.some((s) => s.subjectId === subjectId)) {
            await addCurriculumBlockSubject({
              curriculumBlockId: blockIdForSecond,
              subjectId,
              sortOrder: sortOrderSecond++,
            });
          }
        }
      }
    }
  }

  revalidatePath("/registrar/curriculum");
  return { success: true };
}

export async function copyYearAction(values: {
  versionId: string;
  fromYearLevel: string;
  toYearLevel: string;
  mode: "overwrite" | "merge";
}) {
  const { error } = await requireRegistrar();
  if (error) return { error };
  const version = await getCurriculumVersionById(values.versionId);
  if (!version) return { error: "Curriculum version not found" };
  if (version.status !== "draft") return { error: "Only draft versions can be edited" };
  const blocks = await getCurriculumBlocksByVersionId(values.versionId);
  const fromBlocks = blocks.filter((b) => b.yearLevel === values.fromYearLevel);
  const toBlocks = blocks.filter((b) => b.yearLevel === values.toYearLevel);
  if (fromBlocks.length === 0) return { error: "Source year has no blocks" };

  const { getCurriculumBlockSubjectsByBlockId } = await import("@/db/queries");
  for (const toBlock of toBlocks) {
    const fromBlock = fromBlocks.find((f) => f.termId === toBlock.termId);
    if (!fromBlock) continue;
    const fromSubjects = await getCurriculumBlockSubjectsByBlockId(fromBlock.id);
    const existing = await getCurriculumBlockSubjectsByBlockId(toBlock.id);
    const existingSubjectIds = new Set(existing.map((s) => s.subjectId));
    if (values.mode === "overwrite") {
      const { removeCurriculumBlockSubject } = await import("@/db/queries");
      for (const row of existing) {
        await removeCurriculumBlockSubject(row.id);
      }
      existingSubjectIds.clear();
    }
    let sortOrder = existing.length ? Math.max(...existing.map((s) => s.sortOrder)) + 1 : 0;
    for (const sub of fromSubjects) {
      if (existingSubjectIds.has(sub.subjectId)) continue;
      await addCurriculumBlockSubject({
        curriculumBlockId: toBlock.id,
        subjectId: sub.subjectId,
        withLab: sub.withLab ?? false,
        prereqText: sub.prereqText ?? null,
        sortOrder: sortOrder++,
      });
      existingSubjectIds.add(sub.subjectId);
    }
  }
  revalidatePath("/registrar/curriculum");
  return { success: true };
}

export async function clearYearAction(versionId: string, yearLevel: string) {
  const { error } = await requireRegistrar();
  if (error) return { error };
  const version = await getCurriculumVersionById(versionId);
  if (!version) return { error: "Curriculum version not found" };
  if (version.status !== "draft") return { error: "Only draft versions can be edited" };
  const { removeCurriculumBlockSubject } = await import("@/db/queries");
  const blocks = await getCurriculumBlocksByVersionId(versionId);
  const yearBlocks = blocks.filter((b) => b.yearLevel === yearLevel);
  for (const block of yearBlocks) {
    const subjects = await getCurriculumBlockSubjectsByBlockId(block.id);
    for (const s of subjects) {
      await removeCurriculumBlockSubject(s.id);
    }
  }
  revalidatePath("/registrar/curriculum");
  return { success: true };
}

export async function updateBlockSubjectMetaAction(values: {
  blockSubjectId: string;
  withLab?: boolean;
  prereqText?: string | null;
  sortOrder?: number;
}) {
  const { error } = await requireRegistrar();
  if (error) return { error };
  await updateCurriculumBlockSubject(values.blockSubjectId, {
    withLab: values.withLab,
    prereqText: values.prereqText,
    sortOrder: values.sortOrder,
  });
  revalidatePath("/registrar/curriculum");
  return { success: true };
}
