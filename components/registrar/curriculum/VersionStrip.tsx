"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Check, Archive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useCurriculumBasePath } from "@/lib/registrar/curriculum/CurriculumRouteContext";

type Version = {
  id: string;
  name: string;
  programCode?: string;
  schoolYearName?: string;
  status: string;
};

export function VersionStrip({
  versions,
  selectedVersionId,
  searchQuery,
}: {
  versions: Version[];
  selectedVersionId: string | null;
  searchQuery?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const basePath = useCurriculumBasePath();

  const handleVersionSelect = (versionId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("versionId", versionId);
    router.push(`${basePath}?${params.toString()}`);
  };

  if (versions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-neutral-900">Available Versions</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {versions.map((version) => {
          const isSelected = version.id === selectedVersionId;
          const isDraft = version.status === "draft";
          const isPublished = version.status === "published";
          const isArchived = version.status === "archived";

          return (
            <Card
              key={version.id}
              onClick={() => handleVersionSelect(version.id)}
              className={`cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${
                isSelected
                  ? "border-[#6A0000] bg-[#6A0000]/5 ring-2 ring-[#6A0000]/20"
                  : "border-neutral-200 bg-white hover:border-neutral-300"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-neutral-900 line-clamp-1">{version.name}</h4>
                  {version.schoolYearName && (
                    <p className="mt-1 text-xs text-neutral-600">{version.schoolYearName}</p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={`flex-shrink-0 text-xs ${
                    isDraft
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : isPublished
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-neutral-500 bg-neutral-50 text-neutral-700"
                  }`}
                >
                  {isDraft && <FileText className="mr-1 h-3 w-3" />}
                  {isPublished && <Check className="mr-1 h-3 w-3" />}
                  {isArchived && <Archive className="mr-1 h-3 w-3" />}
                  {version.status.charAt(0).toUpperCase() + version.status.slice(1)}
                </Badge>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
