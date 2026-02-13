import { getSectionsList } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateSectionForm } from "./CreateSectionForm";
import { SectionRowActions } from "./SectionRowActions";

export const dynamic = "force-dynamic";

export default async function SectionsPage() {
  const sections = await getSectionsList();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Sections
        </h2>
        <p className="text-sm text-neutral-700">
          Manage class sections.
        </p>
      </div>

      <CreateSectionForm />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">
            All sections ({sections.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border bg-white/80">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Year Level</th>
                  <th className="px-4 py-2">Program</th>
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
                    <td className="px-4 py-2 font-medium">{row.name}</td>
                    <td className="px-4 py-2">{row.yearLevel ?? row.gradeLevel ?? "—"}</td>
                    <td className="px-4 py-2">{row.program ?? "—"}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          row.active !== false ? "bg-green-100 text-green-800" : "bg-neutral-200 text-neutral-600"
                        }`}
                      >
                        {row.active !== false ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <SectionRowActions section={row} />
                    </td>
                  </tr>
                ))}
                {sections.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-neutral-700"
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
