import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  FileCheck,
  CreditCard,
  NotebookText,
  Calendar,
  Megaphone,
} from "lucide-react";
import {
  getEnrollmentForStudentActiveTerm,
  getAnnouncementsForStudent,
  getReleasedGradesByStudentAndEnrollment,
  getScheduleWithDetailsByEnrollmentId,
} from "@/db/queries";
import { getCurrentStudent } from "@/lib/auth/getCurrentStudent";
import {
  computeRequirementProgress,
  getEnrolledStudentMissingRequiredFormNames,
} from "@/lib/requirements/progress";
import { getStudentBalance } from "@/lib/finance/queries";
import { getAssessmentsByEnrollment } from "@/lib/finance/queries";
import Link from "next/link";
import { formatStatusForDisplay } from "@/lib/formatStatus";
import { getRoleDisplayLabel } from "@/lib/announcements/roleLabel";
import { ProfileCompletenessWidget } from "@/components/student/ProfileCompletenessWidget";
import { computeProfileCompleteness } from "@/lib/student/profileCompleteness";
import { db } from "@/db";
import { studentAddresses, students } from "@/db/schema";
import { eq } from "drizzle-orm";

async function getDashboardData(studentId: string) {
  const enrollment = await getEnrollmentForStudentActiveTerm(studentId);
  const isEnrolled =
    enrollment?.status === "approved" || enrollment?.status === "enrolled";
  const [
    requirementsProgress,
    efs,
    assessments,
    grades,
    schedule,
    announcements,
    missingRequiredFormNames,
  ] = await Promise.all([
    enrollment?.id ? computeRequirementProgress(enrollment.id) : Promise.resolve(null),
    enrollment?.id ? getStudentBalance(enrollment.id) : Promise.resolve(null),
    enrollment?.id ? getAssessmentsByEnrollment(enrollment.id) : Promise.resolve([]),
    enrollment?.id
      ? getReleasedGradesByStudentAndEnrollment(studentId, enrollment.id)
      : Promise.resolve([]),
    enrollment?.id && isEnrolled
      ? getScheduleWithDetailsByEnrollmentId(enrollment.id, 20)
      : Promise.resolve([]),
    getAnnouncementsForStudent(3, enrollment?.program ?? undefined),
    enrollment?.id && isEnrolled
      ? getEnrolledStudentMissingRequiredFormNames(enrollment.id)
      : Promise.resolve([]),
  ]);

  const postedAssessment = assessments?.find((a) => a.status === "posted") ?? null;
  const balanceDue = efs?.balance ?? null;
  const todayDay = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];
  const todaySchedule = schedule?.filter((s) => s.day === todayDay) ?? [];

  return {
    enrollment,
    requirementsProgress,
    balanceDue,
    postedAssessment,
    grades: grades ?? [],
    todaySchedule,
    announcements: announcements ?? [],
    missingRequiredFormNames: missingRequiredFormNames ?? [],
  };
}

export const metadata = { title: "Dashboard" };

