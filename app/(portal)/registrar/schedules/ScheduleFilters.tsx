"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type SchoolYear = { id: string; name: string };
type Term = { id: string; name: string; schoolYearId: string };
type Section = { id: string; name: string };

export function ScheduleFilters({
  schoolYears,
  terms,
  sections,
}: {
  schoolYears: SchoolYear[];
  terms: Term[];
  sections: Section[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const syId = searchParams.get("schoolYearId") ?? "";
  const termId = searchParams.get("termId") ?? "";
  const sectionId = searchParams.get("sectionId") ?? "";
  const filteredTerms = syId ? terms.filter((t) => t.schoolYearId === syId) : terms;

  function handleChange(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key === "schoolYearId") {
      params.delete("termId");
    }
    startTransition(() => {
      router.push(`/registrar/schedules?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-white p-4">
      <div>
        <Label htmlFor="sy" className="text-xs">School Year</Label>
        <select
          id="sy"
          value={syId}
          onChange={(e) => handleChange("schoolYearId", e.target.value)}
          className="ml-2 mt-1 h-9 rounded-md border border-neutral-200 bg-white px-2 text-sm text-neutral-900"
        >
          <option value="">All</option>
          {schoolYears.map((sy) => (
            <option key={sy.id} value={sy.id}>{sy.name}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="term" className="text-xs">Term</Label>
        <select
          id="term"
          value={termId}
          onChange={(e) => handleChange("termId", e.target.value)}
          disabled={!syId}
          className="ml-2 mt-1 h-9 rounded-md border border-neutral-200 bg-white px-2 text-sm text-neutral-900"
        >
          <option value="">All</option>
          {filteredTerms.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="section" className="text-xs">Section</Label>
        <select
          id="section"
          value={sectionId}
          onChange={(e) => handleChange("sectionId", e.target.value)}
          className="ml-2 mt-1 h-9 rounded-md border border-neutral-200 bg-white px-2 text-sm text-neutral-900"
        >
          <option value="">All</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
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
