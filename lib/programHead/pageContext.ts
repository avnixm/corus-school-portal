import "server-only";
import { getProgramHeadScopePrograms } from "@/lib/programHead/scope";
import { getSchoolYearsList, getTermsBySchoolYearId, getActiveSchoolYear, getGradingPeriodsBySchoolYearTerm } from "@/db/queries";

export type ProgramHeadSyTermParams = {
  schoolYearId?: string | null;
  termId?: string | null;
};

export type ProgramHeadScopeAndSyTermResult = {
  scope: Awaited<ReturnType<typeof getProgramHeadScopePrograms>>;
  schoolYears: Awaited<ReturnType<typeof getSchoolYearsList>>;
  activeSy: Awaited<ReturnType<typeof getActiveSchoolYear>>;
  terms: Awaited<ReturnType<typeof getTermsBySchoolYearId>>;
  syId: string | null;
  termId: string | null;
  needsScope: boolean;
};

/**
 * Resolves program head scope and school year/term for scope-gated pages.
 * Returns needsScope: true when scope is null or empty (show Settings message).
 */
export async function getProgramHeadScopeAndSyTerm(
  userId: string,
  params: ProgramHeadSyTermParams,
  options?: { includeGradingPeriods?: boolean }
): Promise<
  ProgramHeadScopeAndSyTermResult & {
    gradingPeriods?: Awaited<ReturnType<typeof getGradingPeriodsBySchoolYearTerm>>;
  }
> {
  const [scope, schoolYears, activeSy] = await Promise.all([
    getProgramHeadScopePrograms(userId),
    getSchoolYearsList(),
    getActiveSchoolYear(),
  ]);
  const terms = params.schoolYearId
    ? await getTermsBySchoolYearId(params.schoolYearId)
    : activeSy
      ? await getTermsBySchoolYearId(activeSy.id)
      : [];
  const syId = params.schoolYearId ?? activeSy?.id ?? null;
  const termId = params.termId ?? null;
  const needsScope = scope === null || scope.length === 0;

  const result: ProgramHeadScopeAndSyTermResult & {
    gradingPeriods?: Awaited<ReturnType<typeof getGradingPeriodsBySchoolYearTerm>>;
  } = {
    scope,
    schoolYears,
    activeSy,
    terms,
    syId,
    termId,
    needsScope,
  };

  if (options?.includeGradingPeriods && syId && termId) {
    result.gradingPeriods = await getGradingPeriodsBySchoolYearTerm(syId, termId);
  }

  return result;
}
