import { auth } from "@/lib/auth/server";
import { getProgramHeadScopePrograms } from "@/lib/programHead/scope";
import { getProgramsList, getProgramsByCodes } from "@/db/queries";
import { getSchoolYearsList, getTermsList } from "@/db/queries";
import { TeacherCapabilitiesClient } from "./TeacherCapabilitiesClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Teacher Capabilities" };

export default async function ProgramHeadTeacherCapabilitiesPage() {
  const session = (await auth.getSession())?.data;
  const userId = session?.user?.id;
  const scope = userId ? await getProgramHeadScopePrograms(userId) : null;
  const programs = scope
    ? await getProgramsByCodes(scope)
    : await getProgramsList(true);
  const [schoolYears, terms] = await Promise.all([
    getSchoolYearsList(),
    getTermsList(),
  ]);

  return (
    <div className="space-y-6">
      <TeacherCapabilitiesClient
        programs={programs.map((p) => ({ id: p.id, code: p.code, name: p.name }))}
        schoolYears={schoolYears}
        terms={terms}
      />
    </div>
  );
}