export default async function StudentDashboardPage() {
  const user = await getCurrentStudent();
  const studentId = user?.studentId && String(user.studentId).trim() ? user.studentId : null;
  if (!studentId) {
    const { redirect } = await import("next/navigation");
    redirect("/student/complete-profile");
  }
  const studentName =
    user?.student?.firstName ?? user?.profile?.fullName?.split(" ")[0] ?? "Student";
  const data = await getDashboardData(studentId as string);

  // QW3: Profile completeness check
  const [fullStudent] = await db
    .select()
    .from(students)
    .where(eq(students.id, studentId as string))
    .limit(1);

  const [address] = await db
    .select()
    .from(studentAddresses)
    .where(eq(studentAddresses.studentId, studentId as string))
    .limit(1);

  const profileCompleteness = fullStudent
    ? computeProfileCompleteness(fullStudent, address ?? null)
    : null;

  return (
    <div className="space-y-8">
      {/* QW3: Profile completeness widget */}
      {profileCompleteness && !profileCompleteness.isComplete && (
        <ProfileCompletenessWidget
          percentage={profileCompleteness.percentage}
          missingFields={profileCompleteness.missingFields}
          isComplete={profileCompleteness.isComplete}
        />
      )}

      {data.missingRequiredFormNames.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
          <p className="font-semibold">Required documents to submit</p>
          <p className="mt-1 text-sm">
            You must submit the required forms below before you can access Schedule, Billing, and Grades.
          </p>
          <ul className="mt-2 list-inside list-disc text-sm">
            {data.missingRequiredFormNames.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
          <Link href="/student/requirements" className="mt-3 inline-block">
            <Button size="sm" className="bg-amber-700 hover:bg-amber-800">
              Go to Forms & Requirements
            </Button>
          </Link>
        </div>
      )}

      <section className="space-y-3">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
            Welcome back, {studentName} 👋
          </h2>
          <p className="max-w-xl text-sm text-neutral-700">
            Here&apos;s your overview. Track enrollment, requirements, billing, and classes in one place.
          </p>
        </div>
        {data.enrollment && (
          <Badge className="bg-[#6A0000] text-white border-transparent">
            {data.enrollment.schoolYearName} · {data.enrollment.termName}
          </Badge>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 [&>*]:flex [&>*]:flex-col [&>*]:h-full">
        {/* Enrollment Status */}
        <Card className="flex h-full flex-col border-[#6A0000]/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#6A0000]">
              Enrollment
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-[#6A0000]" />
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            {!data.enrollment ? (
              <>
                <p className="text-sm text-neutral-600">No enrollment for current term.</p>
                <Link href="/student/enrollment" className="mt-2 inline-block">
                  <Button size="sm" className="bg-[#6A0000] hover:bg-[#6A0000]/90">
                    Start enrollment
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{formatStatusForDisplay(data.enrollment.status)}</Badge>
                </div>
                <p className="mt-1 text-xs text-neutral-700">
                  {data.enrollment.status === "preregistered" && "Submit when requirements are ready."}
                  {data.enrollment.status === "pending_approval" && "Wait for registrar review."}
                  {data.enrollment.status === "rejected" && "Fix issues and resubmit if allowed."}
                  {data.enrollment.status === "approved" && "Proceed to billing."}
                  {data.enrollment.status === "enrolled" && "You're enrolled."}
                </p>
                <Link href="/student/enrollment" className="mt-2 text-xs font-medium text-[#6A0000] hover:underline">
                  View enrollment →
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        {/* Requirements Progress */}
        {data.enrollment?.id && data.requirementsProgress != null && (
          <Link href="/student/requirements" className="flex h-full flex-col">
            <Card
              className={
                "flex h-full flex-col " +
              (data.requirementsProgress.blocking.length > 0
                  ? "border-amber-300 bg-amber-50/50 transition-colors hover:bg-amber-50"
                  : "transition-colors hover:bg-neutral-50")
              }
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[#6A0000]">
                  Requirements
                </CardTitle>
                <FileCheck className="h-4 w-4 text-[#6A0000]" />
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <div className="text-3xl font-bold text-[#6A0000]">
                  {data.requirementsProgress.verifiedCount} / {data.requirementsProgress.requiredCount || 1} verified
                </div>
                <p className="mt-1 text-xs text-neutral-700">
                  {data.requirementsProgress.blocking.length > 0
                    ? "Upload missing forms and submit for verification"
                    : "All required forms verified"}
                </p>
                <p className="mt-1 text-xs font-medium text-[#6A0000]">
                  {data.requirementsProgress.blocking.length > 0 ? "Upload forms →" : "View requirements →"}
                </p>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Balance Due */}
        {data.enrollment?.id && (
          <Link href="/student/billing" className="flex h-full flex-col">
            <Card className="flex h-full flex-col transition-colors hover:bg-neutral-50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[#6A0000]">
                  Balance
                </CardTitle>
                <CreditCard className="h-4 w-4 text-[#6A0000]" />
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <div className="text-3xl font-bold text-[#6A0000]">
                  ₱{data.postedAssessment ? Number(data.balanceDue ?? 0).toLocaleString() : "—"}
                </div>
                <p className="mt-1 text-xs text-neutral-700">
                  {!data.postedAssessment
                    ? "Awaiting assessment"
                    : "View billing & payment history"}
                </p>
                <p className="mt-1 text-xs font-medium text-[#6A0000]">Billing →</p>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Latest grades (released only) */}
        <Link href="/student/grades" className="flex h-full flex-col">
          <Card className="flex h-full flex-col transition-colors hover:bg-neutral-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[#6A0000]">
                Grades
              </CardTitle>
              <NotebookText className="h-4 w-4 text-[#6A0000]" />
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <div className="text-3xl font-bold text-[#6A0000]">
                {data.grades.length > 0 ? data.grades.length : "—"}
              </div>
              <p className="mt-1 text-xs text-neutral-700">
                {data.grades.length > 0
                  ? "Released grades this term"
                  : "Grades not released yet"}
              </p>
              <p className="mt-1 text-xs font-medium text-[#6A0000]">View grades →</p>
            </CardContent>
          </Card>
        </Link>
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr,1.2fr]">
        {/* Today's classes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#6A0000]">
              Today&apos;s classes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.todaySchedule.length === 0 ? (
              <p className="text-sm text-neutral-600">No classes scheduled today.</p>
            ) : (
              data.todaySchedule.slice(0, 5).map((cls, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border bg-neutral-50 px-3 py-2 text-sm"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-[#6A0000]">
                      {cls.subjectCode ?? "—"} {cls.subjectDescription ? `· ${cls.subjectDescription}` : ""}
                    </p>
                    <p className="text-xs text-neutral-700">
                      {cls.timeIn} – {cls.timeOut} · {cls.room ?? "—"}
                    </p>
                  </div>
                </div>
              ))
            )}
            <Link href="/student/schedule" className="text-xs font-medium text-[#6A0000] hover:underline">
              Full schedule →
            </Link>
          </CardContent>
        </Card>

        {/* Recent announcements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#6A0000]">
              Announcements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.announcements.length === 0 ? (
              <p className="text-sm text-neutral-600">No announcements.</p>
            ) : (
              data.announcements.map((a) => (
                <div key={a.id} className="rounded-lg border bg-white px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    {a.pinned && (
                      <Badge className="text-xs" variant="outline">Pinned</Badge>
                    )}
                    <span className="text-xs font-semibold uppercase text-[#6A0000]">
                      {getRoleDisplayLabel(a.createdByRole)}
                    </span>
                  </div>
                  <p className="mt-3 font-medium text-[#6A0000]">{a.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-neutral-600">{a.body}</p>
                </div>
              ))
            )}
            <Link href="/student/announcements" className="text-xs font-medium text-[#6A0000] hover:underline">
              All announcements →
            </Link>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#6A0000]">
              Quick actions
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link
              href="/student/grades"
              className="inline-flex h-8 items-center justify-center rounded-md border border-[--color-corus-maroon]/30 px-3 text-xs font-medium text-[--color-corus-maroon] hover:bg-[--color-corus-maroon]/5"
            >
              View grades
            </Link>
            <Link
              href="/student/billing"
              className="inline-flex h-8 items-center justify-center rounded-md border border-[--color-corus-maroon]/30 px-3 text-xs font-medium text-[--color-corus-maroon] hover:bg-[--color-corus-maroon]/5"
            >
              Billing
            </Link>
            <Link
              href="/student/announcements"
              className="inline-flex h-8 items-center justify-center rounded-md border border-[--color-corus-maroon]/30 px-3 text-xs font-medium text-[--color-corus-maroon] hover:bg-[--color-corus-maroon]/5"
            >
              Announcements
            </Link>
            <Link
              href="/student/schedule"
              className="inline-flex h-8 items-center justify-center rounded-md border border-[--color-corus-maroon]/30 px-3 text-xs font-medium text-[--color-corus-maroon] hover:bg-[--color-corus-maroon]/5"
            >
              Schedule
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
