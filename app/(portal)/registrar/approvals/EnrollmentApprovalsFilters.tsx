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
import type { programs } from "@/db/schema";

type ProgramRow = typeof programs.$inferSelect;

export function EnrollmentApprovalsFilters({
  programs,
  current,
}: {
  programs: ProgramRow[];
  current: {
    search?: string;
    program?: string;
    yearLevel?: string;
    reqsStatus?: string;
  };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value && value !== "__all__") next.set(key, value);
    else next.delete(key);
    router.push("/registrar/approvals?" + next.toString());
  }

  function handleSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const searchValue = (form.elements.namedItem("search") as HTMLInputElement)?.value ?? "";
    update("search", searchValue.trim());
  }

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-white p-4">
      <div className="w-40">
        <Label>Program</Label>
        <Select
          value={current.program ?? "__all__"}
          onValueChange={(v) => update("program", v)}
        >
          <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All programs</SelectItem>
            {programs.map((p) => (
              <SelectItem key={p.id} value={p.code}>{p.code}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-36">
        <Label>Year level</Label>
        <Select
          value={current.yearLevel ?? "__all__"}
          onValueChange={(v) => update("yearLevel", v)}
        >
          <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All years</SelectItem>
            <SelectItem value="1st Year">1st Year</SelectItem>
            <SelectItem value="2nd Year">2nd Year</SelectItem>
            <SelectItem value="3rd Year">3rd Year</SelectItem>
            <SelectItem value="4th Year">4th Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-40">
        <Label>Requirements</Label>
        <Select
          value={current.reqsStatus ?? "__all__"}
          onValueChange={(v) => update("reqsStatus", v)}
        >
          <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All</SelectItem>
            <SelectItem value="complete">Complete</SelectItem>
            <SelectItem value="incomplete">Incomplete</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 min-w-[180px]">
        <Label htmlFor="search">Student search</Label>
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <Input
            id="search"
            name="search"
            type="search"
            placeholder="Name or student no..."
            defaultValue={current.search}
            className="flex-1"
          />
          <Button type="submit" size="sm">Search</Button>
        </form>
      </div>
    </div>
  );
}
