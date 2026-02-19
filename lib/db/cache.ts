import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { schoolYears, terms } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  getProgramsList as rawGetProgramsList,
  getRequirementsList as rawGetRequirementsList,
} from "@/db/queries";

/** Cache tag constants for revalidateTag(). */
export const CACHE_TAGS = {
  refPrograms: "ref:programs",
  refSubjects: "ref:subjects",
  refSchoolYears: "ref:schoolYears",
  refTerms: "ref:terms",
  refActiveSyTerm: "ref:activeSyTerm",
  refRequirements: "ref:requirements",
  refRequirementRules: "ref:requirementRules",
  announcements: "announcements",
  curriculumPublished: "curriculum:published",
  feeSetups: "feeSetups",
  studentDashboard: (studentId: string) => `student:${studentId}:dashboard` as const,
  enrollment: (enrollmentId: string) => `enrollment:${enrollmentId}` as const,
  finance: (enrollmentId: string) => `finance:${enrollmentId}` as const,
  registrarApprovals: "registrar:approvals" as const,
  registrarQueue: "registrar:queue" as const,
} as const;

const REF_DATA_REVALIDATE = 300; // 5 minutes

/** Cached active school year (reference data). */
export async function getCachedActiveSchoolYear() {
  return unstable_cache(
    async () => {
      const [row] = await db
        .select({
          id: schoolYears.id,
          name: schoolYears.name,
          isActive: schoolYears.isActive,
          createdAt: schoolYears.createdAt,
          updatedAt: schoolYears.updatedAt,
        })
        .from(schoolYears)
        .where(eq(schoolYears.isActive, true))
        .limit(1);
      return row ?? null;
    },
    ["active-school-year"],
    { tags: [CACHE_TAGS.refActiveSyTerm], revalidate: REF_DATA_REVALIDATE }
  )();
}

/** Cached active term (depends on active school year; same tag so both invalidate together). */
export async function getCachedActiveTerm() {
  return unstable_cache(
    async () => {
      const sy = await getCachedActiveSchoolYear();
      if (!sy) return null;
      const [row] = await db
        .select({
          id: terms.id,
          name: terms.name,
          schoolYearId: terms.schoolYearId,
          isActive: terms.isActive,
          createdAt: terms.createdAt,
          updatedAt: terms.updatedAt,
        })
        .from(terms)
        .where(
          and(eq(terms.schoolYearId, sy.id), eq(terms.isActive, true))
        )
        .limit(1);
      return row ?? null;
    },
    ["active-term"],
    { tags: [CACHE_TAGS.refActiveSyTerm], revalidate: REF_DATA_REVALIDATE }
  )();
}

/** Cached programs list (reference data). */
export async function getCachedProgramsList(activeOnly = true) {
  return unstable_cache(
    async () => rawGetProgramsList(activeOnly),
    ["programs-list", String(activeOnly)],
    { tags: [CACHE_TAGS.refPrograms], revalidate: REF_DATA_REVALIDATE }
  )();
}

/** Cached requirements list (reference data). */
export async function getCachedRequirementsList(activeOnly = true) {
  return unstable_cache(
    async () => rawGetRequirementsList(activeOnly),
    ["requirements-list", String(activeOnly)],
    { tags: [CACHE_TAGS.refRequirements], revalidate: REF_DATA_REVALIDATE }
  )();
}
