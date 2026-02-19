"use client";

import Link from "next/link";
import { FileEdit, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurriculumBasePath } from "@/lib/registrar/curriculum/CurriculumRouteContext";

export function CurriculumViewChooser({
  programCode,
  schoolYearName,
  programId,
  schoolYearId,
  yearLevel,
}: {
  programCode: string;
  schoolYearName: string;
  programId: string;
  schoolYearId: string;
  yearLevel: string;
}) {
  const basePath = useCurriculumBasePath();
  const base = `${basePath}?programId=${programId}&schoolYearId=${schoolYearId}&yearLevel=${encodeURIComponent(yearLevel)}`;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-100 bg-neutral-50/80 px-4 py-3">
        <h2 className="text-sm font-semibold text-[#6A0000]">Choose what to open</h2>
        <p className="mt-0.5 text-xs text-neutral-600">
          {programCode} – {schoolYearName}: you have both a draft and a published curriculum.
        </p>
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <Link href={`${base}&view=draft`}>
          <div className="flex flex-col rounded-xl border-2 border-[#6A0000]/30 bg-[#6A0000]/5 p-5 transition-colors hover:border-[#6A0000] hover:bg-[#6A0000]/10">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-[#6A0000]/20">
              <FileEdit className="h-6 w-6 text-[#6A0000]" />
            </div>
            <h3 className="font-semibold text-[#6A0000]">Edit draft</h3>
            <p className="mt-1 text-sm text-neutral-600">
              Open the draft to add or change subjects. Changes only affect the draft until you publish.
            </p>
            <Button className="mt-4 w-full bg-[#6A0000] hover:bg-[#4A0000] text-white" size="sm">
              Open draft
            </Button>
          </div>
        </Link>
        <Link href={`${base}&view=published`}>
          <div className="flex flex-col rounded-xl border-2 border-neutral-200 bg-neutral-50/50 p-5 transition-colors hover:border-neutral-300 hover:bg-neutral-50">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-200">
              <Eye className="h-6 w-6 text-neutral-600" />
            </div>
            <h3 className="font-semibold text-neutral-900">View published</h3>
            <p className="mt-1 text-sm text-neutral-600">
              View the current published curriculum (read-only). Used for enrollment and fee calculation.
            </p>
            <Button className="mt-4 w-full" variant="outline" size="sm">
              View published
            </Button>
          </div>
        </Link>
      </div>
    </div>
  );
}
