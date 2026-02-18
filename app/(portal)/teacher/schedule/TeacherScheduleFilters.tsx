"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Sy = { id: string; name: string };
type Term = { id: string; name: string };

export function TeacherScheduleFilters({
  schoolYears,
  terms,
  currentSchoolYearId,
  currentTermId,
}: {
  schoolYears: Sy[];
  terms: Term[];
  currentSchoolYearId: string;
  currentTermId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const onSchoolYearChange = (value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("sy", value);
    next.delete("term");
    router.push(`/teacher/schedule?${next.toString()}`);
  };

  const onTermChange = (value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("term", value);
    if (!next.has("sy") && currentSchoolYearId) next.set("sy", currentSchoolYearId);
    router.push(`/teacher/schedule?${next.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="w-full min-w-0 sm:w-[180px]">
      <Select
        value={currentSchoolYearId || undefined}
        onValueChange={onSchoolYearChange}
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
      <Select value={currentTermId || undefined} onValueChange={onTermChange}>
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
