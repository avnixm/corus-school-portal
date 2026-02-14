import { getCurrentStudent } from "@/lib/auth/getCurrentStudent";
import {
  getEnrollmentForStudentActiveTerm,
  getScheduleFromClassEnrollmentsByEnrollmentId,
  getEnrollmentSubjectsByEnrollmentId,
  getScheduleWithDetailsByEnrollmentId,
} from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const DAYS_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function StudentSchedulePage() {
  const current = await getCurrentStudent();
  if (!current) redirect("/student");

  const enrollment = await getEnrollmentForStudentActiveTerm(current.studentId);

  if (!enrollment) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">Schedule</h2>
        <p className="text-sm text-neutral-700">
          You don&apos;t have an enrollment for the current term. Your class schedule will appear here after enrollment is approved.
        </p>
      </div>
    );
  }

  const isApproved =
    enrollment.status === "approved" || enrollment.status === "enrolled";

  if (!isApproved) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">Schedule</h2>
        <p className="text-sm text-neutral-700">
          Your schedule will be available after your enrollment is approved. Current status:{" "}
          <span className="font-medium">{enrollment.status.replace(/_/g, " ")}</span>.
        </p>
      </div>
    );
  }

  // Prefer class enrollments (finalized schedule); else planned subjects; else legacy view
  const classScheduleRows = await getScheduleFromClassEnrollmentsByEnrollmentId(enrollment.id);
  const plannedSubjects = await getEnrollmentSubjectsByEnrollmentId(enrollment.id);
  const hasClassSchedule = classScheduleRows.length > 0;
  const hasPlannedOnly = !hasClassSchedule && plannedSubjects.length > 0;

  const rows = hasClassSchedule
    ? classScheduleRows
    : await getScheduleWithDetailsByEnrollmentId(enrollment.id);

  const byDay = DAYS_ORDER.reduce(
    (acc, day) => {
      acc[day] = rows.filter((r) => r.day === day);
      return acc;
    },
    {} as Record<string, typeof rows>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">Schedule</h2>
        <p className="text-sm text-neutral-700">
          {enrollment.schoolYearName} · {enrollment.termName}.
          {hasPlannedOnly
            ? " Planned subjects (schedule times will appear when your section schedule is set)."
            : " Your classes by day."}
        </p>
      </div>

      {hasPlannedOnly ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#6A0000]">Planned subjects</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {plannedSubjects.map((s) => (
                <li key={s.subjectId} className="rounded-lg border bg-neutral-50 px-3 py-2 text-sm">
                  <span className="font-medium text-[#6A0000]">{s.code}</span>
                  {s.title ? ` – ${s.title}` : ""}
                  {s.units != null ? ` (${s.units} units)` : ""}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {DAYS_ORDER.map((day) => (
            <Card key={day}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-[#6A0000]">{day}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(!byDay[day] || byDay[day].length === 0) ? (
                  <p className="text-xs text-neutral-600">No classes</p>
                ) : (
                  byDay[day].map((cls, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border bg-neutral-50 px-3 py-2 text-sm"
                    >
                      <div className="font-medium text-[#6A0000]">
                        {cls.subjectCode ?? "—"}
                        {cls.sectionName ? ` · ${cls.sectionName}` : ""}
                      </div>
                      <div className="mt-0.5 text-xs text-neutral-700">
                        {cls.timeIn} – {cls.timeOut} · {cls.room ?? "—"}
                      </div>
                      {cls.subjectDescription && (
                        <div className="mt-0.5 text-xs text-neutral-600">
                          {cls.subjectDescription}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
