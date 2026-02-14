"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type SchoolYear = { id: string; name: string };
type Term = { id: string; name: string };
type GradingPeriod = { id: string; name: string };
type Subject = { id: string; code: string };

const STATUSES = ["draft", "submitted", "returned", "approved", "released"];

export function SubmissionsFilters({
  schoolYears,
  terms,
  gradingPeriods,
  subjects,
  current,
}: {
  schoolYears: SchoolYear[];
  terms: Term[];
  gradingPeriods: GradingPeriod[];
  subjects: { id: string; code: string }[];
  current: {
    schoolYearId?: string | null;
    termId?: string | null;
    gradingPeriodId?: string;
    subjectId?: string;
    sectionId?: string;
    status?: string;
  };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/program-head/submissions?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-4 rounded-lg border bg-white p-4">
      <div>
        <Label htmlFor="schoolYearId" className="text-xs">
          School Year
        </Label>
        <select
          id="schoolYearId"
          value={current.schoolYearId ?? searchParams.get("schoolYearId") ?? ""}
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
          value={current.termId ?? searchParams.get("termId") ?? ""}
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
        <Label htmlFor="gradingPeriodId" className="text-xs">
          Grading Period
        </Label>
        <select
          id="gradingPeriodId"
          value={current.gradingPeriodId ?? searchParams.get("gradingPeriodId") ?? ""}
          onChange={(e) => handleChange("gradingPeriodId", e.target.value)}
          className="ml-2 h-9 rounded-md border border-neutral-200 px-3 py-1 text-sm"
        >
          <option value="">All</option>
          {gradingPeriods.map((gp) => (
            <option key={gp.id} value={gp.id}>
              {gp.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="subjectId" className="text-xs">
          Subject
        </Label>
        <select
          id="subjectId"
          value={current.subjectId ?? searchParams.get("subjectId") ?? ""}
          onChange={(e) => handleChange("subjectId", e.target.value)}
          className="ml-2 h-9 rounded-md border border-neutral-200 px-3 py-1 text-sm"
        >
          <option value="">All</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="status" className="text-xs">
          Status
        </Label>
        <select
          id="status"
          value={current.status ?? searchParams.get("status") ?? ""}
          onChange={(e) => handleChange("status", e.target.value)}
          className="ml-2 h-9 rounded-md border border-neutral-200 px-3 py-1 text-sm"
        >
          <option value="">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/program-head/submissions")}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
