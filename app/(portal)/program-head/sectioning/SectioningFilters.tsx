"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type SchoolYear = { id: string; name: string };
type Term = { id: string; name: string };
type Program = { id: string; code: string; name: string };

const YEAR_LEVELS = ["1", "2", "3", "4", "5", "1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];

export function SectioningFilters({
  schoolYears,
  terms,
  programs,
  currentSchoolYearId,
  currentTermId,
  programId,
  yearLevel,
}: {
  schoolYears: SchoolYear[];
  terms: Term[];
  programs: Program[];
  currentSchoolYearId?: string;
  currentTermId?: string;
  programId?: string;
  yearLevel?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/program-head/sectioning?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-4 rounded-lg border bg-white p-4">
      <div>
        <Label htmlFor="schoolYearId" className="text-xs">
          School Year
        </Label>
        <select
          id="schoolYearId"
          value={currentSchoolYearId ?? searchParams.get("schoolYearId") ?? ""}
          onChange={(e) => handleChange("schoolYearId", e.target.value)}
          className="ml-2 h-9 rounded-md border border-neutral-200 px-3 py-1 text-sm"
        >
          <option value="">Select</option>
          {schoolYears.map((sy) => (
            <option key={sy.id} value={sy.id}>
              {sy.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="termId" className="text-xs">
          Term
        </Label>
        <select
          id="termId"
          value={currentTermId ?? searchParams.get("termId") ?? ""}
          onChange={(e) => handleChange("termId", e.target.value)}
          className="ml-2 h-9 rounded-md border border-neutral-200 px-3 py-1 text-sm"
        >
          <option value="">Select</option>
          {terms.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="programId" className="text-xs">
          Program
        </Label>
        <select
          id="programId"
          value={programId ?? searchParams.get("programId") ?? ""}
          onChange={(e) => handleChange("programId", e.target.value)}
          className="ml-2 h-9 rounded-md border border-neutral-200 px-3 py-1 text-sm"
        >
          <option value="">All</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="yearLevel" className="text-xs">
          Year Level
        </Label>
        <select
          id="yearLevel"
          value={yearLevel ?? searchParams.get("yearLevel") ?? ""}
          onChange={(e) => handleChange("yearLevel", e.target.value)}
          className="ml-2 h-9 rounded-md border border-neutral-200 px-3 py-1 text-sm"
        >
          <option value="">All</option>
          {YEAR_LEVELS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/program-head/sectioning")}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
