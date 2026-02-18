import { auth } from "@/lib/auth/server";
import { getProgramHeadScopePrograms } from "@/lib/programHead/scope";
import {
  getSchedulesList,
  getSchoolYearsList,
  getTermsList,
  getSectionsList,
  getProgramsList,
  getProgramsByCodes,
  getTeachersListForRegistrar,
} from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateScheduleForm } from "@/app/(portal)/registrar/schedules/CreateScheduleForm";
import { ScheduleFilters } from "@/app/(portal)/registrar/schedules/ScheduleFilters";

export const dynamic = "force-dynamic";

export const metadata = { title: "Schedules" };

export default async function ProgramHeadSchedulesPage({
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
  const session = (await auth.getSession())?.data;
  const userId = session?.user?.id;
  const scope = userId ? await getProgramHeadScopePrograms(userId) : null;
  const programs = scope
    ? await getProgramsByCodes(scope)
    : await getProgramsList();

  const programIds = programs.map((p) => p.id);
  const primaryProgramId = programIds[0] ?? undefined;

  const [schedules, schoolYears, terms, sectionsRaw, teachers] = await Promise.all([
    getSchedulesList({
      ...params,
      programId: params.programId || primaryProgramId,
    }),
    getSchoolYearsList(),
    getTermsList(),
    getSectionsList(),
    getTeachersListForRegistrar(),
  ]);

  const sections = primaryProgramId
    ? sectionsRaw.filter((s) => programIds.includes(s.programId ?? ""))
    : sectionsRaw;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Schedules
        </h2>
        <p className="text-sm text-neutral-800">
          Manage class schedules for your program. Only teachers with approved capabilities can be assigned.
        </p>
      </div>

      <ScheduleFilters
        schoolYears={schoolYears}
        terms={terms}
        sections={sections}
        programs={programs.map((p) => ({ id: p.id, code: p.code, name: p.name }))}
      />

      <CreateScheduleForm
        schoolYears={schoolYears}
        terms={terms}
        sections={sections}
        programs={programs.map((p) => ({ id: p.id, code: p.code, name: p.name }))}
        teachers={teachers.map((t) => ({
          id: t.id,
          firstName: t.firstName,
          lastName: t.lastName,
          email: t.email,
        }))}
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
