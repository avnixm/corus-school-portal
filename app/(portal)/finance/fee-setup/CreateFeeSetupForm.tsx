// path: app/(portal)/finance/fee-setup/CreateFeeSetupForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFeeSetupDraft } from "./fee-setups/actions";

export function CreateFeeSetupForm({
  programs,
  schoolYears,
  terms,
}: {
  programs: { id: string; code: string; name: string }[];
  schoolYears: { id: string; name: string }[];
  terms: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [programId, setProgramId] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [schoolYearId, setSchoolYearId] = useState("");
  const [termId, setTermId] = useState("");
  const [tuitionPerUnit, setTuitionPerUnit] = useState("0");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!programId) {
      alert("Please select a program");
      return;
    }
    setPending(true);
    const r = await createFeeSetupDraft({
      programId,
      yearLevel: yearLevel || null,
      schoolYearId: schoolYearId || null,
      termId: termId || null,
      tuitionPerUnit: tuitionPerUnit || "0",
    });
    setPending(false);
    if (r?.error) {
      alert(r.error);
      return;
    }
    if (r?.id) {
      router.push(`/finance/fee-setup/${r.id}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="programId">Program *</Label>
          <select
            id="programId"
            required
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
          >
            <option value="">Select program</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} – {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="yearLevel">Year Level</Label>
          <select
            id="yearLevel"
            value={yearLevel}
            onChange={(e) => setYearLevel(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"].map(
              (y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              )
            )}
          </select>
        </div>
        <div>
          <Label htmlFor="schoolYearId">School Year</Label>
          <select
            id="schoolYearId"
            value={schoolYearId}
            onChange={(e) => setSchoolYearId(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
          >
            <option value="">Any</option>
            {schoolYears.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="termId">Term</Label>
          <select
            id="termId"
            value={termId}
            onChange={(e) => setTermId(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
          >
            <option value="">Any</option>
            {terms.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="tuitionPerUnit">Tuition per unit (₱)</Label>
          <Input
            id="tuitionPerUnit"
            type="number"
            step="0.01"
            min="0"
            value={tuitionPerUnit}
            onChange={(e) => setTuitionPerUnit(e.target.value)}
            className="mt-1 w-40"
          />
        </div>
      </div>
      <Button
        type="submit"
        disabled={pending}
        className="bg-[#6A0000] hover:bg-[#6A0000]/90"
      >
        {pending ? "Creating…" : "Create draft"}
      </Button>
    </form>
  );
}
