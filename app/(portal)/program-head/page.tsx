import Link from "next/link";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { getProgramHeadScopePrograms } from "@/lib/programHead/scope";
import {
  getDashboardCurrentTermEnrollments,
  getDashboardPendingGradeReleases,
  getDashboardAtRiskCount,
  getDashboardUnclearedCount,
  getEnrollmentTrendByYearLevel,
  getRecentAnnouncementsForProgramHead,
  getAttentionNeededSubmissions,
} from "@/lib/programHead/queries";
import { getRoleDisplayLabel } from "@/lib/announcements/roleLabel";
import { getActiveSchoolYear, getActiveTerm } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersRound, ClipboardCheck, AlertTriangle, ShieldCheck } from "lucide-react";
import { formatStatusForDisplay } from "@/lib/formatStatus";

export const dynamic = "force-dynamic";

export const metadata = { title: "Dashboard" };

export default async function ProgramHeadDashboardPage() {
  const user = await getCurrentUserWithRole();
  if (!user) return null;
  const scope = await getProgramHeadScopePrograms(user.userId);
  const activeSy = await getActiveSchoolYear();
  const activeTerm = await getActiveTerm();
  const syId = activeSy?.id ?? null;
  const termId = activeTerm?.id ?? null;

  if (scope === null || scope.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Program Head Dashboard
        </h2>
        <Card>
          <CardContent className="pt-6">
            <p className="text-neutral-800">
              Set your program scope in{" "}
              <Link href="/program-head/settings" className="font-medium text-[#6A0000] underline">
                Settings
              </Link>{" "}
              to see analytics and data for your program.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [currentEnrollments, pendingReleases, atRisk, uncleared, trend, announcements, attention] =
    await Promise.all([
      getDashboardCurrentTermEnrollments(scope, syId, termId),
      getDashboardPendingGradeReleases(scope, syId, termId),
      getDashboardAtRiskCount(scope, syId, termId),
      getDashboardUnclearedCount(scope, syId, termId),
      getEnrollmentTrendByYearLevel(scope, syId, termId),
      getRecentAnnouncementsForProgramHead(5),
      getAttentionNeededSubmissions(scope, syId, termId, 5),
    ]);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Program Head Dashboard
        </h2>
        <p className="mt-1 text-sm text-neutral-800">
          {scope.length === 1
            ? `Program: ${scope[0]}`
            : `Programs: ${scope.join(", ")}`}{" "}
          · Overview and analytics
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-800">
              Current Term Enrollments
            </CardTitle>
            <UsersRound className="h-4 w-4 text-[#6A0000]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#6A0000]">{currentEnrollments}</div>
            <Link
              href="/program-head/enrollments"
              className="mt-2 inline-block text-xs font-medium text-[#6A0000] hover:underline"
            >
              View →
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-800">
              Pending Grade Releases
            </CardTitle>
            <ClipboardCheck className="h-4 w-4 text-[#6A0000]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#6A0000]">{pendingReleases}</div>
            <Link
              href="/program-head/submissions"
              className="mt-2 inline-block text-xs font-medium text-[#6A0000] hover:underline"
            >
              View →
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-800">
              At-Risk Students
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-[#6A0000]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#6A0000]">{atRisk}</div>
            <p className="mt-1 text-xs text-neutral-600">Avg &lt; 75 (released grades)</p>
            <Link
              href="/program-head/grades"
              className="mt-2 inline-block text-xs font-medium text-[#6A0000] hover:underline"
            >
              View →
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-800">
              Uncleared Enrollments
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-[#6A0000]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#6A0000]">{uncleared}</div>
            <Link
              href="/program-head/clearance"
              className="mt-2 inline-block text-xs font-medium text-[#6A0000] hover:underline"
            >
              View →
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-neutral-900">
              Enrollment by Year Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-xl border bg-white/80 text-sm">
              <table className="min-w-full">
                <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                  <tr>
                    <th className="px-4 py-2 text-left">Year Level</th>
                    <th className="px-4 py-2 text-right">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {trend.map((r) => (
                    <tr key={r.yearLevel ?? "null"} className="border-b last:border-0">
                      <td className="px-4 py-2">{r.yearLevel ?? "—"}</td>
                      <td className="px-4 py-2 text-right">{r.count}</td>
                    </tr>
                  ))}
                  {trend.length === 0 && (
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
              Recent Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {announcements.map((a) => (
                <li key={a.id} className="rounded border px-3 py-2 text-sm">
                  <span className="text-xs font-semibold uppercase text-[#6A0000]">
                    {getRoleDisplayLabel(a.createdByRole)}
                  </span>
                  <span className="ml-2 font-medium text-[#6A0000]">{a.title}</span>
                  <span className="ml-2 text-xs text-neutral-500">
                    {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ""}
                  </span>
                </li>
              ))}
              {announcements.length === 0 && (
                <li className="py-4 text-center text-sm text-neutral-600">No announcements</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">
            Attention Needed (grade submissions not yet released)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border bg-white/80 text-sm">
            <table className="min-w-full">
              <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2 text-left">Subject · Section</th>
                  <th className="px-4 py-2 text-left">Period</th>
                  <th className="px-4 py-2 text-left">Teacher</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-right">Updated</th>
                </tr>
              </thead>
              <tbody>
                {attention.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="px-4 py-2">
                      <Link
                        href={`/registrar/grades/${s.id}`}
                        className="font-medium text-[#6A0000] hover:underline"
                      >
                        {s.subjectCode} — {s.sectionName}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{s.gradingPeriodName}</td>
                    <td className="px-4 py-2">
                      {s.teacherFirstName} {s.teacherLastName}
                    </td>
                    <td className="px-4 py-2">
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs uppercase text-amber-800">
                        {formatStatusForDisplay(s.status)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-neutral-600">
                      {s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
                {attention.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-center text-neutral-600">
                      No submissions needing attention
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
