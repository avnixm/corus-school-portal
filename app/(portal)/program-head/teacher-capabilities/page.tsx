import { auth } from "@/lib/auth/server";
import { getProgramHeadScopePrograms } from "@/lib/programHead/scope";
import { getProgramsList, getProgramsByCodes } from "@/db/queries";
import { getSchoolYearsList, getTermsList } from "@/db/queries";
import { TeacherCapabilitiesClient } from "./TeacherCapabilitiesClient";

export const dynamic = "force-dynamic";

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
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Teacher Capabilities
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Propose teaching capabilities for your department. Submit packages for Dean approval.
        </p>
      </div>
      <TeacherCapabilitiesClient
        programs={programs.map((p) => ({ id: p.id, code: p.code, name: p.name }))}
        schoolYears={schoolYears}
        terms={terms}
      />
    </div>
  );
}
