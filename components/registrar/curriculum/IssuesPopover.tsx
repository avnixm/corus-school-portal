"use client";

import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Block = {
  id: string;
  yearLevel: string;
  termId: string;
  termName: string | null;
  subjects: unknown[];
};

type Term = { id: string; name: string };

function getIssues(
  blocks: Block[],
  terms: Term[],
  yearLevels: string[]
): string[] {
  const issues: string[] = [];
  for (const yl of yearLevels) {
    for (const term of terms) {
      const block = blocks.find((b) => b.yearLevel === yl && b.termId === term.id);
      if (!block) {
        issues.push(`Missing block for ${yl} ${term.name}`);
      } else if (block.subjects.length === 0) {
        issues.push(`Empty block for ${yl} ${term.name}`);
      }
    }
  }
  return issues;
}

export function IssuesPopover({
  blocks,
  terms,
  yearLevels,
}: {
  blocks: Block[];
  terms: Term[];
  yearLevels: string[];
}) {
  const issues = getIssues(blocks, terms, yearLevels);

  if (issues.length === 0) {
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        0 issues
      </Badge>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
        >
          {issues.length} issue{issues.length !== 1 ? "s" : ""}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <p className="text-sm font-medium text-neutral-900">Issues to resolve</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-neutral-700">
          {issues.map((issue, i) => (
            <li key={i}>{issue}</li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
