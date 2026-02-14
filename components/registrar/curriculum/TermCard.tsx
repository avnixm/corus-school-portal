"use client";

import { Plus, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubjectRow } from "./SubjectRow";

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

type TermCardProps = {
  termName: string;
  totalUnits: number;
  subjectCount: number;
  subjects: BlockSubject[];
  isDraft: boolean;
  targetUnitsPerTerm: number;
  onAddSubjects: () => void;
};

export function TermCard({
  termName,
  totalUnits,
  subjectCount,
  subjects,
  isDraft,
  targetUnitsPerTerm,
  onAddSubjects,
}: TermCardProps) {
  const isEmpty = subjectCount === 0;
  const isUnderloaded = totalUnits < targetUnitsPerTerm * 0.7;
  const sortedSubjects = [...subjects].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <Card className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <CardHeader className="border-b border-neutral-100 bg-neutral-50/50 p-4 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base font-semibold tracking-tight text-[#6A0000]">
              {termName}
            </CardTitle>
            <div className="mt-2 flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-[#6A0000]/25 bg-white text-xs font-medium text-[#6A0000]"
              >
                {totalUnits} units
              </Badge>
              <Badge
                variant="outline"
                className="border-neutral-200 bg-white text-xs font-normal text-neutral-600"
              >
                {subjectCount} subject{subjectCount !== 1 ? "s" : ""}
              </Badge>
            </div>
          </div>
          {isDraft && (
            <Button
              size="sm"
              className="h-9 shrink-0 bg-[#6A0000] hover:bg-[#4A0000] text-white"
              onClick={onAddSubjects}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add subjects
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 py-12 text-center">
            <BookOpen className="mb-3 h-10 w-10 text-neutral-400" />
            <p className="text-sm font-medium text-neutral-700">No subjects yet</p>
            {isDraft && (
              <Button
                size="sm"
                variant="outline"
                className="mt-4 border-[#6A0000]/40 text-[#6A0000] hover:bg-[#6A0000]/10"
                onClick={onAddSubjects}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add subjects
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-0.5">
            {sortedSubjects.map((subject) => (
              <SubjectRow key={subject.id} subject={subject} isDraft={isDraft} />
            ))}
          </div>
        )}

        {!isEmpty && isUnderloaded && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
            Under {targetUnitsPerTerm} units. Consider adding more.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
