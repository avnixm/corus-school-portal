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

type Program = { id: string; code: string; name: string };
type SchoolYear = { id: string; name: string };

export function CurriculumProgramTabs({
  programs,
  selectedProgramId,
  schoolYears,
  selectedSchoolYearId,
  children,
}: {
  programs: Program[];
  selectedProgramId: string | null;
  schoolYears: SchoolYear[];
  selectedSchoolYearId: string | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const yearLevel = searchParams.get("yearLevel") ?? "1st Year";

  const handleProgramChange = (programId: string) => {
    const params = new URLSearchParams();
    params.set("programId", programId);
    if (selectedSchoolYearId) params.set("schoolYearId", selectedSchoolYearId);
    params.set("yearLevel", yearLevel);
    router.push(`/registrar/curriculum?${params.toString()}`);
  };

  const handleSchoolYearChange = (schoolYearId: string) => {
    const params = new URLSearchParams();
    if (selectedProgramId) params.set("programId", selectedProgramId);
    params.set("schoolYearId", schoolYearId);
    params.set("yearLevel", yearLevel);
    router.push(`/registrar/curriculum?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-neutral-200 bg-white/80 px-4 py-3">
        <div className="flex items-center gap-2 border-r border-neutral-200 pr-4">
          <span className="text-sm font-medium text-neutral-700">School year</span>
          <Select
            value={selectedSchoolYearId ?? schoolYears[0]?.id ?? ""}
            onValueChange={handleSchoolYearChange}
          >
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="Select year" />
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
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-700">Program</span>
          <Tabs value={selectedProgramId ?? undefined} onValueChange={handleProgramChange}>
            <TabsList className="inline-flex h-auto flex-wrap justify-start gap-1 rounded-md border-0 bg-transparent p-0">
              {programs.map((program) => (
                <TabsTrigger
                  key={program.id}
                  value={program.id}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-neutral-800 transition-colors data-[state=active]:bg-[#6A0000]/10 data-[state=active]:text-[#6A0000] data-[state=active]:border data-[state=active]:border-[#6A0000]/30"
                >
                  {program.code}
                </TabsTrigger>
              ))}
            </TabsList>

            {programs.map((program) => (
              <TabsContent key={program.id} value={program.id} className="mt-0">
                {children}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
