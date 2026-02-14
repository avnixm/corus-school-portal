"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IssuesPopover } from "./IssuesPopover";

type Block = {
  id: string;
  curriculumVersionId: string;
  yearLevel: string;
  termId: string;
  sortOrder: number;
  termName: string | null;
  subjects: Array<{
    id: string;
    subjectId: string;
    code: string;
    title: string | null;
    units: string | null;
    prereqText: string | null;
    withLab: boolean;
    sortOrder: number;
  }>;
};

type Term = { id: string; name: string };

export function YearLevelTabs({
  versionId,
  blocks,
  terms,
  yearLevels,
  children,
}: {
  versionId: string;
  blocks: Block[];
  terms: Term[];
  yearLevels: string[];
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const selectedYear = searchParams?.get("yearLevel") ?? yearLevels[0];
  const selectedTermId = searchParams?.get("termId") ?? terms[0]?.id ?? "";

  const blockForSelection = blocks.find(
    (b) => b.yearLevel === selectedYear && b.termId === selectedTermId
  );
  const termUnits = blockForSelection
    ? blockForSelection.subjects.reduce(
        (sum, s) => sum + parseFloat(s.units ?? "0"),
        0
      )
    : 0;

  const yearBlocks = blocks.filter((b) => b.yearLevel === selectedYear);
  const yearUnits = yearBlocks.reduce(
    (sum, b) =>
      sum + b.subjects.reduce((s, sub) => s + parseFloat(sub.units ?? "0"), 0),
    0
  );

  const baseParams = new URLSearchParams(searchParams?.toString() ?? "");
  baseParams.set("versionId", versionId);

  return (
    <Tabs value={selectedYear} className="w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <TabsList className="flex h-auto flex-wrap gap-1 bg-neutral-100 p-1">
          {yearLevels.map((yl) => {
            const ylBlocks = blocks.filter((b) => b.yearLevel === yl);
            const ylUnits = ylBlocks.reduce(
              (sum, b) =>
                sum + b.subjects.reduce((s, sub) => s + parseFloat(sub.units ?? "0"), 0),
              0
            );
            return (
              <TabsTrigger key={yl} value={yl} asChild>
                <Link
                  href={`/registrar/curriculum?${new URLSearchParams({
                    ...Object.fromEntries(baseParams),
                    yearLevel: yl,
                    termId: selectedTermId || terms[0]?.id || "",
                  }).toString()}`}
                  className="text-neutral-900 data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:text-neutral-900"
                >
                  {yl}
                  {ylBlocks.some((b) => b.subjects.length > 0) && (
                    <span className="ml-1 text-xs text-neutral-600">
                      ({ylUnits} u)
                    </span>
                  )}
                </Link>
              </TabsTrigger>
            );
          })}
        </TabsList>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700">
            This term: {termUnits} u
          </span>
          <span className="rounded bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700">
            This year: {yearUnits} u
          </span>
          <IssuesPopover blocks={blocks} terms={terms} yearLevels={yearLevels} />
        </div>
      </div>
      <TabsContent value={selectedYear} className="mt-0">
        {children}
      </TabsContent>
    </Tabs>
  );
}
