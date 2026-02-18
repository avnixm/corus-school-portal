import Link from "next/link";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { getProgramHeadScopePrograms } from "@/lib/programHead/scope";
import { getSectionsWithLoads } from "@/lib/programHead/queries";
import { getSchoolYearsList, getTermsBySchoolYearId, getActiveSchoolYear } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionsFilters } from "./SectionsFilters";

export const dynamic = "force-dynamic";

const OVERLOAD_THRESHOLD = 40;

export const metadata = { title: "Sections" };

export default async function ProgramHeadSectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ schoolYearId?: string; termId?: string }>;
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
          Sections & Loads
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

  const rows = await getSectionsWithLoads(scope, syId ?? null, termId ?? null);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Sections & Loads
        </h2>
        <p className="mt-1 text-sm text-neutral-800">
          Enrolled count and schedule completeness per section.
        </p>
      </section>

      <SectionsFilters
        schoolYears={schoolYears}
        terms={terms}
        currentSchoolYearId={syId ?? undefined}
        currentTermId={termId ?? undefined}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">
            Sections ({rows.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border bg-white/80 text-sm">
            <table className="min-w-full">
              <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2 text-left">Section</th>
                  <th className="px-4 py-2 text-left">Program</th>
                  <th className="px-4 py-2 text-left">Year Level</th>
                  <th className="px-4 py-2 text-right">Enrolled</th>
                  <th className="px-4 py-2 text-right">Schedules</th>
                  <th className="px-4 py-2 text-left">Complete</th>
                  <th className="px-4 py-2 text-left">Overload</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const overload = r.enrolledCount > OVERLOAD_THRESHOLD;
                  return (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="px-4 py-2 font-medium">{r.name}</td>
                      <td className="px-4 py-2">{r.program ?? "—"}</td>
                      <td className="px-4 py-2">{r.yearLevel ?? "—"}</td>
                      <td className="px-4 py-2 text-right">{r.enrolledCount}</td>
                      <td className="px-4 py-2 text-right">{r.scheduleCount}</td>
                      <td className="px-4 py-2">
                        {r.scheduleCount > 0 ? (
                          <span className="text-green-600">Yes</span>
                        ) : (
                          <span className="text-amber-600">No</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {overload ? (
                          <span className="rounded bg-amber-100 px-2 py-0.5 text-xs uppercase text-amber-800">
                            &gt;{OVERLOAD_THRESHOLD}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-neutral-600">
                      No sections. Select school year and term.
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
