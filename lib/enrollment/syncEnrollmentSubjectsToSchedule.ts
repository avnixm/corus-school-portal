"use server";

import { and, eq } from "drizzle-orm";
import {
  enrollments,
  classSchedules,
  classOfferings,
  studentClassEnrollments,
  enrollmentSubjects,
} from "@/db/schema";
import { db } from "@/lib/db";
import { finalizeEnrollmentClasses } from "./finalizeEnrollmentClasses";

/**
 * When a section schedule becomes available for an enrollment that already has
 * enrollment_subjects (curriculum snapshot), sync: create/ensure class_offerings,
 * enroll student into matching offerings. Finalize runs schedule path when section
 * has schedules, so we can just call finalizeEnrollmentClasses again (idempotent).
 * Returns any mismatch warnings for registrar (e.g. schedule has subjects not in snapshot).
 */
export async function syncEnrollmentSubjectsToSchedule(enrollmentId: string): Promise<{
  ok: boolean;
  enrolledCount?: number;
  warnings?: string[];
}> {
  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.id, enrollmentId))
    .limit(1);
  if (!enrollment || !enrollment.sectionId) {
    return { ok: false };
  }

  const result = await finalizeEnrollmentClasses(enrollmentId);
  if (!result.ok) return { ok: false };

  if (result.source === "schedule") {
    const count = await db
      .select({ id: studentClassEnrollments.id })
      .from(studentClassEnrollments)
      .where(
        and(
          eq(studentClassEnrollments.enrollmentId, enrollmentId),
          eq(studentClassEnrollments.status, "enrolled")
        )
      );
    const snapshotSubjects = await db
      .select({ subjectId: enrollmentSubjects.subjectId })
      .from(enrollmentSubjects)
      .where(eq(enrollmentSubjects.enrollmentId, enrollmentId));
    const scheduleRows = await db
      .select({ subjectId: classSchedules.subjectId })
      .from(classSchedules)
      .where(
        and(
          eq(classSchedules.sectionId, enrollment.sectionId),
          eq(classSchedules.schoolYearId, enrollment.schoolYearId),
          eq(classSchedules.termId, enrollment.termId)
        )
      );
    const snapshotSet = new Set(snapshotSubjects.map((s) => s.subjectId));
    const scheduleSet = new Set(scheduleRows.map((s) => s.subjectId));
    const warnings: string[] = [];
    if ([...scheduleSet].some((id) => !snapshotSet.has(id)))
      warnings.push("Schedule has subject(s) not in curriculum snapshot.");
    if ([...snapshotSet].some((id) => !scheduleSet.has(id)))
      warnings.push("Curriculum snapshot has subject(s) not in section schedule.");
    return { ok: true, enrolledCount: count.length, warnings: warnings.length ? warnings : undefined };
  }
  return { ok: true };
}

/**
 * Finalize class enrollments for all approved enrollments in a section (e.g. after
 * building the section schedule).
 */
export async function bulkFinalizeForSection(
  sectionId: string,
  schoolYearId: string,
  termId: string
): Promise<{ processed: number; errors: string[] }> {
  const list = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.sectionId, sectionId),
        eq(enrollments.schoolYearId, schoolYearId),
        eq(enrollments.termId, termId),
        eq(enrollments.status, "approved")
      )
    );
  const errors: string[] = [];
  let processed = 0;
  for (const row of list) {
    const result = await finalizeEnrollmentClasses(row.id);
    if (result.ok) processed++;
    else errors.push(`${row.id}: ${result.error}`);
  }
  return { processed, errors };
}
