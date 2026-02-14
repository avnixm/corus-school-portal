"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PublishButton } from "./PublishButton";
import { ArchiveButton } from "./ArchiveButton";
import { CloneVersionForm } from "./CloneVersionForm";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Version = {
  id: string;
  programId: string;
  schoolYearId: string;
  name: string;
  status: string;
};

type Program = { id: string; code: string; name: string };
type SchoolYear = { id: string; name: string };

type Block = {
  id: string;
  yearLevel: string;
  termId: string;
  termName: string | null;
  subjects: unknown[];
};

type Term = { id: string; name: string };

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

function getPublishIssues(
  blocks: Block[],
  terms: Term[],
  yearLevels: string[]
): string[] {
  const issues: string[] = [];
  for (const yl of yearLevels) {
    for (const term of terms) {
      const block = blocks.find((b) => b.yearLevel === yl && b.termId === term.id);
      if (!block) {
        issues.push(`Create term block for ${term.name} of ${yl}`);
      } else if (block.subjects.length === 0) {
        issues.push(`Add subjects to ${term.name} of ${yl}`);
      }
    }
  }
  const hasAnySubjects = blocks.some((b) => b.subjects.length > 0);
  if (!hasAnySubjects) {
    return ["Add at least one subject to at least one block before publishing"];
  }
  return issues;
}

export function CurriculumHeader({
  version,
  programs,
  schoolYears,
  versions,
  blocks,
  terms,
}: {
  version: Version | null;
  programs: Program[];
  schoolYears: SchoolYear[];
  versions: Array<{ id: string; name: string; programCode: string | null; schoolYearName: string | null; status: string }>;
  blocks: Block[];
  terms: Term[];
}) {
  const program = version ? programs.find((p) => p.id === version.programId) : null;
  const schoolYear = version ? schoolYears.find((sy) => sy.id === version.schoolYearId) : null;
  const issues = version && version.status === "draft"
    ? getPublishIssues(blocks, terms, YEAR_LEVELS)
    : [];
  const canPublish = version?.status === "draft" && issues.length === 0;

  return (
    <header className="space-y-3">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
            Curriculum
          </h1>
          <p className="mt-1 text-sm text-neutral-800">
            Define subject plans per program, year level, and term. Publish for Finance assessments.
          </p>
        </div>
        {version && (
          <div className="flex flex-wrap items-center gap-2">
            {version.status === "draft" && (
              issues.length > 0 ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-[#6A0000] hover:bg-[#6A0000]/90"
                      disabled
                    >
                      Publish
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80">
                    <p className="text-sm font-medium text-neutral-900">
                      Complete these before publishing:
                    </p>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-neutral-700">
                      {issues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  </PopoverContent>
                </Popover>
              ) : (
                <PublishButton versionId={version.id} />
              )
            )}
            <CloneVersionForm
              versions={versions.filter((v) => v.status === "draft" || v.status === "published")}
              programs={programs}
              schoolYears={schoolYears}
            />
            {(version.status === "draft" || version.status === "published") && (
              <ArchiveButton versionId={version.id} status={version.status} />
            )}
          </div>
        )}
      </div>
      {version && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded bg-[#6A0000]/15 px-2 py-1 font-medium text-[#6A0000]">
            {program?.code ?? version.programId}
          </span>
          <span className="rounded bg-neutral-200 px-2 py-1 font-medium text-neutral-900">
            {schoolYear?.name ?? version.schoolYearId}
          </span>
          <span
            className={`rounded px-2 py-1 font-medium ${
              version.status === "published"
                ? "bg-green-100 text-green-900"
                : version.status === "archived"
                  ? "bg-neutral-200 text-neutral-800"
                  : "bg-amber-100 text-amber-900"
            }`}
          >
            {version.status}
          </span>
        </div>
      )}
    </header>
  );
}
