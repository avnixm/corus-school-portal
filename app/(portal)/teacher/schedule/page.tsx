import { getTeacherScheduleData } from "../actions";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeacherScheduleFilters } from "./TeacherScheduleFilters";

export const dynamic = "force-dynamic";

const DAYS_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const metadata = { title: "Schedule" };

export default async function TeacherSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ sy?: string; term?: string }>;
}) {
  const params = await searchParams;
  const data = await getTeacherScheduleData({
    schoolYearId: params.sy ?? undefined,
    termId: params.term ?? undefined,
  });

  if (!data) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">Schedule</h2>
        <p className="text-sm text-neutral-700">Unauthorized.</p>
      </div>
    );
  }

  const { schoolYear, term, byDay, schoolYears, terms } = data;

  if (!schoolYear || !term) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">Schedule</h2>
        <p className="text-sm text-neutral-700">No active school year or term selected.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
            Schedule
          </h2>
          <p className="mt-1 text-sm text-neutral-800">
            {schoolYear.name} · {term.name}
          </p>
        </div>
        <TeacherScheduleFilters
          schoolYears={schoolYears}
          terms={terms}
          currentSchoolYearId={params.sy ?? schoolYear.id ?? ""}
          currentTermId={params.term ?? term.id ?? ""}
        />
      </section>

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
                byDay[day].map((cls) => (
                  <Link
                    key={cls.scheduleId}
                    href={`/teacher/classes/${cls.scheduleId}`}
                    className="block rounded-lg border bg-neutral-50 px-3 py-2 text-sm transition-colors hover:bg-neutral-100"
                  >
                    <div className="font-medium text-[#6A0000]">
                      {cls.subjectCode ?? "—"}
                      {cls.sectionName ? ` · ${cls.sectionName}` : ""}
                    </div>
                    <div className="mt-0.5 text-xs text-neutral-700">
                      {cls.timeIn ?? "—"} – {cls.timeOut ?? "—"} · {cls.room ?? "—"}
                    </div>
                    {cls.subjectDescription && (
                      <div className="mt-0.5 text-xs text-neutral-600">
                        {cls.subjectDescription}
                      </div>
                    )}
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
