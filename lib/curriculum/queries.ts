// path: lib/curriculum/queries.ts
import { db } from "@/lib/db";
import {
  curriculumVersions,
  curriculumBlocks,
  curriculumBlockSubjects,
  programs,
  schoolYears,
  terms,
  subjects,
} from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";

export type CurriculumSubjectRow = {
  id: string;
  subjectId: string;
  code: string;
  title: string;
  units: string;
  prereqText: string | null;
  withLab: boolean;
  sortOrder: number;
};

/**
 * Get published curriculum version for a program + school year.
 * Only one published version per (programId, schoolYearId) is allowed (enforced in publish action).
 */
export async function getPublishedCurriculumVersion(
  programId: string,
  schoolYearId: string
) {
  const [row] = await db
    .select()
    .from(curriculumVersions)
    .where(
      and(
        eq(curriculumVersions.programId, programId),
        eq(curriculumVersions.schoolYearId, schoolYearId),
        eq(curriculumVersions.status, "published")
      )
    )
    .limit(1);
  return row ?? null;
}

/**
 * Get the curriculum block for a version + year level + term.
 */
export async function getCurriculumBlock(
  curriculumVersionId: string,
  yearLevel: string,
  termId: string
) {
  const [row] = await db
    .select()
    .from(curriculumBlocks)
    .where(
      and(
        eq(curriculumBlocks.curriculumVersionId, curriculumVersionId),
        eq(curriculumBlocks.yearLevel, yearLevel),
        eq(curriculumBlocks.termId, termId)
      )
    )
    .limit(1);
  return row ?? null;
}

/**
 * Get subjects for a curriculum block (for Part I and total units).
 */
export async function getCurriculumBlockSubjectsWithDetails(
  curriculumBlockId: string
): Promise<CurriculumSubjectRow[]> {
  const rows = await db
    .select({
      id: curriculumBlockSubjects.id,
      subjectId: curriculumBlockSubjects.subjectId,
      code: subjects.code,
      title: subjects.title,
      units: subjects.units,
      prereqText: curriculumBlockSubjects.prereqText,
      withLab: curriculumBlockSubjects.withLab,
      sortOrder: curriculumBlockSubjects.sortOrder,
    })
    .from(curriculumBlockSubjects)
    .innerJoin(subjects, eq(curriculumBlockSubjects.subjectId, subjects.id))
    .where(eq(curriculumBlockSubjects.curriculumBlockId, curriculumBlockId))
    .orderBy(asc(curriculumBlockSubjects.sortOrder));
  return rows.map((r) => ({
    id: r.id,
    subjectId: r.subjectId,
    code: r.code,
    title: r.title ?? "",
    units: String(r.units ?? "0"),
    prereqText: r.prereqText,
    withLab: r.withLab,
    sortOrder: r.sortOrder,
  }));
}

/**
 * For an enrollment (program, school year, term, year level), get the published curriculum
 * block subjects and total units. Returns null if no published curriculum or no block.
 */
export async function getCurriculumSubjectsAndTotalUnitsForEnrollment(params: {
  programId: string | null;
  schoolYearId: string;
  termId: string;
  yearLevel: string | null;
}): Promise<{ subjects: CurriculumSubjectRow[]; totalUnits: number } | null> {
  if (!params.programId || !params.yearLevel) return null;
  const version = await getPublishedCurriculumVersion(
    params.programId,
    params.schoolYearId
  );
  if (!version) return null;
  const block = await getCurriculumBlock(
    version.id,
    params.yearLevel,
    params.termId
  );
  if (!block) return null;
  const subjectRows = await getCurriculumBlockSubjectsWithDetails(block.id);
  const totalUnits = subjectRows.reduce(
    (sum, s) => sum + parseFloat(s.units || "0"),
    0
  );
  return { subjects: subjectRows, totalUnits };
}
