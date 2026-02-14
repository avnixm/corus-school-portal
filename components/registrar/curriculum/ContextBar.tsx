"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateDraftForm } from "./CreateDraftForm";

type Program = { id: string; code: string; name: string };
type SchoolYear = { id: string; name: string };

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export function ContextBar({
  programs,
  schoolYears,
}: {
  programs: Program[];
  schoolYears: SchoolYear[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const ALL_VALUE = "__all__";

  const setFilter = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams?.toString() ?? "");
    if (value && value !== ALL_VALUE) p.set(key, value);
    else p.delete(key);
    router.push(`/registrar/curriculum?${p.toString()}`);
  };

  const programIdRaw = searchParams?.get("programId") ?? "";
  const schoolYearIdRaw = searchParams?.get("schoolYearId") ?? "";
  const programId = programIdRaw || ALL_VALUE;
  const schoolYearId = schoolYearIdRaw || ALL_VALUE;
  const status = searchParams?.get("status") ?? "";
  const search = searchParams?.get("search") ?? "";

  return (
    <Card className="rounded-2xl border shadow-sm">
      <CardContent className="flex flex-wrap items-end gap-4 p-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-neutral-600">Program</label>
          <Select value={programId} onValueChange={(v) => setFilter("programId", v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All</SelectItem>
              {programs.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-neutral-600">School year</label>
          <Select value={schoolYearId} onValueChange={(v) => setFilter("schoolYearId", v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All</SelectItem>
              {schoolYears.map((sy) => (
                <SelectItem key={sy.id} value={sy.id}>
                  {sy.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-neutral-600">Status</label>
          <div className="flex rounded-md border border-neutral-200 bg-neutral-50/50 p-0.5">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFilter("status", opt.value)}
                className={`rounded px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  status === opt.value
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-neutral-600">Search versions</label>
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setFilter("search", e.target.value)}
            className="h-9 w-40"
          />
        </div>
        <CreateDraftForm programs={programs} schoolYears={schoolYears} />
      </CardContent>
    </Card>
  );
}
