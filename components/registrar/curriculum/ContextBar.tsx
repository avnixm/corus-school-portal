"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Filter, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

type Program = { id: string; code: string; name: string };
type SchoolYear = { id: string; name: string };
type Version = { id: string; name: string; status: string };

export function ContextBar({
  programs,
  schoolYears,
  versions,
  selectedVersionId,
}: {
  programs: Program[];
  schoolYears: SchoolYear[];
  versions: Version[];
  selectedVersionId: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const currentSchoolYearId = searchParams.get("schoolYearId") ?? "";
  const currentStatus = searchParams.get("status") ?? "";

  // Radix Select doesn't allow empty string as SelectItem value; use sentinel for "All"
  const ALL_SCHOOL_YEARS = "__all_sy__";
  const ALL_STATUSES = "__all_status__";

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("versionId"); // Reset version when filters change
    router.push(`/registrar/curriculum?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search.trim()) {
      params.set("search", search.trim());
    } else {
      params.delete("search");
    }
    router.push(`/registrar/curriculum?${params.toString()}`);
  };

  const handleClearFilters = () => {
    const params = new URLSearchParams();
    const programId = searchParams.get("programId");
    if (programId) {
      params.set("programId", programId);
    }
    router.push(`/registrar/curriculum?${params.toString()}`);
    setSearch("");
  };

  const hasFilters = currentSchoolYearId || currentStatus || search;

  return (
    <Card className="rounded-xl border border-neutral-200 shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
            <Filter className="h-4 w-4" />
            Filters
          </div>

          <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-0 w-full sm:min-w-[200px] sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Search versions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 pr-9"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  handleFilterChange("search", "");
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </form>

          <Select
            value={currentSchoolYearId || ALL_SCHOOL_YEARS}
            onValueChange={(v) => handleFilterChange("schoolYearId", v === ALL_SCHOOL_YEARS ? "" : v)}
          >
            <SelectTrigger className="h-9 w-full sm:w-[180px] min-w-0">
              <SelectValue placeholder="All School Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_SCHOOL_YEARS}>All School Years</SelectItem>
              {schoolYears.map((sy) => (
                <SelectItem key={sy.id} value={sy.id}>
                  {sy.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={currentStatus || ALL_STATUSES}
            onValueChange={(v) => handleFilterChange("status", v === ALL_STATUSES ? "" : v)}
          >
            <SelectTrigger className="h-9 w-full sm:w-[150px] min-w-0">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_STATUSES}>All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-9">
              <X className="mr-1.5 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
