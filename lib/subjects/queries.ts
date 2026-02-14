import "server-only";
import { db } from "@/lib/db";
import { subjects, programs } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";

/** List subjects for a program: program-specific + GE. Optionally GE only. */
export async function getSubjectsForProgram(programId: string | null, geOnly?: boolean) {
  if (geOnly) {
    const rows = await db
      .select({
        id: subjects.id,
        code: subjects.code,
        title: subjects.title,
        description: subjects.description,
        units: subjects.units,
        programId: subjects.programId,
        isGe: subjects.isGe,
        active: subjects.active,
      })
      .from(subjects)
      .where(and(eq(subjects.isGe, true), eq(subjects.active, true)))
      .orderBy(subjects.code);
    return rows.map((r) => ({ ...r, programCode: null as string | null }));
  }
  if (!programId) {
    return db
      .select({
        id: subjects.id,
        code: subjects.code,
        title: subjects.title,
        description: subjects.description,
        units: subjects.units,
        programId: subjects.programId,
        isGe: subjects.isGe,
        active: subjects.active,
        programCode: programs.code,
      })
      .from(subjects)
      .leftJoin(programs, eq(subjects.programId, programs.id))
      .where(eq(subjects.active, true))
      .orderBy(subjects.code);
  }
  return db
    .select({
      id: subjects.id,
      code: subjects.code,
      title: subjects.title,
      description: subjects.description,
      units: subjects.units,
      programId: subjects.programId,
      isGe: subjects.isGe,
      active: subjects.active,
      programCode: programs.code,
    })
    .from(subjects)
    .leftJoin(programs, eq(subjects.programId, programs.id))
    .where(
      and(
        eq(subjects.active, true),
        or(eq(subjects.isGe, true), eq(subjects.programId, programId))
      )
    )
    .orderBy(subjects.code);
}

/** Subjects that can be scheduled for a section (section's program): GE + program subjects. */
export async function getSubjectsAvailableForSection(sectionProgramId: string | null) {
  return getSubjectsForProgram(sectionProgramId, false);
}

/** GE subjects only. */
export async function getGeSubjects(activeOnly = true) {
  const conds = [eq(subjects.isGe, true)];
  if (activeOnly) conds.push(eq(subjects.active, true));
  return db
    .select()
    .from(subjects)
    .where(and(...conds))
    .orderBy(subjects.code);
}
