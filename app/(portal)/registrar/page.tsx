import {
  getPendingEnrollmentApprovalsCount,
  getActiveEnrollmentsCount,
  getRequirementVerificationsAwaitingCount,
  getAnnouncementsThisWeekCount,
  getLatestPendingEnrollmentApprovals,
  getRecentAnnouncements,
  getGradeSubmissionsAwaitingReviewCount,
  getPendingClearancesCount,
  getRecentRequirementSubmissions,
  getRecentGradeSubmissions,
  getRecentlyCompletedProfiles,
  getRecentlyCompletedProfilesCount,
} from "@/db/queries";
import Link from "next/link";
import { getRoleDisplayLabel } from "@/lib/announcements/roleLabel";
import {
  BadgeCheck,
  Users,
  FileCheck,
  Megaphone,
  Send,
  CreditCard,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    pendingEnrollmentCount,
    activeEnrollmentsCount,
    requirementsAwaitingCount,
    announcementsThisWeek,
    latestPendingEnrollments,
    recentAnnouncements,
    gradeSubmissionsAwaitingCount,
    pendingClearancesCount,
    recentRequirementSubmissions,
    recentGradeSubmissions,
    recentRegistrations,
    recentRegistrationsCount,
  ] = await Promise.all([
    getPendingEnrollmentApprovalsCount(),
    getActiveEnrollmentsCount(),
    getRequirementVerificationsAwaitingCount(),
    getAnnouncementsThisWeekCount(),
    getLatestPendingEnrollmentApprovals(10),
    getRecentAnnouncements(5),
    getGradeSubmissionsAwaitingReviewCount(),
    getPendingClearancesCount(),
    getRecentRequirementSubmissions(10),
    getRecentGradeSubmissions(10),
    getRecentlyCompletedProfiles(10),
    getRecentlyCompletedProfilesCount(),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Registrar Dashboard
        </h2>
        <p className="mt-1 text-sm text-neutral-800">
          Overview of enrollment setup, approvals, and announcements.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              Reqs. to verify
            </CardTitle>
            <FileCheck className="h-4 w-4 text-[#6A0000]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#6A0000]">
              {requirementsAwaitingCount}
            </div>
            <Link
              href="/registrar/requirements/queue"
              className="mt-2 inline-block text-xs font-medium text-[#6A0000] hover:underline"
            >
              View queue →
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-800">
              Grade submissions awaiting review
            </CardTitle>
            <Send className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {gradeSubmissionsAwaitingCount}
            </div>
            <Link
              href="/registrar/grades"
              className="mt-2 inline-block text-xs font-medium text-[#6A0000] hover:underline"
            >
              View →
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-800">
              Pending clearances
            </CardTitle>
            <CreditCard className="h-4 w-4 text-[#6A0000]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#6A0000]">
              {pendingClearancesCount}
            </div>
            <p className="mt-1 text-xs text-neutral-600">Paid, not yet cleared (read-only)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-800">
              New registrations
            </CardTitle>
            <Users className="h-4 w-4 text-[#6A0000]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#6A0000]">
              {recentRegistrationsCount}
            </div>
            <Link
              href="/registrar/students"
              className="mt-2 inline-block text-xs font-medium text-[#6A0000] hover:underline"
            >
              View →
            </Link>
            <p className="mt-1 text-xs text-neutral-600">Completed profile (last 7 days)</p>
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
            <p className="mt-1 text-xs text-neutral-800">This week</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#6A0000]">
              New registrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentRegistrations.map((row) => (
                <Link
                  key={row.id}
                  href={`/registrar/students/${row.id}`}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-neutral-50"
                >
                  <span className="font-medium text-[#6A0000]">
                    {fullName(row)}
                  </span>
                  <span className="text-xs text-neutral-800">
                    {row.profileCompletedAt
                      ? new Date(row.profileCompletedAt).toLocaleDateString()
                      : "—"}
                  </span>
                </Link>
              ))}
              {recentRegistrations.length === 0 && (
                <p className="py-4 text-center text-sm text-neutral-700">
                  No new registrations yet.
                </p>
              )}
            </div>
            <Link
              href="/registrar/students"
              className="mt-3 inline-block text-xs font-medium text-[#6A0000] hover:underline"
            >
              View all →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#6A0000]">
              Recent enrollment requests
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
                  <span className="text-xs text-neutral-800">
                    {row.program ?? "—"} • {row.yearLevel ?? "—"}
                  </span>
                </Link>
              ))}
              {latestPendingEnrollments.length === 0 && (
                <p className="py-4 text-center text-sm text-neutral-700">
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
              Recent requirement submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentRequirementSubmissions.map((row) => (
                <Link
                  key={row.id}
                  href="/registrar/requirements/queue"
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-neutral-50"
                >
                  <span className="font-medium text-[#6A0000]">
                    {row.requirementCode ?? row.requirementName} — {[row.firstName, row.lastName].filter(Boolean).join(" ")}
                  </span>
                  <span className="text-xs text-neutral-800">
                    {row.submittedAt ? new Date(row.submittedAt).toLocaleDateString() : "—"}
                  </span>
                </Link>
              ))}
              {recentRequirementSubmissions.length === 0 && (
                <p className="py-4 text-center text-sm text-neutral-700">
                  No submissions to verify.
                </p>
              )}
            </div>
            <Link
              href="/registrar/requirements/queue"
              className="mt-3 inline-block text-xs font-medium text-[#6A0000] hover:underline"
            >
              View queue →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#6A0000]">
              Recent grade submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentGradeSubmissions.map((row) => (
                <Link
                  key={row.id}
                  href={`/registrar/grades/${row.id}`}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-neutral-50"
                >
                  <span className="font-medium text-[#6A0000]">
                    {row.subjectCode} — {row.sectionName} ({row.gradingPeriodName})
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {row.status}
                  </Badge>
                </Link>
              ))}
              {recentGradeSubmissions.length === 0 && (
                <p className="py-4 text-center text-sm text-neutral-700">
                  No grade submissions yet.
                </p>
              )}
            </div>
            <Link
              href="/registrar/grades"
              className="mt-3 inline-block text-xs font-medium text-[#6A0000] hover:underline"
            >
              View all →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#6A0000]">
              Recent announcements
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase text-[#6A0000]">
                      {getRoleDisplayLabel(row.createdByRole)}
                    </span>
                    <span className="font-medium text-[#6A0000]">{row.title}</span>
                  </div>
                  <span className="text-xs text-neutral-800">
                    {row.createdAt
                      ? new Date(row.createdAt).toLocaleDateString()
                      : "—"}
                  </span>
                </Link>
              ))}
              {recentAnnouncements.length === 0 && (
                <p className="py-4 text-center text-sm text-neutral-700">
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
