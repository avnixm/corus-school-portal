import {
  getDeanPassFailByProgram,
  getDeanAvgGradeBySubject,
  getDeanGradeDistribution,
  getDeanProgramsNeedingAttention,
} from "@/lib/dean/queries";
import {
  getSchoolYearsList,
  getTermsBySchoolYearId,
  getActiveSchoolYear,
  getGradingPeriodsBySchoolYearTerm,
} from "@/db/queries";
import { db } from "@/lib/db";
import { subjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeanAcademicsFilters } from "./DeanAcademicsFilters";

export const dynamic = "force-dynamic";

async function getSubjectsList() {
  try {
    return await db
      .select({ id: subjects.id, code: subjects.code, description: subjects.description })
      .from(subjects)
      .where(eq(subjects.active, true))
      .orderBy(subjects.code);
  } catch {
    return [];
  }
}

export default async function DeanAcademicsPage({
  searchParams,
}: {
  searchParams: Promise<{
    schoolYearId?: string;
    termId?: string;
    program?: string;
    gradingPeriodId?: string;
    subjectId?: string;
  }>;
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
  const gradingPeriods =
    syId && termId ? await getGradingPeriodsBySchoolYearTerm(syId, termId) : [];
  const subjectsList = await getSubjectsList();
  const filters = {
    schoolYearId: syId,
    termId,
    program: params.program ?? null,
    gradingPeriodId: params.gradingPeriodId ?? null,
    subjectId: params.subjectId ?? null,
  };

  const [passFailByProgram, avgBySubject, distribution, programsAttention] = await Promise.all([
    getDeanPassFailByProgram(filters),
    getDeanAvgGradeBySubject(filters),
    getDeanGradeDistribution(filters),
    getDeanProgramsNeedingAttention(filters, 10),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Academic Outcomes
        </h2>
        <p className="mt-1 text-sm text-neutral-800">
          Released grades only. Pass threshold: 75.
        </p>
      </section>

      <DeanAcademicsFilters
        schoolYears={schoolYears}
        terms={terms}
        gradingPeriods={gradingPeriods}
        subjects={subjectsList}
        current={{
          schoolYearId: syId,
          termId,
          program: params.program,
          gradingPeriodId: params.gradingPeriodId,
          subjectId: params.subjectId,
        }}
      />

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-neutral-900">
              Pass/Fail by Program
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border bg-white/80 text-sm">
              <table className="min-w-full">
                <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                  <tr>
                    <th className="px-4 py-2 text-left">Program</th>
                    <th className="px-4 py-2 text-right">Pass</th>
                    <th className="px-4 py-2 text-right">Fail</th>
                  </tr>
                </thead>
                <tbody>
                  {passFailByProgram.map((r) => (
                    <tr key={r.program ?? "n"} className="border-b last:border-0">
                      <td className="px-4 py-2">{r.program ?? "—"}</td>
                      <td className="px-4 py-2 text-right text-green-700">{r.pass}</td>
                      <td className="px-4 py-2 text-right text-red-700">{r.fail}</td>
                    </tr>
                  ))}
                  {passFailByProgram.length === 0 && (
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

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-neutral-900">
              Grade Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              {distribution.map((d) => (
                <div key={d.label} className="flex items-center gap-2">
                  <span className="w-16">{d.label}</span>
                  <div className="h-4 flex-1 max-w-[120px] overflow-hidden rounded bg-neutral-200">
                    <div
                      className="h-full bg-[#6A0000]"
                      style={{
                        width: `${Math.min(
                          100,
                          (d.count /
                            Math.max(
                              1,
                              distribution.reduce((a, x) => a + x.count, 0)
                            )) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-neutral-600">{d.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">
            Average Grade by Subject
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border bg-white/80 text-sm">
            <table className="min-w-full">
              <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2 text-left">Code</th>
                  <th className="px-4 py-2 text-left">Description</th>
                  <th className="px-4 py-2 text-right">Avg</th>
                  <th className="px-4 py-2 text-right">Count</th>
                </tr>
              </thead>
              <tbody>
                {avgBySubject.map((s) => (
                  <tr key={s.subjectCode} className="border-b last:border-0">
                    <td className="px-4 py-2">{s.subjectCode}</td>
                    <td className="px-4 py-2">{s.subjectDescription}</td>
                    <td className="px-4 py-2 text-right">{s.avg ?? "—"}</td>
                    <td className="px-4 py-2 text-right">{s.count}</td>
                  </tr>
                ))}
                {avgBySubject.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-center text-neutral-600">
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
            Programs Needing Attention (by fail count)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border bg-white/80 text-sm">
            <table className="min-w-full">
              <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2 text-left">Program</th>
                  <th className="px-4 py-2 text-right">Avg</th>
                  <th className="px-4 py-2 text-right">Fail</th>
                  <th className="px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {programsAttention.map((r) => (
                  <tr key={r.program ?? "n"} className="border-b last:border-0">
                    <td className="px-4 py-2">{r.program ?? "—"}</td>
                    <td className="px-4 py-2 text-right">{r.avg ?? "—"}</td>
                    <td className="px-4 py-2 text-right text-red-700">{r.failCount}</td>
                    <td className="px-4 py-2 text-right">{r.total}</td>
                  </tr>
                ))}
                {programsAttention.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-center text-neutral-600">
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
