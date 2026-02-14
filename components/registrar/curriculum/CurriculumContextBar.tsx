"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

type Program = { id: string; code: string; name: string };
type SchoolYear = { id: string; name: string };

export function CurriculumContextBar({
  programs,
  selectedProgramId,
  schoolYears,
  selectedSchoolYearId,
  selectedYearLevel,
  children,
}: {
  programs: Program[];
  selectedProgramId: string | null;
  schoolYears: SchoolYear[];
  selectedSchoolYearId: string | null;
  selectedYearLevel: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleProgramChange = (programId: string) => {
    const params = new URLSearchParams();
    params.set("programId", programId);
    if (selectedSchoolYearId) params.set("schoolYearId", selectedSchoolYearId);
    params.set("yearLevel", selectedYearLevel);
    router.push(`/registrar/curriculum?${params.toString()}`);
  };

  const handleSchoolYearChange = (schoolYearId: string) => {
    const params = new URLSearchParams();
    if (selectedProgramId) params.set("programId", selectedProgramId);
    params.set("schoolYearId", schoolYearId);
    params.set("yearLevel", selectedYearLevel);
    router.push(`/registrar/curriculum?${params.toString()}`);
  };

  const handleYearChange = (yearLevel: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedProgramId) params.set("programId", selectedProgramId);
    if (selectedSchoolYearId) params.set("schoolYearId", selectedSchoolYearId);
    params.set("yearLevel", yearLevel);
    router.push(`/registrar/curriculum?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex h-11 flex-wrap items-center gap-4 rounded-xl border border-neutral-200 bg-neutral-50/80 px-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            Program
          </span>
          <Select
            value={selectedProgramId ?? ""}
            onValueChange={handleProgramChange}
          >
            <SelectTrigger className="h-9 w-[140px] border-0 bg-transparent shadow-none focus:ring-0">
              <SelectValue placeholder="Program" />
            </SelectTrigger>
            <SelectContent>
              {programs.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="h-4 w-px bg-neutral-200" />
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            School year
          </span>
          <Select
            value={selectedSchoolYearId ?? schoolYears[0]?.id ?? ""}
            onValueChange={handleSchoolYearChange}
          >
            <SelectTrigger className="h-9 w-[130px] border-0 bg-transparent shadow-none focus:ring-0">
              <SelectValue placeholder="Year" />
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
      </div>

      <Tabs value={selectedYearLevel} onValueChange={handleYearChange}>
        <TabsList className="h-11 w-full justify-start gap-1 rounded-xl border border-neutral-200 bg-neutral-50/80 p-1.5">
          {YEAR_LEVELS.map((year) => (
            <TabsTrigger
              key={year}
              value={year}
              className="flex-1 rounded-lg px-4 font-medium data-[state=active]:bg-[#6A0000] data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=inactive]:text-neutral-600"
            >
              {year}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={selectedYearLevel} className="mt-6">
          {children}
        </TabsContent>
      </Tabs>
    </div>
  );
}
