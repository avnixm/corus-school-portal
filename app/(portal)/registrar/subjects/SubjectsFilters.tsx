"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";

type Program = { id: string; code: string; name: string };

export function SubjectsFilters({ programs }: { programs: Program[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const programId = searchParams.get("programId") ?? "";
  const tab = searchParams.get("tab") ?? "program";

  function setProgramId(value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set("programId", value);
    else next.delete("programId");
    router.push(`/registrar/subjects?${next.toString()}`);
  }

  function setTab(value: "program" | "ge") {
    const next = new URLSearchParams(searchParams);
    next.set("tab", value);
    if (value === "ge") next.delete("programId");
    router.push(`/registrar/subjects?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-white p-4">
      <div>
        <Label htmlFor="programId" className="text-xs text-neutral-600">
          Program
        </Label>
        <select
          id="programId"
          value={programId}
          onChange={(e) => setProgramId(e.target.value)}
          className="mt-1 flex h-9 w-full min-w-[180px] rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm text-neutral-900"
        >
          <option value="">All programs</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} – {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <Label className="text-xs text-neutral-600">View</Label>
        <div className="flex rounded-md border border-neutral-200 bg-neutral-50 p-0.5">
          <button
            type="button"
            onClick={() => setTab("program")}
            className={`rounded px-3 py-1.5 text-sm ${
              tab === "program"
                ? "bg-white font-medium text-[#6A0000] shadow"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Program subjects
          </button>
          <button
            type="button"
            onClick={() => setTab("ge")}
            className={`rounded px-3 py-1.5 text-sm ${
              tab === "ge"
                ? "bg-white font-medium text-[#6A0000] shadow"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            GE subjects
          </button>
        </div>
      </div>
    </div>
  );
}
