"use server";

import { and, eq, inArray } from "drizzle-orm";
import {
  enrollments,
  classSchedules,
  classOfferings,
  studentClassEnrollments,
  enrollmentSubjects,
  subjects,
} from "@/db/schema";
import { db } from "@/lib/db";
import {
  getPublishedCurriculumVersion,
  getCurriculumBlock,
  getCurriculumBlockSubjectsWithDetails,
} from "@/lib/curriculum/queries";

type DbOrTx = typeof db;

/**
 * When an enrollment is approved (or section is assigned), finalize class assignments:
 * - If section has schedules: ensure class_offerings exist, create student_class_enrollments.
 * - Else: create enrollment_subjects snapshot from published curriculum.
 * All writes run in a single transaction (use provided tx or own).
 */
export async function finalizeEnrollmentClasses(
  enrollmentId: string,
  tx?: DbOrTx
): Promise<{ ok: true; source: "schedule" | "curriculum" } | { ok: false; error: string }> {
  const run = async (client: DbOrTx) => {
    const [enrollment] = await client
      .select()
      .from(enrollments)
      .where(eq(enrollments.id, enrollmentId))
      .limit(1);
    if (!enrollment) return { ok: false as const, error: "Enrollment not found" };
    if (enrollment.status !== "approved" && enrollment.status !== "enrolled") {
      return { ok: false as const, error: "Enrollment is not approved" };
    }

    const programId = enrollment.programId ?? null;
    const yearLevel = enrollment.yearLevel ?? null;
    const schoolYearId = enrollment.schoolYearId;
    const termId = enrollment.termId;
    const sectionId = enrollment.sectionId ?? null;
    const studentId = enrollment.studentId;

    // Priority A: section schedule exists
    if (sectionId) {
      const scheduleRows = await client
        .select()
        .from(classSchedules)
        .where(
          and(
            eq(classSchedules.sectionId, sectionId),
            eq(classSchedules.schoolYearId, schoolYearId),
            eq(classSchedules.termId, termId)
          )
        );

      if (scheduleRows.length > 0) {
        for (const row of scheduleRows) {
          const [existingOffering] = await client
            .select()
            .from(classOfferings)
            .where(
              and(
                eq(classOfferings.scheduleId, row.id),
                eq(classOfferings.schoolYearId, schoolYearId),
                eq(classOfferings.termId, termId)
              )
            )
            .limit(1);

          let offeringId: string;
          if (existingOffering) {
            offeringId = existingOffering.id;
          } else {
            const [inserted] = await client
              .insert(classOfferings)
              .values({
                scheduleId: row.id,
                schoolYearId: row.schoolYearId,
                termId: row.termId,
                sectionId: row.sectionId,
                subjectId: row.subjectId,
                teacherUserProfileId: row.teacherUserProfileId ?? null,
                teacherName: row.teacherName ?? null,
                room: row.room ?? null,
                timeStart: row.timeIn ?? null,
                timeEnd: row.timeOut ?? null,
                active: true,
              })
              .returning({ id: classOfferings.id });
            if (!inserted) continue;
            offeringId = inserted.id;
          }

          await client
            .insert(studentClassEnrollments)
            .values({
              studentId,
              enrollmentId,
              classOfferingId: offeringId,
              status: "enrolled",
            })
            .onConflictDoNothing({
              target: [
                studentClassEnrollments.studentId,
                studentClassEnrollments.enrollmentId,
                studentClassEnrollments.classOfferingId,
              ],
            });
        }

        // Snapshot enrollment_subjects from schedule (for consistency / printing)
        await client.delete(enrollmentSubjects).where(eq(enrollmentSubjects.enrollmentId, enrollmentId));
        for (const row of scheduleRows) {
          const [sub] = await client
            .select({ units: subjects.units })
            .from(subjects)
            .where(eq(subjects.id, row.subjectId))
            .limit(1);
          const units = sub?.units != null ? Math.round(parseFloat(String(sub.units))) : 0;
          await client
            .insert(enrollmentSubjects)
            .values({
              enrollmentId,
              subjectId: row.subjectId,
              source: "schedule",
              units,
            })
            .onConflictDoNothing({
              target: [enrollmentSubjects.enrollmentId, enrollmentSubjects.subjectId],
            });
        }
        return { ok: true as const, source: "schedule" as const };
      }
    }

    // Priority B: curriculum fallback
    if (!programId || !yearLevel) {
      return { ok: false as const, error: "Program and year level required for curriculum fallback" };
    }
    const version = await getPublishedCurriculumVersion(programId, schoolYearId);
    if (!version) {
      return { ok: false as const, error: "No published curriculum for this program and school year" };
    }
    const block = await getCurriculumBlock(version.id, yearLevel, termId);
    if (!block) {
      return { ok: false as const, error: "No curriculum block for this year level and term" };
    }
    const curriculumSubjectRows = await getCurriculumBlockSubjectsWithDetails(block.id);
    if (curriculumSubjectRows.length === 0) {
      return { ok: true as const, source: "curriculum" as const };
    }

    const subjectIds = curriculumSubjectRows.map((s) => s.subjectId);
    const subjectRows = await client
      .select({ id: subjects.id, isGe: subjects.isGe, programId: subjects.programId })
      .from(subjects)
      .where(inArray(subjects.id, subjectIds));
    const allowedIds = new Set(
      subjectRows
        .filter((s) => s.isGe || s.programId === programId)
        .map((s) => s.id)
    );

    await client.delete(enrollmentSubjects).where(eq(enrollmentSubjects.enrollmentId, enrollmentId));
    for (const s of curriculumSubjectRows) {
      if (!allowedIds.has(s.subjectId)) continue;
      const units = Math.round(parseFloat(s.units || "0"));
      await client
        .insert(enrollmentSubjects)
        .values({
          enrollmentId,
          subjectId: s.subjectId,
          source: "curriculum",
          units,
        })
        .onConflictDoNothing({
          target: [enrollmentSubjects.enrollmentId, enrollmentSubjects.subjectId],
        });
    }
    return { ok: true as const, source: "curriculum" as const };
  };

  if (tx) return run(tx);
  return db.transaction(async (transaction) => run(transaction as unknown as DbOrTx));
}
