"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

export function CurriculumYearLevelTabs({
  selectedYearLevel,
  programId,
  schoolYearId,
}: {
  selectedYearLevel: string;
  programId: string | null;
  schoolYearId: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleYearChange = (yearLevel: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (programId) params.set("programId", programId);
    if (schoolYearId) params.set("schoolYearId", schoolYearId);
    params.set("yearLevel", yearLevel);
    router.push(`/registrar/curriculum?${params.toString()}`);
  };

  return (
    <Tabs value={selectedYearLevel} onValueChange={handleYearChange}>
      <TabsList className="inline-flex h-auto w-full flex-wrap justify-start gap-1 rounded-lg border border-neutral-200 bg-white/80 p-1">
        {YEAR_LEVELS.map((year) => (
          <TabsTrigger
            key={year}
            value={year}
            className="rounded-md px-4 py-2 text-sm font-medium text-neutral-800 transition-colors data-[state=active]:bg-[#6A0000]/10 data-[state=active]:text-[#6A0000] data-[state=active]:border data-[state=active]:border-[#6A0000]/30"
          >
            {year}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value={selectedYearLevel} className="mt-0">
        {/* Content is the builder below */}
      </TabsContent>
    </Tabs>
  );
}
