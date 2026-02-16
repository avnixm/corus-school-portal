import { getSectionsWithAdvisers } from "@/db/queries";
import { getProgramsList, getSchoolYearsList } from "@/db/queries";
import { listTeachersFromUserProfile } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdviserFilters } from "./AdviserFilters";
import { AdviserAssignmentRow } from "./AdviserAssignmentRow";

export const dynamic = "force-dynamic";

export default async function AdvisersPage({
  searchParams,
}: {
  searchParams: Promise<{ programId?: string; yearLevel?: string; schoolYearId?: string }>;
}) {
  const params = await searchParams;
  const schoolYearId = params.schoolYearId ?? "";
  const [sections, programs, schoolYears, teachers] = await Promise.all([
    schoolYearId
      ? getSectionsWithAdvisers(schoolYearId, {
          programId: params.programId,
          yearLevel: params.yearLevel,
        })
      : Promise.resolve([]),
    getProgramsList(),
    getSchoolYearsList(),
    listTeachersFromUserProfile(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Adviser Assignments
        </h2>
        <p className="text-sm text-neutral-800">
          Assign advisers per program, year level, and block (section). Select a school year first.
        </p>
      </div>

      <AdviserFilters programs={programs} schoolYears={schoolYears} />

      {!schoolYearId ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-neutral-600">
            Select a school year above to view and assign advisers.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-neutral-900">
              Sections — Advisers ({sections.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border bg-white/80 text-neutral-900">
              <table className="min-w-full text-left text-sm text-neutral-900">
                <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                  <tr>
                    <th className="px-4 py-2">Program</th>
                    <th className="px-4 py-2">Year Level</th>
                    <th className="px-4 py-2">Section (Block)</th>
                    <th className="px-4 py-2">Adviser</th>
                  </tr>
                </thead>
                <tbody>
                  {sections.map((row) => (
                    <AdviserAssignmentRow
                      key={row.id}
                      row={{
                        id: row.id,
                        name: row.name,
                        yearLevel: row.yearLevel,
                        programCode: row.programCode,
                        adviser: row.adviser,
                      }}
                      schoolYearId={schoolYearId}
                      teachers={teachers}
                    />
                  ))}
                  {sections.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-neutral-600">
                        No sections match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
