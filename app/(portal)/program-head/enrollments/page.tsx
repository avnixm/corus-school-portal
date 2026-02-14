import Link from "next/link";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { getProgramHeadScopePrograms } from "@/lib/programHead/scope";
import { getEnrollmentsByYearLevel, getEnrollmentsBySection } from "@/lib/programHead/queries";
import { getSchoolYearsList, getTermsBySchoolYearId, getActiveSchoolYear } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnrollmentsFilters } from "./EnrollmentsFilters";


export const dynamic = "force-dynamic";

export default async function ProgramHeadEnrollmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ schoolYearId?: string; termId?: string; yearLevel?: string }>;
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
  const termId = params.termId;

  if (scope === null || scope.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Enrollment Analytics
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

  const [byYearLevel, bySection] = await Promise.all([
    getEnrollmentsByYearLevel(scope, { schoolYearId: syId ?? undefined, termId: termId ?? undefined }),
    getEnrollmentsBySection(scope, {
      schoolYearId: syId ?? undefined,
      termId: termId ?? undefined,
      yearLevel: params.yearLevel ?? undefined,
    }),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Enrollment Analytics
        </h2>
        <p className="mt-1 text-sm text-neutral-800">
          Enrollments by year level and section. Filter by school year and term.
        </p>
      </section>

      <EnrollmentsFilters
        schoolYears={schoolYears}
        terms={terms}
        currentSchoolYearId={syId ?? undefined}
        currentTermId={termId ?? undefined}
        yearLevel={params.yearLevel}
      />

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-neutral-900">
              By Year Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border bg-white/80 text-sm">
              <table className="min-w-full">
                <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                  <tr>
                    <th className="px-4 py-2 text-left">Year Level</th>
                    <th className="px-4 py-2 text-right">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {byYearLevel.map((r) => (
                    <tr key={r.yearLevel ?? "n"} className="border-b last:border-0">
                      <td className="px-4 py-2">{r.yearLevel ?? "—"}</td>
                      <td className="px-4 py-2 text-right">{r.count}</td>
                    </tr>
                  ))}
                  {byYearLevel.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-4 py-4 text-center text-neutral-600">
                        No data
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-neutral-900">
              By Section
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border bg-white/80 text-sm">
              <table className="min-w-full">
                <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                  <tr>
                    <th className="px-4 py-2 text-left">Section</th>
                    <th className="px-4 py-2 text-left">Program</th>
                    <th className="px-4 py-2 text-right">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {bySection.map((r) => (
                    <tr key={r.sectionId} className="border-b last:border-0">
                      <td className="px-4 py-2">{r.sectionName}</td>
                      <td className="px-4 py-2">{r.program ?? "—"}</td>
                      <td className="px-4 py-2 text-right">{r.count}</td>
                    </tr>
                  ))}
                  {bySection.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-4 text-center text-neutral-600">
                        No data
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      <p className="text-xs text-neutral-500">
        Export: not implemented. Use registrar or admin export if needed.
      </p>
    </div>
  );
}
