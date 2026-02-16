import Link from "next/link";
import { getRoleDisplayLabel } from "@/lib/announcements/roleLabel";
import {
  getDeanDashboardTotalEnrollments,
  getDeanDashboardPendingApprovals,
  getDeanDashboardUnreleasedSubmissions,
  getDeanDashboardUncleared,
  getDeanEnrollmentByProgram,
  getDeanCollectionThisMonth,
  getDeanAcademicRiskCount,
  getDeanRecentAnnouncements,
} from "@/lib/dean/queries";
import { getActiveSchoolYear, getActiveTerm } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersRound, ClipboardCheck, AlertCircle, ShieldCheck, Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = { title: "Dashboard" };

export default async function DeanDashboardPage() {
  const activeSy = await getActiveSchoolYear();
  const activeTerm = await getActiveTerm();
  const syId = activeSy?.id ?? null;
  const termId = activeTerm?.id ?? null;

  const [
    totalEnrollments,
    pendingApprovals,
    unreleasedSubmissions,
    uncleared,
    enrollmentByProgram,
    collection,
    academicRisk,
    recentAnnouncements,
  ] = await Promise.all([
    getDeanDashboardTotalEnrollments(syId, termId),
    getDeanDashboardPendingApprovals(),
    getDeanDashboardUnreleasedSubmissions(syId, termId),
    getDeanDashboardUncleared(syId, termId),
    getDeanEnrollmentByProgram({ schoolYearId: syId, termId }, 8),
    getDeanCollectionThisMonth(),
    getDeanAcademicRiskCount(syId, termId),
    getDeanRecentAnnouncements(10),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Dean Dashboard
        </h2>
        <p className="mt-1 text-sm text-neutral-800">
          Institution-wide analytics and oversight.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-800">
              Total Enrollments
            </CardTitle>
            <UsersRound className="h-4 w-4 text-[#6A0000]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#6A0000]">{totalEnrollments}</div>
            <Link
              href="/dean/enrollments"
              className="mt-2 inline-block text-xs font-medium text-[#6A0000] hover:underline"
            >
              View →
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-800">
              Pending Enrollment Approvals
            </CardTitle>
            <ClipboardCheck className="h-4 w-4 text-[#6A0000]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#6A0000]">{pendingApprovals}</div>
            <Link
              href="/dean/operations"
              className="mt-2 inline-block text-xs font-medium text-[#6A0000] hover:underline"
            >
              View →
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-800">
              Unreleased Grade Submissions
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-[#6A0000]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#6A0000]">{unreleasedSubmissions}</div>
            <Link
              href="/dean/operations"
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
              href="/dean/operations"
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
              Enrollment by Program (top 8)
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
                  {enrollmentByProgram.map((r) => (
                    <tr key={r.program ?? "n"} className="border-b last:border-0">
                      <td className="px-4 py-2">{r.program ?? "—"}</td>
                      <td className="px-4 py-2 text-right">{r.count}</td>
                    </tr>
                  ))}
                  {enrollmentByProgram.length === 0 && (
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
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-neutral-900">
              Collection This Month
            </CardTitle>
            <Wallet className="h-4 w-4 text-[#6A0000]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#6A0000]">
              ₱{collection.total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </div>
            <p className="mt-1 text-xs text-neutral-600">{collection.count} payment(s)</p>
            {Object.keys(collection.byMethod).length > 0 && (
              <ul className="mt-2 space-y-1 text-xs text-neutral-700">
                {Object.entries(collection.byMethod).map(([method, amt]) => (
                  <li key={method}>
                    {method}: ₱{amt.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-neutral-900">
              Academic Risk Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[#6A0000]">{academicRisk}</p>
            <p className="mt-1 text-xs text-neutral-600">
              Students with released grade average &lt; 75
            </p>
            <Link
              href="/dean/academics"
              className="mt-2 inline-block text-xs font-medium text-[#6A0000] hover:underline"
            >
              View Academics →
            </Link>
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
              {recentAnnouncements.map((a) => (
                <li key={a.id} className="rounded border px-3 py-2 text-sm">
                  <span className="text-xs font-semibold uppercase text-[#6A0000]">
                    {getRoleDisplayLabel(a.createdByRole)}
                  </span>
                  <span className="ml-2 font-medium text-[#6A0000]">{a.title}</span>
                  {a.pinned && (
                    <span className="ml-2 text-xs text-amber-600">Pinned</span>
                  )}
                  <span className="ml-2 text-xs text-neutral-500">
                    {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ""}
                  </span>
                </li>
              ))}
              {recentAnnouncements.length === 0 && (
                <li className="py-4 text-center text-sm text-neutral-600">
                  No announcements
                </li>
              )}
            </ul>
            <Link
              href="/dean/announcements"
              className="mt-2 inline-block text-xs font-medium text-[#6A0000] hover:underline"
            >
              Manage →
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
