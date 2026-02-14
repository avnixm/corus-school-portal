"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2 } from "lucide-react";
import {
  updateProgramFeeRuleAction,
  deleteProgramFeeRuleAction,
} from "./actions";

type ProgramFeeRule = {
  id: string;
  program: string | null;
  yearLevel: string | null;
  schoolYearId: string | null;
  termId: string | null;
  feeItemId: string;
  amount: string;
  feeCode: string;
  feeName: string;
};

type FeeItem = { id: string; code: string; name: string };
type SchoolYear = { id: string; name: string };
type Term = { id: string; name: string };

export function ProgramFeeRuleRowActions({
  rule,
  feeItems,
  schoolYears,
  terms,
}: {
  rule: ProgramFeeRule;
  feeItems: FeeItem[];
  schoolYears: SchoolYear[];
  terms: Term[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateProgramFeeRuleAction(rule.id, formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Delete this program fee rule?")) return;
    setPending(true);
    await deleteProgramFeeRuleAction(rule.id);
    setPending(false);
    router.refresh();
  }

  if (editing) {
    return (
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 rounded border p-2"
      >
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div>
          <Label htmlFor="program" className="text-xs">Program</Label>
          <Input
            id="program"
            name="program"
              defaultValue={rule.program ?? ""}
            className="h-8 text-sm"
            required
          />
        </div>
        <div>
          <Label htmlFor="yearLevel" className="text-xs">Year Level</Label>
          <Input
            id="yearLevel"
            name="yearLevel"
            defaultValue={rule.yearLevel ?? ""}
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="schoolYearId" className="text-xs">School Year</Label>
          <select
            id="schoolYearId"
            name="schoolYearId"
            defaultValue={rule.schoolYearId ?? ""}
            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm"
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
          <Label htmlFor="termId" className="text-xs">Term</Label>
          <select
            id="termId"
            name="termId"
            defaultValue={rule.termId ?? ""}
            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm"
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
          <Label htmlFor="feeItemId" className="text-xs">Fee Item</Label>
          <select
            id="feeItemId"
            name="feeItemId"
            defaultValue={rule.feeItemId}
            required
            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm"
          >
            {feeItems.map((f) => (
              <option key={f.id} value={f.id}>
                {f.code} – {f.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="amount" className="text-xs">Amount</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            defaultValue={rule.amount}
            className="h-8 text-sm"
            required
          />
        </div>
        <div className="flex gap-1">
          <Button type="submit" size="sm" disabled={pending}>
            Save
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEditing(false)}
            disabled={pending}
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setEditing(true)}
        className="h-8 gap-1"
      >
        <Pencil className="h-3 w-3" />
        Edit
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        disabled={pending}
        className="h-8 text-red-600 hover:text-red-700"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
