import { getProgramsList } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateProgramForm } from "./CreateProgramForm";
import { ProgramRowActions } from "./ProgramRowActions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Programs" };

export default async function ProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const all = await getProgramsList();
  const programs = search?.trim()
    ? all.filter(
        (p) =>
          p.code.toLowerCase().includes(search.trim().toLowerCase()) ||
          p.name.toLowerCase().includes(search.trim().toLowerCase())
      )
    : all;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Programs
        </h2>
        <p className="text-sm text-neutral-800">
          Manage degree programs for sections and enrollments.
        </p>
      </div>

      <CreateProgramForm />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">
            All programs ({programs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border bg-white/80 text-neutral-900">
            <table className="min-w-full text-left text-sm text-neutral-900">
              <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2">Code</th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Description</th>
                  <th className="px-4 py-2">Active</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {programs.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b last:border-0 hover:bg-neutral-50/80"
                  >
                    <td className="px-4 py-2 font-mono font-medium">
                      {row.code}
                    </td>
                    <td className="px-4 py-2">{row.name}</td>
                    <td className="px-4 py-2 text-neutral-600">
                      {row.description ?? "—"}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          row.active
                            ? "bg-green-100 text-green-800"
                            : "bg-neutral-200 text-neutral-800"
                        }`}
                      >
                        {row.active ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <ProgramRowActions program={row} />
                    </td>
                  </tr>
                ))}
                {programs.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-neutral-800"
                    >
                      No programs yet.
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
