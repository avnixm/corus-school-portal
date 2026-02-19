import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { getProgramHeadScopeAndSyTerm } from "@/lib/programHead/pageContext";
import { getClassManagementRows } from "@/lib/programHead/queries";
import { getProgramsList, getProgramsByCodes } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgramHeadScopeGate } from "@/components/portal/programHead/ProgramHeadScopeGate";
import { ProgramHeadSyTermFilters } from "@/components/portal/programHead/ProgramHeadSyTermFilters";
import { CreateClassForm } from "@/app/(portal)/program-head/classes/CreateClassForm";
import { SectionsPageContent } from "./SectionsPageContent";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sections" };

export default async function ProgramHeadSectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ schoolYearId?: string; termId?: string; view?: string }>;
}) {
  const user = await getCurrentUserWithRole();
  if (!user) return null;
  const params = await searchParams;
  const { scope, schoolYears, terms, syId, termId, needsScope } =
    await getProgramHeadScopeAndSyTerm(user.userId, {
      schoolYearId: params.schoolYearId,
      termId: params.termId,
    });

  if (needsScope) {
    return <ProgramHeadScopeGate title="Sections" />;
  }

  const effectiveTermId = params.termId ?? (terms.length > 0 ? terms[0].id : null);

  const [classRows, programs] = await Promise.all([
    getClassManagementRows(scope!, syId ?? null, effectiveTermId),
    scope === null ? getProgramsList(true) : getProgramsByCodes(scope),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Sections
        </h2>
        <p className="mt-1 text-sm text-neutral-800">
          Manage sections, capacity, schedules, and advisers.
        </p>
      </section>

      <ProgramHeadSyTermFilters
        basePath="/program-head/sections"
        schoolYears={schoolYears}
        terms={terms}
        currentSchoolYearId={syId}
        currentTermId={termId ?? effectiveTermId}
        actions={<CreateClassForm programs={programs} />}
      />

      <SectionsPageContent classRows={classRows} programs={programs} />
    </div>
  );
}
