"use server";

import { revalidatePath } from "next/cache";
import {
  getEnrollmentById,
  updateEnrollmentSection,
  pickBalancedSectionForEnrollment,
  getSectionById,
} from "@/db/queries";
import { requireRole } from "@/lib/rbac";
import { getProgramHeadScopePrograms } from "@/lib/programHead/scope";
import { getUnassignedEnrollmentsForSectioning } from "@/lib/programHead/queries";
import { finalizeEnrollmentClasses } from "@/lib/enrollment/finalizeEnrollmentClasses";

/** Map enrollment year level (e.g. "1st Year") to section year level (e.g. "1") if needed. */
function yearLevelForSectionMatch(yearLevel: string | null): string | null {
  if (!yearLevel) return null;
  const map: Record<string, string> = {
    "1st Year": "1",
    "2nd Year": "2",
    "3rd Year": "3",
    "4th Year": "4",
    "5th Year": "5",
  };
  return map[yearLevel] ?? yearLevel;
}

/** Run smart sectioning for filtered unassigned enrollments. Assigns each to the section with fewest students. */
export async function runSmartSectioningAction(filters: {
  schoolYearId: string;
  termId: string;
  programId?: string;
  yearLevel?: string;
}): Promise<{ success?: true; assigned: number; skipped: number; error?: string }> {
  const auth = await requireRole(["program_head", "admin"]);
  if ("error" in auth) return { assigned: 0, skipped: 0, error: auth.error };

  const scope = await getProgramHeadScopePrograms(auth.userId);
  const enrollments = await getUnassignedEnrollmentsForSectioning(scope, {
    schoolYearId: filters.schoolYearId,
    termId: filters.termId,
    programId: filters.programId,
    yearLevel: filters.yearLevel,
  });

  let assigned = 0;
  let skipped = 0;

  for (const e of enrollments) {
    if (!e.programId || !e.yearLevel) {
      skipped++;
      continue;
    }
    const altYearLevel = yearLevelForSectionMatch(e.yearLevel);
    let sectionId = await pickBalancedSectionForEnrollment({
      programId: e.programId,
      yearLevel: altYearLevel ?? e.yearLevel,
      schoolYearId: e.schoolYearId,
      termId: e.termId,
    });
    if (!sectionId && altYearLevel && altYearLevel !== e.yearLevel) {
      sectionId = await pickBalancedSectionForEnrollment({
        programId: e.programId,
        yearLevel: e.yearLevel,
        schoolYearId: e.schoolYearId,
        termId: e.termId,
      });
    }
    if (sectionId) {
      await updateEnrollmentSection(e.id, sectionId);
      const enrollment = await getEnrollmentById(e.id);
      if (enrollment?.status === "approved" || enrollment?.status === "enrolled") {
        await finalizeEnrollmentClasses(e.id);
      }
      assigned++;
    } else {
      skipped++;
    }
  }

  revalidatePath("/program-head/sectioning");
  revalidatePath("/program-head/enrollments");
  revalidatePath("/program-head/sections");
  return { success: true, assigned, skipped };
}

/** Program Head assigns a specific section to an enrollment. Scoped to their programs. */
export async function assignSectionToEnrollmentAction(
  enrollmentId: string,
  sectionId: string
): Promise<{ success?: true; error?: string }> {
  const auth = await requireRole(["program_head", "admin"]);
  if ("error" in auth) return { error: auth.error };

  const scope = await getProgramHeadScopePrograms(auth.userId);
  const enrollment = await getEnrollmentById(enrollmentId);
  if (!enrollment) return { error: "Enrollment not found" };

  if (scope !== null && scope.length > 0 && enrollment.program && !scope.includes(enrollment.program)) {
    return { error: "You can only assign sections for your program(s)" };
  }

  const section = await getSectionById(sectionId);
  if (!section) return { error: "Section not found" };

  if (enrollment.programId && section.programId && enrollment.programId !== section.programId) {
    return { error: "Section must belong to the enrollment's program" };
  }

  await updateEnrollmentSection(enrollmentId, sectionId);
  if (enrollment.status === "approved" || enrollment.status === "enrolled") {
    await finalizeEnrollmentClasses(enrollmentId);
  }

  revalidatePath("/program-head/sectioning");
  revalidatePath("/program-head/enrollments");
  revalidatePath("/program-head/sections");
  return { success: true };
}
