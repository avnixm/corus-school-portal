"use client";

import { useRouter, useSearchParams } from "next/navigation";

type SchoolYear = { id: string; name: string };
type Term = { id: string; name: string };

export function ScheduleFilters({
  schoolYears,
  terms,
}: {
  schoolYears: SchoolYear[];
  terms: Term[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const schoolYearId = searchParams.get("schoolYearId") ?? "";
  const termId = searchParams.get("termId") ?? "";

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <label className="text-sm font-medium text-neutral-700">School Year</label>
        <select
          value={schoolYearId}
          onChange={(e) => updateFilter("schoolYearId", e.target.value)}
          className="mt-1 flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
        >
          <option value="">All</option>
          {schoolYears.map((sy) => (
            <option key={sy.id} value={sy.id}>{sy.name}</option>
          ))}
        </select>
      </div>
      <div className="flex-1">
        <label className="text-sm font-medium text-neutral-700">Term</label>
        <select
          value={termId}
          onChange={(e) => updateFilter("termId", e.target.value)}
          className="mt-1 flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
        >
          <option value="">All</option>
          {terms.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
