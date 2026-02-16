import { getProgramsList, getProgramHeadAssignmentsList, getUsersListSearch } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgramsTable } from "./ProgramsTable";
import { ProgramHeadAssignmentsSection } from "./ProgramHeadAssignmentsSection";


export const dynamic = "force-dynamic";

export const metadata = { title: "Programs" };

export default async function AdminProgramsPage() {
  const [programsList, assignments, programHeads] = await Promise.all([
    getProgramsList(),
    getProgramHeadAssignmentsList(),
    getUsersListSearch({ role: "program_head" }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Program Assignments
        </h2>
        <p className="text-sm text-neutral-600">
          Manage programs and assign program heads.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Programs</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgramsTable programs={programsList} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Program Head Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgramHeadAssignmentsSection
            assignments={assignments}
            programHeads={programHeads}
            programs={programsList}
          />
        </CardContent>
      </Card>
    </div>
  );
}
