import { getSubjectsList } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateSubjectForm } from "./CreateSubjectForm";
import { SubjectRowActions } from "./SubjectRowActions";


export const dynamic = "force-dynamic";

export default async function SubjectsPage() {
  const subjects = await getSubjectsList();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Subjects
        </h2>
        <p className="text-sm text-neutral-700">
          Manage subject catalog.
        </p>
      </div>

      <CreateSubjectForm />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">
            All subjects ({subjects.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border bg-white/80">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2">Code</th>
                  <th className="px-4 py-2">Description</th>
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
                    <td className="px-4 py-2">{row.description}</td>
                    <td className="px-4 py-2">{row.units ?? "—"}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          row.active ? "bg-green-100 text-green-800" : "bg-neutral-200 text-neutral-600"
                        }`}
                      >
                        {row.active ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <SubjectRowActions subject={row} />
                    </td>
                  </tr>
                ))}
                {subjects.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-neutral-700"
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
