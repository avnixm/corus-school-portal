"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Program = { id: string; code: string; name: string };

export function EnrollmentFilters({
  programs,
  basePath = "/registrar/enrollments",
  tabValue,
}: {
  programs: Program[];
  basePath?: string;
  tabValue?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const programId = searchParams.get("programId") ?? "";

  function handleChange(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (tabValue) params.set("tab", tabValue);
    startTransition(() => {
      router.push(`${basePath}?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-white p-4">
      <div>
        <Label htmlFor="program" className="text-xs">
          Program
        </Label>
        <select
          id="program"
          value={programId}
          onChange={(e) => handleChange("programId", e.target.value)}
          className="ml-2 mt-1 h-9 rounded-md border border-neutral-200 bg-white px-2 text-sm text-neutral-900"
        >
          <option value="">All</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} – {p.name}
            </option>
          ))}
        </select>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          const params = new URLSearchParams();
          if (tabValue) params.set("tab", tabValue);
          router.push(`${basePath}${params.toString() ? `?${params.toString()}` : ""}`);
        }}
        disabled={pending}
      >
        Clear
      </Button>
    </div>
  );
}
