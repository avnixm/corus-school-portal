// path: app/(portal)/teacher/page.tsx
import { getTeacherDashboardData } from "./actions";
import Link from "next/link";
import {
  ClipboardList,
  NotebookPen,
  Send,
  Undo2,
  BookCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export const metadata = { title: "Dashboard" };

export default async function TeacherDashboardPage() {
  const data = await getTeacherDashboardData();
  if (!data) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Teacher Dashboard
        </h2>
        <p className="text-sm text-neutral-700">Unable to load dashboard. Ensure you are assigned as a teacher.</p>
      </div>
    );
  }

  const {
    classesCount,
    draftCount,
    submittedCount,
    returnedCount,
    releasedCount,
    classes,
    todaysClasses,
    recentSubmissions,
    returnedSubmissions,
    schoolYear,
    term,
    authorizedCourses,
  } = data;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Teacher Dashboard
        </h2>
        <p className="mt-1 text-sm text-neutral-800">
          {schoolYear?.name ?? "—"} • {term?.name ?? "—"}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-800">
              My Classes
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-[#6A0000]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#6A0000]">{classesCount}</div>
            <Link
              href="/teacher/classes"
              className="mt-2 inline-block text-xs font-medium text-[#6A0000] hover:underline"
            >
              View →
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-800">
              Draft gradebooks
            </CardTitle>
            <NotebookPen className="h-4 w-4 text-[#6A0000]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-600">{draftCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-800">
              Awaiting registrar
            </CardTitle>
            <Send className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{submittedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-800">
              Returned
            </CardTitle>
            <Undo2 className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{returnedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-800">
              Released this term
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{releasedCount}</div>
          </CardContent>
        </Card>
      </section>

      {returnedSubmissions.length > 0 && (
        <section>
          <Card className="border-red-200 bg-red-50/50">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-red-800">
                Action needed — returned for edits
              </CardTitle>
              <p className="text-xs text-red-700">
                Registrar returned these submissions. Please review remarks and resubmit.
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {returnedSubmissions.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/teacher/gradebook/${s.scheduleId}/${s.gradingPeriodId}`}
                      className="flex items-center justify-between rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-900 hover:bg-red-50"
                    >
                      <span>
                        {s.subjectCode} — {s.sectionName} ({s.gradingPeriodName})
                      </span>
                      <span className="text-xs">Open gradebook →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      )}

      {todaysClasses.length > 0 && (
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-[#6A0000]">
                Today&apos;s classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {todaysClasses.map((c) => (
                  <li key={c.scheduleId}>
                    <Link
                      href={`/teacher/classes/${c.scheduleId}`}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-neutral-50"
                    >
                      <span className="font-medium text-[#6A0000]">
                        {c.subjectCode} — {c.sectionName}
                      </span>
                      <span className="text-xs text-neutral-600">
                        {c.timeIn ?? "—"}–{c.timeOut ?? "—"}
                        {c.room ? ` • ${c.room}` : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#6A0000] flex items-center gap-2">
              <BookCheck className="h-4 w-4" />
              Authorized Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {authorizedCourses.length === 0 ? (
              <p className="py-4 text-center text-sm text-neutral-700">
                No courses assigned yet. Contact the Registrar to assign authorized courses.
              </p>
            ) : (
              <div className="space-y-2">
                {authorizedCourses.slice(0, 8).map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-medium text-[#6A0000]">
                          {c.subjectCode}
                        </span>
                        <Badge
                          variant="outline"
                          className={c.isGe ? "bg-blue-50 text-blue-700 text-xs" : "text-xs"}
                        >
                          {c.isGe ? "GE" : "Program"}
                        </Badge>
                      </div>
                      <p className="text-neutral-700 mt-0.5">{c.subjectTitle}</p>
                      <p className="text-xs text-neutral-500">{c.units || "0"} units</p>
                    </div>
                  </div>
                ))}
                {authorizedCourses.length > 8 && (
                  <p className="text-center text-xs text-neutral-600 pt-2">
                    +{authorizedCourses.length - 8} more courses
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#6A0000]">
              My Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {classes.slice(0, 5).map((c) => (
                <Link
                  key={c.scheduleId}
                  href={`/teacher/classes/${c.scheduleId}`}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-neutral-50"
                >
                  <span className="font-medium text-[#6A0000]">
                    {c.subjectCode} — {c.sectionName}
                  </span>
                  <span className="text-xs text-neutral-800">
                    {c.timeIn ?? "—"}–{c.timeOut ?? "—"}
                  </span>
                </Link>
              ))}
              {classes.length === 0 && (
                <p className="py-4 text-center text-sm text-neutral-700">
                  No classes assigned this term.
                </p>
              )}
              {classes.length > 0 && (
                <Link
                  href="/teacher/classes"
                  className="mt-3 inline-block text-xs font-medium text-[#6A0000] hover:underline"
                >
                  View all →
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#6A0000]">
              Recent submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentSubmissions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                >
                  <span className="font-medium text-[#6A0000]">
                    {s.subjectCode} — {s.sectionName} ({s.gradingPeriodName})
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      s.status === "draft"
                        ? "border-neutral-400 text-neutral-600"
                        : s.status === "submitted"
                        ? "border-amber-500 text-amber-700"
                        : s.status === "returned"
                        ? "border-red-500 text-red-700"
                        : s.status === "approved"
                        ? "border-blue-500 text-blue-700"
                        : "border-green-500 text-green-700"
                    }
                  >
                    {s.status}
                  </Badge>
                </div>
              ))}
              {recentSubmissions.length === 0 && (
                <p className="py-4 text-center text-sm text-neutral-700">
                  No grade submissions yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
