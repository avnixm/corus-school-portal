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
  listScheduleTimeConfigs,
} from "@/db/queries";
import { SchedulingPageContent } from "./SchedulingPageContent";

export const dynamic = "force-dynamic";

export const metadata = { title: "Scheduling" };

export default async function ProgramHeadSchedulingPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
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

  const [schedules, schoolYears, terms, sectionsRaw, teachers, configs, programsForTimeConfig] =
    await Promise.all([
      getSchedulesList({
        ...params,
        programId: params.programId || primaryProgramId,
      }),
      getSchoolYearsList(),
      getTermsList(),
      getSectionsList(),
      getTeachersListForRegistrar(),
      listScheduleTimeConfigs(),
      getProgramsList(true),
    ]);

  const sections = primaryProgramId
    ? sectionsRaw.filter((s) => programIds.includes(s.programId ?? ""))
    : sectionsRaw;

  const view =
    params.view === "time-config" ? "time-config" : "schedules";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Scheduling
        </h2>
        <p className="mt-1 text-sm text-neutral-800">
          Class schedules and time configuration for your program.
        </p>
      </div>
      <SchedulingPageContent
        view={view}
        schedules={schedules}
        configs={configs}
        schoolYears={schoolYears}
        terms={terms}
        sections={sections}
        programs={programs.map((p) => ({ id: p.id, code: p.code, name: p.name }))}
        timeConfigPrograms={programsForTimeConfig.map((p) => ({ id: p.id, code: p.code, name: p.name }))}
        teachers={teachers.map((t) => ({
          id: t.id,
          firstName: t.firstName,
          lastName: t.lastName,
          email: t.email,
        }))}
      />
    </div>
  );
}
