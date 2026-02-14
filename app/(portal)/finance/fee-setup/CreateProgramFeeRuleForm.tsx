"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { createProgramFeeRuleAction } from "./actions";

type FeeItem = { id: string; code: string; name: string };
type SchoolYear = { id: string; name: string };
type Term = { id: string; name: string };

export function CreateProgramFeeRuleForm({
  feeItems,
  schoolYears,
  terms,
}: {
  feeItems: FeeItem[];
  schoolYears: SchoolYear[];
  terms: Term[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await createProgramFeeRuleAction(formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Program Fee Rule
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border bg-white p-4 shadow-sm"
    >
      <h3 className="font-semibold text-[#6A0000]">Create Program Fee Rule</h3>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor="program">Program *</Label>
          <Input id="program" name="program" required placeholder="e.g. BSCS" />
        </div>
        <div>
          <Label htmlFor="yearLevel">Year Level</Label>
          <Input
            id="yearLevel"
            name="yearLevel"
            placeholder="e.g. 1, 2, 3"
          />
        </div>
        <div>
          <Label htmlFor="schoolYearId">School Year</Label>
          <select
            id="schoolYearId"
            name="schoolYearId"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          >
            <option value="">—</option>
            {schoolYears.map((sy) => (
              <option key={sy.id} value={sy.id}>
                {sy.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="termId">Term</Label>
          <select
            id="termId"
            name="termId"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          >
            <option value="">—</option>
            {terms.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="feeItemId">Fee Item *</Label>
          <select
            id="feeItemId"
            name="feeItemId"
            required
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          >
            <option value="">Select fee item</option>
            {feeItems.map((f) => (
              <option key={f.id} value={f.id}>
                {f.code} – {f.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="amount">Amount *</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            required
            placeholder="0.00"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          Create
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(false)}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
