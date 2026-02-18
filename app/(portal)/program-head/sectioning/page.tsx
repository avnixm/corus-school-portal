import Link from "next/link";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { getProgramHeadScopePrograms } from "@/lib/programHead/scope";
import { getUnassignedEnrollmentsForSectioning } from "@/lib/programHead/queries";
import {
  getSchoolYearsList,
  getTermsBySchoolYearId,
  getActiveSchoolYear,
  getProgramsList,
  getProgramsByCodes,
  getSectionsList,
} from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectioningFilters } from "./SectioningFilters";
import { RunSmartSectioningButton } from "./RunSmartSectioningButton";
import { AssignSectionCell } from "./AssignSectionCell";

export const dynamic = "force-dynamic";

export const metadata = { title: "Smart Sectioning" };

function fullName(row: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
}) {
  return [row.firstName, row.middleName, row.lastName].filter(Boolean).join(" ");
}

export default async function ProgramHeadSectioningPage({
  searchParams,
}: {
  searchParams: Promise<{ schoolYearId?: string; termId?: string; programId?: string; yearLevel?: string }>;
}) {
  const user = await getCurrentUserWithRole();
  if (!user) return null;
  const scope = await getProgramHeadScopePrograms(user.userId);
  const params = await searchParams;

  const schoolYears = await getSchoolYearsList();
  const activeSy = await getActiveSchoolYear();
  const terms = params.schoolYearId
    ? await getTermsBySchoolYearId(params.schoolYearId)
    : activeSy
    ? await getTermsBySchoolYearId(activeSy.id)
    : [];
  const syId = params.schoolYearId ?? activeSy?.id;
  const termId = params.termId ?? terms[0]?.id;

  const programs =
    scope && scope.length > 0
      ? await getProgramsByCodes(scope)
      : await getProgramsList(true);
  const sections = await getSectionsList();

  if (scope === null || scope.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Smart Sectioning
        </h2>
        <p className="text-neutral-800">
          Set your program scope in{" "}
          <Link href="/program-head/settings" className="font-medium text-[#6A0000] underline">
            Settings
          </Link>{" "}
          first.
        </p>
      </div>
    );
  }

  const unassigned = await getUnassignedEnrollmentsForSectioning(scope, {
    schoolYearId: syId ?? undefined,
    termId: termId ?? undefined,
    programId: params.programId,
    yearLevel: params.yearLevel,
  });

  const canRunSmartSectioning = !!syId && !!termId;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <section>
          <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
            Smart Sectioning
          </h2>
          <p className="mt-1 text-sm text-neutral-800">
            Assign approved students without a section to blocks. Use &quot;Run smart sectioning&quot; to auto-assign by balanced count, or assign manually per row.
          </p>
        </section>
        {canRunSmartSectioning && (
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <RunSmartSectioningButton
              schoolYearId={syId!}
              termId={termId!}
              programId={params.programId}
              yearLevel={params.yearLevel}
              disabled={unassigned.length === 0}
            />
            <span className="text-sm text-neutral-600">
              {unassigned.length} student{unassigned.length !== 1 ? "s" : ""} waiting for section
            </span>
          </div>
        )}
      </div>

      <SectioningFilters
        schoolYears={schoolYears}
        terms={terms}
        programs={programs.map((p) => ({ id: p.id, code: p.code, name: p.name }))}
        currentSchoolYearId={syId ?? undefined}
        currentTermId={termId ?? undefined}
        programId={params.programId}
        yearLevel={params.yearLevel}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">
            Unassigned enrollments ({unassigned.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border bg-white/80 text-sm">
            <table className="min-w-full">
              <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2 text-left">Student</th>
                  <th className="px-4 py-2 text-left">Program</th>
                  <th className="px-4 py-2 text-left">Year Level</th>
                  <th className="px-4 py-2 text-left">Term</th>
                  <th className="px-4 py-2 text-left">Assign section</th>
                </tr>
              </thead>
              <tbody>
                {unassigned.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="px-4 py-2">
                      <span className="font-medium">{fullName(row)}</span>
                      {row.studentCode && (
                        <span className="ml-1 text-neutral-600">({row.studentCode})</span>
                      )}
                    </td>
                    <td className="px-4 py-2">{row.program ?? "—"}</td>
                    <td className="px-4 py-2">{row.yearLevel ?? "—"}</td>
                    <td className="px-4 py-2">
                      {row.schoolYearName} · {row.termName}
                    </td>
                    <td className="px-4 py-2">
                      <AssignSectionCell
                        enrollmentId={row.id}
                        sections={sections.map((s) => ({
                          id: s.id,
                          name: s.name,
                          yearLevel: s.yearLevel ?? null,
                          programId: s.programId ?? null,
                        }))}
                        enrollmentProgramId={row.programId}
                        enrollmentYearLevel={row.yearLevel}
                      />
                    </td>
                  </tr>
                ))}
                {unassigned.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-neutral-600">
                      {canRunSmartSectioning
                        ? "No unassigned enrollments. Select school year and term to see approved students without a section."
                        : "Select school year and term to see unassigned enrollments."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
