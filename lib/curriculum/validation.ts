// path: lib/curriculum/validation.ts
/**
 * Subject is valid for a curriculum version if:
 * - subject.isGe === true (GE), OR
 * - subject.programId === curriculumVersion.programId
 */
export function isSubjectValidForProgram(
  subject: { isGe: boolean; programId: string | null },
  programId: string
): boolean {
  if (subject.isGe) return true;
  return subject.programId === programId;
}

/**
 * Filter subject list to only those valid for the given program.
 */
export function filterSubjectsForProgram<T extends { isGe: boolean; programId: string | null }>(
  subjects: T[],
  programId: string
): T[] {
  return subjects.filter((s) => isSubjectValidForProgram(s, programId));
}
