"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type SchoolYear = { id: string; name: string };
type Term = { id: string; name: string; schoolYearId: string };
type Section = {
  id: string;
  name: string;
  programId: string | null;
  yearLevel: string | null;
  programCode: string | null;
};
type Program = { id: string; code: string; name: string };

export function ScheduleFilters({
  schoolYears,
  terms,
  sections,
  programs,
}: {
  schoolYears: SchoolYear[];
  terms: Term[];
  sections: Section[];
  programs: Program[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const syId = searchParams.get("schoolYearId") ?? "";
  const termId = searchParams.get("termId") ?? "";
  const programId = searchParams.get("programId") ?? "";
  const yearLevel = searchParams.get("yearLevel") ?? "";
  const sectionId = searchParams.get("sectionId") ?? "";

  const filteredTerms = syId ? terms.filter((t) => t.schoolYearId === syId) : terms;
  const filteredSections = sections.filter((s) => {
    if (programId && s.programId !== programId) return false;
    if (yearLevel && s.yearLevel !== yearLevel) return false;
    return true;
  });

  function handleChange(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key === "schoolYearId") params.delete("termId");
    if (key === "programId") {
      params.delete("yearLevel");
      params.delete("sectionId");
    }
    if (key === "yearLevel") params.delete("sectionId");
    startTransition(() => {
      router.push(`/registrar/schedules?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-white p-4">
      <div>
        <Label htmlFor="sy" className="text-xs">
          School Year
        </Label>
        <select
          id="sy"
          value={syId}
          onChange={(e) => handleChange("schoolYearId", e.target.value)}
          className="ml-2 mt-1 h-9 rounded-md border border-neutral-200 bg-white px-2 text-sm text-neutral-900"
        >
          <option value="">All</option>
          {schoolYears.map((sy) => (
            <option key={sy.id} value={sy.id}>
              {sy.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="term" className="text-xs">
          Term
        </Label>
        <select
          id="term"
          value={termId}
          onChange={(e) => handleChange("termId", e.target.value)}
          disabled={!syId}
          className="ml-2 mt-1 h-9 rounded-md border border-neutral-200 bg-white px-2 text-sm text-neutral-900"
        >
          <option value="">All</option>
          {filteredTerms.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="program" className="text-xs">
          Program
        </Label>
        <select
          id="program"
          value={programId}
          onChange={(e) => handleChange("programId", e.target.value)}
          className="ml-2 mt-1 h-9 rounded-md border border-neutral-200 bg-white px-2 text-sm text-neutral-900"
        >
          <option value="">All</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} – {p.name}
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
          value={yearLevel}
          onChange={(e) => handleChange("yearLevel", e.target.value)}
          className="ml-2 mt-1 h-9 rounded-md border border-neutral-200 bg-white px-2 text-sm text-neutral-900"
        >
          <option value="">All</option>
          {["1", "2", "3", "4", "5"].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="section" className="text-xs">
          Section
        </Label>
        <select
          id="section"
          value={sectionId}
          onChange={(e) => handleChange("sectionId", e.target.value)}
          className="ml-2 mt-1 h-9 rounded-md border border-neutral-200 bg-white px-2 text-sm text-neutral-900"
        >
          <option value="">All</option>
          {filteredSections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.programCode ?? (s as { program?: string | null }).program ?? "—"} {s.yearLevel ?? ""} – {s.name}
            </option>
          ))}
        </select>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push("/registrar/schedules")}
        disabled={pending}
      >
        Clear
      </Button>
    </div>
  );
}
