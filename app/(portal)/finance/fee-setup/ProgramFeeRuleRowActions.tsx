"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  const [editOpen, setEditOpen] = useState(false);
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
    setEditOpen(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Delete this program fee rule?")) return;
    setPending(true);
    await deleteProgramFeeRuleAction(rule.id);
    setPending(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditOpen(true)}
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Program Fee Rule</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor={`edit-program-${rule.id}`}>Program</Label>
                <Input
                  id={`edit-program-${rule.id}`}
                  name="program"
                  defaultValue={rule.program ?? ""}
                  required
                  className="mt-1 h-10"
                />
              </div>
              <div>
                <Label htmlFor={`edit-yearLevel-${rule.id}`}>Year Level</Label>
                <Input
                  id={`edit-yearLevel-${rule.id}`}
                  name="yearLevel"
                  defaultValue={rule.yearLevel ?? ""}
                  className="mt-1 h-10"
                />
              </div>
              <div>
                <Label htmlFor={`edit-schoolYearId-${rule.id}`}>School Year</Label>
                <select
                  id={`edit-schoolYearId-${rule.id}`}
                  name="schoolYearId"
                  defaultValue={rule.schoolYearId ?? ""}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
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
                <Label htmlFor={`edit-termId-${rule.id}`}>Term</Label>
                <select
                  id={`edit-termId-${rule.id}`}
                  name="termId"
                  defaultValue={rule.termId ?? ""}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                >
                  <option value="">—</option>
                  {terms.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor={`edit-feeItemId-${rule.id}`}>Fee Item *</Label>
                <select
                  id={`edit-feeItemId-${rule.id}`}
                  name="feeItemId"
                  defaultValue={rule.feeItemId}
                  required
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                >
                  {feeItems.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.code} – {f.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor={`edit-amount-${rule.id}`}>Amount *</Label>
                <Input
                  id={`edit-amount-${rule.id}`}
                  name="amount"
                  type="number"
                  step="0.01"
                  defaultValue={rule.amount}
                  required
                  className="mt-1 h-10"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
