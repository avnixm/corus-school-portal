import {
  getSchedulesList,
  getSchoolYearsList,
  getTermsList,
  getSectionsList,
  getProgramsList,
  getTeachersListForRegistrar,
} from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateScheduleForm } from "./CreateScheduleForm";
import { ScheduleFilters } from "./ScheduleFilters";

export const dynamic = "force-dynamic";

export const metadata = { title: "Schedules" };

export default async function SchedulesPage({
  searchParams,
}: {
  searchParams: Promise<{
    schoolYearId?: string;
    termId?: string;
    sectionId?: string;
    programId?: string;
    yearLevel?: string;
  }>;
}) {
  const params = await searchParams;
  const [schedules, schoolYears, terms, sections, programs, teachers] =
    await Promise.all([
      getSchedulesList(params),
      getSchoolYearsList(),
      getTermsList(),
      getSectionsList(),
      getProgramsList(),
      getTeachersListForRegistrar(),
    ]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Schedules
        </h2>
        <p className="text-sm text-neutral-800">
          Manage class schedules by program and section.
        </p>
      </div>

      <ScheduleFilters
        schoolYears={schoolYears}
        terms={terms}
        sections={sections}
        programs={programs}
      />

      <CreateScheduleForm
        schoolYears={schoolYears}
        terms={terms}
        sections={sections}
        programs={programs}
        teachers={teachers}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">
            Schedules ({schedules.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border bg-white/80 text-neutral-900">
            <table className="min-w-full text-left text-sm text-neutral-900">
              <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2">School Year</th>
                  <th className="px-4 py-2">Term</th>
                  <th className="px-4 py-2">Program</th>
                  <th className="px-4 py-2">Section</th>
                  <th className="px-4 py-2">Subject</th>
                  <th className="px-4 py-2">Teacher</th>
                  <th className="px-4 py-2">Time</th>
                  <th className="px-4 py-2">Room</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b last:border-0 hover:bg-neutral-50/80"
                  >
                    <td className="px-4 py-2">{row.schoolYearName}</td>
                    <td className="px-4 py-2">{row.termName}</td>
                    <td className="px-4 py-2 font-mono text-[#6A0000]">
                      {row.programCode ?? row.sectionProgram ?? "—"}
                    </td>
                    <td className="px-4 py-2">{row.sectionName}</td>
                    <td className="px-4 py-2">
                      {row.subjectCode} – {row.subjectDescription}
                    </td>
                    <td className="px-4 py-2">{row.teacherName ?? "—"}</td>
                    <td className="px-4 py-2">
                      {row.timeIn ?? "—"} – {row.timeOut ?? "—"}
                    </td>
                    <td className="px-4 py-2">{row.room ?? "—"}</td>
                  </tr>
                ))}
                {schedules.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-sm text-neutral-800"
                    >
                      No schedules found.
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
