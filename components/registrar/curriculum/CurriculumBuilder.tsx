"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import { TermCard } from "./TermCard";
import { CurriculumSummaryLine } from "./CurriculumSummaryLine";
import { AddSubjectsDialog } from "./AddSubjectsDialog";

type Term = {
  id: string;
  name: string;
  schoolYearId: string;
};

type BlockSubject = {
  id: string;
  subjectId: string;
  code: string;
  title: string;
  units: string | null;
  withLab: boolean;
  prereqText: string | null;
  sortOrder: number;
  isGe?: boolean;
};

type Block = {
  id: string;
  yearLevel: string;
  termId: string;
  termName: string;
  sortOrder: number;
  subjects: BlockSubject[];
};

export function CurriculumBuilder({
  versionId,
  versionStatus,
  blocks,
  terms,
  yearLevel,
  targetUnitsPerTerm = 24,
  hideSummaryHeader = false,
}: {
  versionId: string;
  versionStatus: string;
  blocks: Block[];
  terms: Term[];
  yearLevel: string;
  targetUnitsPerTerm?: number;
  /** When true, summary is shown in the container header instead */
  hideSummaryHeader?: boolean;
}) {
  const [addingToTerm, setAddingToTerm] = useState<string | null>(null);

  const isDraft = versionStatus === "draft";

  const getBlockForTerm = (termId: string) => blocks.find((b) => b.termId === termId);

  let totalUnitsThisYear = 0;
  let totalSubjectsThisYear = 0;
  for (const b of blocks) {
    for (const s of b.subjects) {
      totalUnitsThisYear += parseFloat(s.units ?? "0");
      totalSubjectsThisYear += 1;
    }
  }

  return (
    <div className="space-y-6">
      {!hideSummaryHeader && (
        <CurriculumSummaryLine
          yearLevel={yearLevel}
          termCount={terms.length}
          subjectCount={totalSubjectsThisYear}
          totalUnits={totalUnitsThisYear}
          isPublished={versionStatus === "published"}
        />
      )}
      {hideSummaryHeader && versionStatus === "published" && totalUnitsThisYear > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-neutral-600">
          <Calculator className="h-3.5 w-3.5 text-[#6A0000]" />
          Used for tuition in Fee Setup: units × per unit rate
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {terms.map((term) => {
          const block = getBlockForTerm(term.id);
          const subjects = block?.subjects ?? [];
          const totalUnits = subjects.reduce((sum, s) => sum + parseFloat(s.units ?? "0"), 0);

          return (
            <TermCard
              key={term.id}
              termName={term.name}
              totalUnits={totalUnits}
              subjectCount={subjects.length}
              subjects={subjects}
              isDraft={isDraft}
              targetUnitsPerTerm={targetUnitsPerTerm}
              onAddSubjects={() => setAddingToTerm(term.id)}
            />
          );
        })}
      </div>

      {addingToTerm && (
        <AddSubjectsDialog
          versionId={versionId}
          yearLevel={yearLevel}
          termId={addingToTerm}
          onClose={() => setAddingToTerm(null)}
        />
      )}
    </div>
  );
}
