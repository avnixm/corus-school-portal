import { getSubjectsList, getProgramsList } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateSubjectForm } from "./CreateSubjectForm";
import { SubjectRowActions } from "./SubjectRowActions";
import { SubjectsFilters } from "./SubjectsFilters";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ programId?: string; tab?: string }>;

export default async function SubjectsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const programId = params.programId ?? null;
  const tab = params.tab === "ge" ? "ge" : "program";

  const [subjects, programs] = await Promise.all([
    tab === "ge"
      ? getSubjectsList({ geOnly: true })
      : getSubjectsList(programId ? { programId } : undefined),
    getProgramsList(true),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Subjects
        </h2>
        <p className="text-sm text-neutral-800">
          Manage subject catalog. Program subjects are scoped to a program; GE subjects are shared.
        </p>
      </div>

      <SubjectsFilters programs={programs} />

      <CreateSubjectForm programs={programs} />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">
            {tab === "ge" ? "GE subjects" : programId ? `Program + GE subjects (${subjects.length})` : "All subjects"} ({subjects.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border bg-white/80 text-neutral-900">
            <table className="min-w-full text-left text-sm text-neutral-900">
              <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2">Code</th>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Program</th>
                  <th className="px-4 py-2">Units</th>
                  <th className="px-4 py-2">Active</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b last:border-0 hover:bg-neutral-50/80"
                  >
                    <td className="px-4 py-2 font-mono font-medium">
                      {row.code}
                    </td>
                    <td className="px-4 py-2">
                      {((row as { title?: string }).title || row.description) ?? "—"}
                    </td>
                    <td className="px-4 py-2">
                      {(row as { isGe?: boolean }).isGe ? (
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">GE</span>
                      ) : (
                        (row as { programCode?: string | null }).programCode ?? "—"
                      )}
                    </td>
                    <td className="px-4 py-2">{row.units ?? "—"}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          row.active ? "bg-green-100 text-green-800" : "bg-neutral-200 text-neutral-800"
                        }`}
                      >
                        {row.active ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <SubjectRowActions subject={row} programs={programs} />
                    </td>
                  </tr>
                ))}
                {subjects.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm text-neutral-800"
                    >
                      No subjects yet.
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
