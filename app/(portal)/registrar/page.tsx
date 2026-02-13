import {
  getPendingApplicationsCount,
  getApprovedTodayCount,
  getRejectedTodayCount,
  getPendingEnrollmentApprovalsCount,
  getActiveEnrollmentsCount,
  getRequirementVerificationsAwaitingCount,
  getAnnouncementsThisWeekCount,
  getLatestPendingEnrollmentApprovals,
  getRecentAnnouncements,
} from "@/db/queries";
import Link from "next/link";
import {
  ClipboardList,
  CheckCircle,
  XCircle,
  BadgeCheck,
  Users,
  FileCheck,
  Megaphone,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function fullName(row: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
}) {
  return [row.firstName, row.middleName, row.lastName].filter(Boolean).join(" ");
}

export default async function RegistrarDashboardPage() {
  const [
    pendingAppCount,
    approvedToday,
    rejectedToday,
    pendingEnrollmentCount,
    activeEnrollmentsCount,
    requirementsAwaitingCount,
    announcementsThisWeek,
    latestPendingEnrollments,
    recentAnnouncements,
  ] = await Promise.all([
    getPendingApplicationsCount(),
    getApprovedTodayCount(),
    getRejectedTodayCount(),
    getPendingEnrollmentApprovalsCount(),
    getActiveEnrollmentsCount(),
    getRequirementVerificationsAwaitingCount(),
    getAnnouncementsThisWeekCount(),
    getLatestPendingEnrollmentApprovals(5),
    getRecentAnnouncements(5),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Registrar Dashboard
        </h2>
        <p className="mt-1 text-sm text-neutral-700">
          Overview of enrollment setup, approvals, and announcements.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-800">
              Pending Applications
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-[#6A0000]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#6A0000]">
              {pendingAppCount}
            </div>
            <Link
              href="/registrar/pending"
              className="mt-2 inline-block text-xs font-medium text-[#6A0000] hover:underline"
            >
              View →
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-800">
              Enrollment Approvals
            </CardTitle>
            <BadgeCheck className="h-4 w-4 text-[#6A0000]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#6A0000]">
              {pendingEnrollmentCount}
            </div>
            <Link
              href="/registrar/approvals"
              className="mt-2 inline-block text-xs font-medium text-[#6A0000] hover:underline"
            >
              View →
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-800">
              Active Enrollments
            </CardTitle>
            <Users className="h-4 w-4 text-[#6A0000]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#6A0000]">
              {activeEnrollmentsCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-800">
              Reqs. Awaiting
            </CardTitle>
            <FileCheck className="h-4 w-4 text-[#6A0000]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#6A0000]">
              {requirementsAwaitingCount}
            </div>
            <Link
              href="/registrar/requirements"
              className="mt-2 inline-block text-xs font-medium text-[#6A0000] hover:underline"
            >
              View →
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-800">
              Approved Today
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {approvedToday}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-800">
              Rejected Today
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {rejectedToday}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-800">
              Announcements
            </CardTitle>
            <Megaphone className="h-4 w-4 text-[#6A0000]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#6A0000]">
              {announcementsThisWeek}
            </div>
            <p className="mt-1 text-xs text-neutral-700">This week</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#6A0000]">
              Latest Pending Enrollment Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {latestPendingEnrollments.map((row) => (
                <Link
                  key={row.id}
                  href={`/registrar/approvals?highlight=${row.id}`}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-neutral-50"
                >
                  <span className="font-medium text-[#6A0000]">
                    {fullName(row)}
                  </span>
                  <span className="text-xs text-neutral-600">
                    {row.program ?? "—"} • {row.yearLevel ?? "—"}
                  </span>
                </Link>
              ))}
              {latestPendingEnrollments.length === 0 && (
                <p className="py-4 text-center text-sm text-neutral-500">
                  No pending enrollment approvals.
                </p>
              )}
            </div>
            <Link
              href="/registrar/approvals"
              className="mt-3 inline-block text-xs font-medium text-[#6A0000] hover:underline"
            >
              View all →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#6A0000]">
              Recent Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentAnnouncements.map((row) => (
                <Link
                  key={row.id}
                  href="/registrar/announcements"
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-neutral-50"
                >
                  <span className="font-medium text-[#6A0000]">{row.title}</span>
                  <span className="text-xs text-neutral-600">
                    {row.createdAt
                      ? new Date(row.createdAt).toLocaleDateString()
                      : "—"}
                  </span>
                </Link>
              ))}
              {recentAnnouncements.length === 0 && (
                <p className="py-4 text-center text-sm text-neutral-500">
                  No announcements yet.
                </p>
              )}
            </div>
            <Link
              href="/registrar/announcements"
              className="mt-3 inline-block text-xs font-medium text-[#6A0000] hover:underline"
            >
              View all →
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
