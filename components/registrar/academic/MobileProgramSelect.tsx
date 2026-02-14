"use client";

import { Label } from "@/components/ui/label";

type Program = { id: string; code: string; name: string };

export function MobileProgramSelect({
  programs,
  value,
  onChange,
  placeholder = "Select program",
}: {
  programs: Program[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="w-full">
      <Label htmlFor="mobile-program-select" className="text-sm text-neutral-700">
        Program
      </Label>
      <select
        id="mobile-program-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
      >
        <option value="">{placeholder}</option>
        {programs.map((p) => (
          <option key={p.id} value={p.id}>
            {p.code} – {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}
