"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { schoolYears } from "@/db/schema";
import type { terms } from "@/db/schema";
import type { programs } from "@/db/schema";

type SchoolYearRow = typeof schoolYears.$inferSelect;
type TermRow = typeof terms.$inferSelect;
type ProgramRow = typeof programs.$inferSelect;

export function QueueFilters({
  schoolYears,
  terms,
  programs,
  current,
}: {
  schoolYears: SchoolYearRow[];
  terms: TermRow[];
  programs: ProgramRow[];
  current: { schoolYearId?: string; termId?: string; program?: string; search?: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    router.push("/registrar/requirements/queue?" + next.toString());
  }

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-white p-4">
      <div className="w-40">
        <Label>School year</Label>
        <Select
          value={current.schoolYearId ?? "__all__"}
          onValueChange={(v) => update("schoolYearId", v === "__all__" ? "" : v)}
        >
          <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All</SelectItem>
            {schoolYears.map((sy) => (
              <SelectItem key={sy.id} value={sy.id}>{sy.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-36">
        <Label>Term</Label>
        <Select
          value={current.termId ?? "__all__"}
          onValueChange={(v) => update("termId", v === "__all__" ? "" : v)}
        >
          <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All</SelectItem>
            {terms.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-36">
        <Label>Program</Label>
        <Select
          value={current.program ?? "__all__"}
          onValueChange={(v) => update("program", v === "__all__" ? "" : v)}
        >
          <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All</SelectItem>
            {programs.map((p) => (
              <SelectItem key={p.id} value={p.code}>{p.code}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1 min-w-[180px]">
        <Label>Student search</Label>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const v = new FormData(e.currentTarget).get("search") as string;
            update("search", v?.trim() ?? "");
          }}
          className="flex gap-2"
        >
          <Input
            name="search"
            defaultValue={current.search}
            placeholder="Name or student no."
            className="flex-1"
          />
          <Button type="submit" variant="outline">Search</Button>
        </form>
      </div>
    </div>
  );
}
