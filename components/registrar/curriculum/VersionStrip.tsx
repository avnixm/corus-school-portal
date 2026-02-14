"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreateDraftForm } from "./CreateDraftForm";
import { CloneVersionForm } from "./CloneVersionForm";
import { cn } from "@/lib/utils";

type Version = {
  id: string;
  name: string;
  status: string;
  programCode: string | null;
  schoolYearName: string | null;
  updatedAt?: Date | null;
};

type Program = { id: string; code: string; name: string };
type SchoolYear = { id: string; name: string };

function formatUpdatedAt(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function VersionStrip({
  versions,
  programs,
  schoolYears,
  selectedVersionId,
  searchQuery,
}: {
  versions: Version[];
  programs: Program[];
  schoolYears: SchoolYear[];
  selectedVersionId: string | null;
  searchQuery?: string;
}) {
  const searchParams = useSearchParams();
  const baseParams = Object.fromEntries(searchParams?.entries() ?? []);

  const filtered = searchQuery?.trim()
    ? versions.filter(
        (v) =>
          v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (v.programCode?.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (v.schoolYearName?.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : versions;

  return (
    <Card className="rounded-2xl border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold text-neutral-900">
          Curriculum Versions
        </CardTitle>
        <div className="flex gap-2">
          <CreateDraftForm programs={programs} schoolYears={schoolYears} />
          <CloneVersionForm
            versions={versions.filter((v) => v.status === "draft" || v.status === "published")}
            programs={programs}
            schoolYears={schoolYears}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-0 gap-2">
            {filtered.length === 0 ? (
              <div className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50/50 py-12 text-center text-sm text-neutral-600">
                {versions.length === 0
                  ? "Create your first draft"
                  : "No versions match your search"}
              </div>
            ) : (
              filtered.map((v) => {
                const isSelected = selectedVersionId === v.id;
                const href = `/registrar/curriculum?${new URLSearchParams({
                  ...baseParams,
                  versionId: v.id,
                }).toString()}`;
                return (
                  <Link
                    key={v.id}
                    href={href}
                    className={cn(
                      "flex shrink-0 flex-col gap-1 rounded-xl border px-4 py-3 transition-colors hover:bg-neutral-50/80",
                      isSelected
                        ? "border-[#6A0000]/30 bg-[#6A0000]/10 ring-1 ring-[#6A0000]/30"
                        : "border-neutral-200 bg-white"
                    )}
                  >
                    <span
                      className={cn(
                        "font-medium",
                        isSelected ? "text-[#6A0000]" : "text-neutral-900"
                      )}
                    >
                      {v.name}
                    </span>
                    <span className="text-xs text-neutral-600">
                      {v.programCode ?? "—"} · {v.schoolYearName ?? "—"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          v.status === "published" && "bg-green-100 text-green-900",
                          v.status === "archived" && "bg-neutral-200 text-neutral-700",
                          v.status === "draft" && "bg-amber-100 text-amber-900"
                        )}
                      >
                        {v.status}
                      </Badge>
                      {v.updatedAt && (
                        <span className="text-[10px] text-neutral-500">
                          {formatUpdatedAt(v.updatedAt)}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
