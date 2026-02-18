import { getSectionsList, getProgramsList } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateSectionForm } from "./CreateSectionForm";
import { SectionRowActions } from "./SectionRowActions";
import { SectionFilters } from "./SectionFilters";


export const dynamic = "force-dynamic";

export const metadata = { title: "Sections" };

export default async function SectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ programId?: string; yearLevel?: string }>;
}) {
  const params = await searchParams;
  const [sections, programs] = await Promise.all([
    getSectionsList(params),
    getProgramsList(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Sections
        </h2>
        <p className="text-sm text-neutral-800">
          Manage class sections by program.
        </p>
      </div>

      <SectionFilters programs={programs} />

      <CreateSectionForm programs={programs} />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">
            All sections ({sections.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border bg-white/80 text-neutral-900">
            <table className="min-w-full text-left text-sm text-neutral-900">
              <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2">Program</th>
                  <th className="px-4 py-2">Year Level</th>
                  <th className="px-4 py-2">Section Name</th>
                  <th className="px-4 py-2">Active</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b last:border-0 hover:bg-neutral-50/80"
                  >
                    <td className="px-4 py-2 font-mono text-[#6A0000]">
                      {row.programCode ?? row.program ?? "—"}
                    </td>
                    <td className="px-4 py-2">{row.yearLevel ?? row.gradeLevel ?? "—"}</td>
                    <td className="px-4 py-2 font-medium">{row.name}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs uppercase ${
                          row.active !== false ? "bg-green-100 text-green-800" : "bg-neutral-200 text-neutral-800"
                        }`}
                      >
                        {row.active !== false ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <SectionRowActions section={row} programs={programs} />
                    </td>
                  </tr>
                ))}
                {sections.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-neutral-800"
                    >
                      No sections yet.
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
