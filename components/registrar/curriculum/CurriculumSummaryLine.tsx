"use client";

import { Badge } from "@/components/ui/badge";
import { Calculator } from "lucide-react";

export function CurriculumSummaryLine({
  yearLevel,
  termCount,
  subjectCount,
  totalUnits,
  isPublished,
}: {
  yearLevel: string;
  termCount: number;
  subjectCount: number;
  totalUnits: number;
  isPublished?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-700">
        <span className="font-semibold text-[#6A0000]">{yearLevel}</span>
        <span className="text-neutral-400">•</span>
        <span>{termCount} terms</span>
        <span className="text-neutral-400">•</span>
        <span>{subjectCount} subject{subjectCount !== 1 ? "s" : ""}</span>
        <span className="text-neutral-400">•</span>
        <Badge
          variant="outline"
          className="border-[#6A0000]/30 bg-[#6A0000]/5 font-medium text-[#6A0000]"
        >
          {totalUnits} total units
        </Badge>
      </div>
      {isPublished && totalUnits > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-neutral-600">
          <Calculator className="h-3.5 w-3.5 text-[#6A0000]" />
          Used for tuition in Fee Setup: units × per unit rate
        </p>
      )}
    </div>
  );
}
