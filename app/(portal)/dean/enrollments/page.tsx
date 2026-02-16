import {
  getDeanEnrollmentsByProgram,
  getDeanEnrollmentsByYearLevel,
  getDeanEnrollmentsBySection,
} from "@/lib/dean/queries";
import { getSchoolYearsList, getTermsBySchoolYearId, getActiveSchoolYear } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeanEnrollmentsFilters } from "./DeanEnrollmentsFilters";

export const dynamic = "force-dynamic";

export const metadata = { title: "Enrollments" };

export default async function DeanEnrollmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ schoolYearId?: string; termId?: string; program?: string; yearLevel?: string }>;
}) {
  const params = await searchParams;
  const schoolYears = await getSchoolYearsList();
  const activeSy = await getActiveSchoolYear();
  const terms = params.schoolYearId
    ? await getTermsBySchoolYearId(params.schoolYearId)
    : activeSy
      ? await getTermsBySchoolYearId(activeSy.id)
      : [];
  const syId = params.schoolYearId ?? activeSy?.id ?? null;
  const termId = params.termId ?? null;
  const filters = {
    schoolYearId: syId,
    termId,
    program: params.program ?? null,
    yearLevel: params.yearLevel ?? null,
  };

  const [byProgram, byYearLevel, bySection] = await Promise.all([
    getDeanEnrollmentsByProgram(filters),
    getDeanEnrollmentsByYearLevel(filters),
    getDeanEnrollmentsBySection(filters),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Enrollment Overview
        </h2>
        <p className="mt-1 text-sm text-neutral-800">
          Institution-wide enrollment counts. Filter by school year, term, program, year level.
        </p>
      </section>

      <DeanEnrollmentsFilters
        schoolYears={schoolYears}
        terms={terms}
        current={{ schoolYearId: syId, termId, program: params.program, yearLevel: params.yearLevel }}
      />

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-neutral-900">
              By Program
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border bg-white/80 text-sm">
              <table className="min-w-full">
                <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                  <tr>
                    <th className="px-4 py-2 text-left">Program</th>
                    <th className="px-4 py-2 text-right">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {byProgram.map((r) => (
                    <tr key={r.program ?? "n"} className="border-b last:border-0">
                      <td className="px-4 py-2">{r.program ?? "—"}</td>
                      <td className="px-4 py-2 text-right">{r.count}</td>
                    </tr>
                  ))}
                  {byProgram.length === 0 && (
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
      </section>

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
                  <tr key={r.sectionName + (r.program ?? "")} className="border-b last:border-0">
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
    </div>
  );
}
