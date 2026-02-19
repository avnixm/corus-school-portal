import {
  listTeachersWithDepartmentAndCapabilityCount,
  getProgramsList,
} from "@/db/queries";
import {
  getSectionsWithAdvisers,
  getProgramsList as getProgramsForAdvisers,
  getSchoolYearsList,
  listTeachersFromUserProfile,
} from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeacherTable } from "@/components/registrar/teachers/TeacherTable";
import { AdviserFilters } from "../advisers/AdviserFilters";
import { AdviserAssignmentRow } from "../advisers/AdviserAssignmentRow";

export type StaffSearchParams = {
  tab?: string;
  programId?: string;
  yearLevel?: string;
  schoolYearId?: string;
};

export async function TeachersTab() {
  const [teachers, programs] = await Promise.all([
    listTeachersWithDepartmentAndCapabilityCount(),
    getProgramsList(true),
  ]);

  return (
    <div className="space-y-4">
      <Card>
        <div className="overflow-x-auto rounded-xl border bg-white/80 text-neutral-900">
          <TeacherTable teachers={teachers} programs={programs} />
        </div>
      </Card>
    </div>
  );
}

export async function AdvisersTab({
  params,
  basePath = "/registrar/staff",
  tabValue,
}: {
  params: StaffSearchParams;
  basePath?: string;
  tabValue?: string;
}) {
  const schoolYearId = params.schoolYearId ?? "";
  const [sections, programs, schoolYears, teachers] = await Promise.all([
    schoolYearId
      ? getSectionsWithAdvisers(schoolYearId, {
          programId: params.programId,
          yearLevel: params.yearLevel,
        })
      : Promise.resolve([]),
    getProgramsForAdvisers(),
    getSchoolYearsList(),
    listTeachersFromUserProfile(),
  ]);

  return (
    <div className="space-y-4">
      <AdviserFilters
        programs={programs}
        schoolYears={schoolYears}
        basePath={basePath}
        tabValue={tabValue}
      />
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
            <div className="overflow-x-auto rounded-xl border bg-white/80 text-neutral-900">
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
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-neutral-600"
                      >
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
