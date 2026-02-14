// path: lib/fees/matching.ts
import "server-only";
import { db } from "@/lib/db";
import {
  feeSetups,
  feeSetupApprovals,
  enrollments,
  programs,
} from "@/db/schema";
import { eq, and, or, isNull, desc } from "drizzle-orm";

export type FeeSetupMatch = {
  id: string;
  programId: string | null;
  programCode: string | null;
  programName: string | null;
  yearLevel: string | null;
  schoolYearId: string | null;
  termId: string | null;
  tuitionPerUnit: string;
};

/**
 * Find the best APPROVED fee setup for an enrollment.
 * Matching priority:
 * 1. exact program + year_level + school_year + term
 * 2. program + year_level + school_year (term null)
 * 3. program + year_level (sy/term null)
 * 4. program only
 */
export async function findBestApprovedFeeSetup(
  enrollmentId: string
): Promise<FeeSetupMatch | null> {
  const [enrollment] = await db
    .select({
      programId: enrollments.programId,
      program: enrollments.program,
      yearLevel: enrollments.yearLevel,
      schoolYearId: enrollments.schoolYearId,
      termId: enrollments.termId,
    })
    .from(enrollments)
    .where(eq(enrollments.id, enrollmentId))
    .limit(1);
  if (!enrollment || !enrollment.programId) return null;

  const programCode = enrollment.program;
  if (!programCode) return null;

  const candidates = await db
    .select({
      id: feeSetups.id,
      programId: feeSetups.programId,
      yearLevel: feeSetups.yearLevel,
      schoolYearId: feeSetups.schoolYearId,
      termId: feeSetups.termId,
      tuitionPerUnit: feeSetups.tuitionPerUnit,
      programCode: programs.code,
      programName: programs.name,
    })
    .from(feeSetups)
    .innerJoin(
      feeSetupApprovals,
      eq(feeSetups.id, feeSetupApprovals.feeSetupId)
    )
    .leftJoin(programs, eq(feeSetups.programId, programs.id))
    .where(
      and(
        eq(feeSetups.programId, enrollment.programId),
        eq(feeSetups.status, "approved"),
        eq(feeSetupApprovals.programHeadStatus, "approved"),
        eq(feeSetupApprovals.deanStatus, "approved")
      )
    )
    .orderBy(desc(feeSetups.updatedAt));

  for (const c of candidates) {
    const yMatch =
      !c.yearLevel || c.yearLevel === enrollment.yearLevel;
    const syMatch =
      !c.schoolYearId || c.schoolYearId === enrollment.schoolYearId;
    const tMatch =
      !c.termId || c.termId === enrollment.termId;
    if (yMatch && syMatch && tMatch) {
      return {
        id: c.id,
        programId: c.programId,
        programCode: c.programCode,
        programName: c.programName,
        yearLevel: c.yearLevel,
        schoolYearId: c.schoolYearId,
        termId: c.termId,
        tuitionPerUnit: c.tuitionPerUnit ?? "0",
      };
    }
  }

  return null;
}
