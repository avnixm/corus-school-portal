"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type SchoolYear = { id: string; name: string };
type Term = { id: string; name: string };

export function ProgramHeadSyTermFilters({
  basePath,
  schoolYears,
  terms,
  currentSchoolYearId,
  currentTermId,
  clearHref,
  actions,
}: {
  basePath: string;
  schoolYears: SchoolYear[];
  terms: Term[];
  currentSchoolYearId?: string | null;
  currentTermId?: string | null;
  clearHref?: string;
  actions?: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clear = clearHref ?? basePath;

  function handleChange(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`${basePath}?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end justify-between gap-4 rounded-lg border bg-white p-4">
      <div className="flex flex-wrap gap-4 items-end">
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
      <div className="flex items-end">
        <Button variant="outline" size="sm" onClick={() => router.push(clear)}>
          Clear
        </Button>
      </div>
      </div>
      {actions && <div className="flex items-end">{actions}</div>}
    </div>
  );
}
