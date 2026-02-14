"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updateProgramScopeAction } from "./actions";

const PROGRAM_SCOPE_ALL = "ALL";

export function ProgramScopeForm({
  profileId,
  currentProgram,
  programs,
}: {
  profileId: string;
  currentProgram: string | null;
  programs: string[];
}) {
  const router = useRouter();
  const [value, setValue] = useState(currentProgram ?? "");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profileId) return;
    setPending(true);
    try {
      const formData = new FormData();
      formData.set("profileId", profileId);
      formData.set("program", value);
      await updateProgramScopeAction(formData);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="program" className="text-xs">
          Program
        </Label>
        <select
          id="program"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="ml-2 mt-1 h-9 rounded-md border border-neutral-200 px-3 py-1 text-sm"
        >
          <option value="">— Not set (set to see data) —</option>
          <option value={PROGRAM_SCOPE_ALL}>All programs</option>
          {programs.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
