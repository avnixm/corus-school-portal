import Link from "next/link";
import { getProgramsList } from "@/db/queries";
import { getSubjectsList, getProgramsList as getProgramsForSubjects } from "@/db/queries";
import { getSectionsList, getProgramsList as getProgramsForSections } from "@/db/queries";
import { Card, CardContent } from "@/components/ui/card";
import { CreateProgramForm } from "../programs/CreateProgramForm";
import { ProgramRowActions } from "../programs/ProgramRowActions";
import { CreateSubjectForm } from "../subjects/CreateSubjectForm";
import { SubjectRowActions } from "../subjects/SubjectRowActions";
import { SubjectsFilters } from "../subjects/SubjectsFilters";
import { CreateSectionForm } from "../sections/CreateSectionForm";
import { SectionRowActions } from "../sections/SectionRowActions";
import { SectionFilters } from "../sections/SectionFilters";

export type AcademicsSearchParams = {
  tab?: string;
  search?: string;
  programId?: string;
  yearLevel?: string;
  subjectView?: string;
};

export async function ProgramsTab({
  params,
}: {
  params: AcademicsSearchParams;
}) {
  const all = await getProgramsList();
  const programs = params.search?.trim()
    ? all.filter(
        (p) =>
          p.code.toLowerCase().includes(params.search!.trim().toLowerCase()) ||
          p.name.toLowerCase().includes(params.search!.trim().toLowerCase())
      )
    : all;

  return (
    <div className="space-y-4">
      <CreateProgramForm />
      <Card>
        <CardContent className="pt-4">
          <div className="overflow-x-auto rounded-xl border bg-white/80 text-neutral-900">
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
                    <td className="px-4 py-2 font-mono font-medium">{row.code}</td>
                    <td className="px-4 py-2">{row.name}</td>
                    <td className="px-4 py-2 text-neutral-600">
                      {row.description ?? "—"}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs uppercase ${
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

export function CurriculumTab() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <p className="mb-4 text-sm text-neutral-800">
          Build and publish curriculum by program and school year.
        </p>
        <Link
          href="/registrar/curriculum"
          className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md bg-[--color-corus-maroon] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[--color-corus-maroon-dark] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[--color-corus-maroon]"
        >
          Open curriculum builder
        </Link>
      </CardContent>
    </Card>
  );
}

export async function SubjectsTab({
  params,
  basePath = "/registrar/academics",
  tabValue,
}: {
  params: AcademicsSearchParams;
  basePath?: string;
  tabValue?: string;
}) {
  const programId = params.programId ?? null;
  const subjectView = params.subjectView === "ge" ? "ge" : "program";
  const [subjects, programs] = await Promise.all([
    subjectView === "ge"
      ? getSubjectsList({ geOnly: true })
      : getSubjectsList(programId ? { programId } : undefined),
    getProgramsForSubjects(true),
  ]);

  return (
    <div className="space-y-4">
      <SubjectsFilters
        programs={programs}
        basePath={basePath}
        tabValue={tabValue}
      />
      <CreateSubjectForm programs={programs} />
      <Card>
        <CardContent className="pt-4">
          <div className="overflow-x-auto rounded-xl border bg-white/80 text-neutral-900">
            <table className="min-w-full text-left text-sm text-neutral-900">
              <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2">Code</th>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Program</th>
                  <th className="px-4 py-2">Units</th>
                  <th className="px-4 py-2">Active</th>
                  <th className="w-[1%] whitespace-nowrap px-4 py-2 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b last:border-0 hover:bg-neutral-50/80"
                  >
                    <td className="px-4 py-2 font-mono font-medium">{row.code}</td>
                    <td className="px-4 py-2">
                      {((row as { title?: string }).title || row.description) ?? "—"}
                    </td>
                    <td className="px-4 py-2">
                      {(row as { isGe?: boolean }).isGe ? (
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs uppercase text-amber-800">
                          GE
                        </span>
                      ) : (
                        (row as { programCode?: string | null }).programCode ?? "—"
                      )}
                    </td>
                    <td className="px-4 py-2">{row.units ?? "—"}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs uppercase ${
                          row.active
                            ? "bg-green-100 text-green-800"
                            : "bg-neutral-200 text-neutral-800"
                        }`}
                      >
                        {row.active ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="w-[1%] whitespace-nowrap px-4 py-2 text-right">
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

export async function SectionsTab({
  params,
  basePath = "/registrar/academics",
  tabValue,
}: {
  params: AcademicsSearchParams;
  basePath?: string;
  tabValue?: string;
}) {
  const [sections, programs] = await Promise.all([
    getSectionsList({ programId: params.programId, yearLevel: params.yearLevel }),
    getProgramsForSections(),
  ]);

  return (
    <div className="space-y-4">
      <SectionFilters
        programs={programs}
        basePath={basePath}
        tabValue={tabValue}
      />
      <CreateSectionForm programs={programs} />
      <Card>
        <CardContent className="pt-4">
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
                    <td className="px-4 py-2">
                      {row.yearLevel ?? row.gradeLevel ?? "—"}
                    </td>
                    <td className="px-4 py-2 font-medium">{row.name}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs uppercase ${
                          row.active !== false
                            ? "bg-green-100 text-green-800"
                            : "bg-neutral-200 text-neutral-800"
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
