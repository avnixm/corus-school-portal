// path: app/(portal)/registrar/grades/RegistrarGradesFilters.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SchoolYear = { id: string; name: string };
type Term = { id: string; name: string };

export function RegistrarGradesFilters({
  schoolYears,
  terms,
  currentSchoolYearId,
  currentTermId,
}: {
  schoolYears: SchoolYear[];
  terms: Term[];
  currentSchoolYearId?: string;
  currentTermId?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/registrar/grades?${next.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-4">
      <div className="w-full min-w-0 sm:w-[180px]">
      <Select
        value={currentSchoolYearId ?? ""}
        onValueChange={(v) => {
          setFilter("schoolYearId", v);
          setFilter("termId", "");
        }}
      >
        <SelectTrigger className="w-full sm:w-[180px] min-w-0">
          <SelectValue placeholder="School year" />
        </SelectTrigger>
        <SelectContent>
          {schoolYears.map((sy) => (
            <SelectItem key={sy.id} value={sy.id}>
              {sy.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      </div>
      <div className="w-full min-w-0 sm:w-[140px]">
      <Select
        value={currentTermId ?? ""}
        onValueChange={(v) => setFilter("termId", v)}
      >
        <SelectTrigger className="w-full sm:w-[140px] min-w-0">
          <SelectValue placeholder="Term" />
        </SelectTrigger>
        <SelectContent>
          {terms.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      </div>
    </div>
  );
}
