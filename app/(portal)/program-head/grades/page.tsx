import Link from "next/link";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { getProgramHeadScopePrograms } from "@/lib/programHead/scope";
import {
  getGradePassFailCounts,
  getAverageGradeBySubject,
  getGradeDistribution,
  getTopBottomStudentsByAverage,
} from "@/lib/programHead/queries";
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
import { GradesFilters } from "./GradesFilters";


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

export const metadata = { title: "Grades" };

export default async function ProgramHeadGradesPage({
  searchParams,
}: {
  searchParams: Promise<{
    schoolYearId?: string;
    termId?: string;
    gradingPeriodId?: string;
    yearLevel?: string;
    subjectId?: string;
  }>;
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
  const gradingPeriods =
    syId && termId ? await getGradingPeriodsBySchoolYearTerm(syId, termId) : [];
  const subjectsList = await getSubjectsList();

  if (scope === null || scope.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Grade Analytics
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

  const filters = {
    schoolYearId: syId ?? undefined,
    termId: termId ?? undefined,
    gradingPeriodId: params.gradingPeriodId ?? undefined,
    yearLevel: params.yearLevel ?? undefined,
    subjectId: params.subjectId ?? undefined,
  };

  const [passFail, avgBySubject, distribution, top10, bottom10] = await Promise.all([
    getGradePassFailCounts(scope, filters),
    getAverageGradeBySubject(scope, filters),
    getGradeDistribution(scope, filters),
    getTopBottomStudentsByAverage(scope, filters, "top", 10),
    getTopBottomStudentsByAverage(scope, filters, "bottom", 10),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Grade Analytics
        </h2>
        <p className="mt-1 text-sm text-neutral-800">
          Released grades only. Pass threshold: 75.
        </p>
      </section>

      <GradesFilters
        schoolYears={schoolYears}
        terms={terms}
        gradingPeriods={gradingPeriods}
        subjects={subjectsList}
        current={{ schoolYearId: syId, termId, gradingPeriodId: params.gradingPeriodId, yearLevel: params.yearLevel, subjectId: params.subjectId }}
      />

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-neutral-900">
              Pass / Fail
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              <div>
                <span className="text-2xl font-bold text-green-700">{passFail.pass}</span>
                <span className="ml-2 text-sm text-neutral-600">Pass (≥75)</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-red-700">{passFail.fail}</span>
                <span className="ml-2 text-sm text-neutral-600">Fail (&lt;75)</span>
              </div>
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
                        width: `${Math.min(100, (d.count / Math.max(1, distribution.reduce((a, x) => a + x.count, 0))) * 100)}%`,
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
          <div className="overflow-x-auto rounded-xl border bg-white/80 text-sm">
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
                  <tr key={s.subjectId} className="border-b last:border-0">
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

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-neutral-900">
              Top 10 by Average
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-xl border bg-white/80 text-sm">
              <table className="min-w-full">
                <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                  <tr>
                    <th className="px-4 py-2 text-left">Student</th>
                    <th className="px-4 py-2 text-right">Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {top10.map((s) => (
                    <tr key={s.studentId} className="border-b last:border-0">
                      <td className="px-4 py-2">
                        {s.studentCode ?? s.firstName} {s.lastName}
                      </td>
                      <td className="px-4 py-2 text-right">{s.avg ?? "—"}</td>
                    </tr>
                  ))}
                  {top10.length === 0 && (
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
              Bottom 10 by Average
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-xl border bg-white/80 text-sm">
              <table className="min-w-full">
                <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                  <tr>
                    <th className="px-4 py-2 text-left">Student</th>
                    <th className="px-4 py-2 text-right">Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {bottom10.map((s) => (
                    <tr key={s.studentId} className="border-b last:border-0">
                      <td className="px-4 py-2">
                        {s.studentCode ?? s.firstName} {s.lastName}
                      </td>
                      <td className="px-4 py-2 text-right">{s.avg ?? "—"}</td>
                    </tr>
                  ))}
                  {bottom10.length === 0 && (
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
    </div>
  );
}
