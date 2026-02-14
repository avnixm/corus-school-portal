"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Program Fee Rule
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Program Fee Rule</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="program">Program *</Label>
                <Input id="program" name="program" required placeholder="e.g. BSCS" className="mt-1 h-10" />
              </div>
              <div>
                <Label htmlFor="yearLevel">Year Level</Label>
                <Input id="yearLevel" name="yearLevel" placeholder="e.g. 1, 2, 3" className="mt-1 h-10" />
              </div>
              <div>
                <Label htmlFor="schoolYearId">School Year</Label>
                <select id="schoolYearId" name="schoolYearId" className="mt-1 flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm">
                  <option value="">—</option>
                  {schoolYears.map((sy) => (
                    <option key={sy.id} value={sy.id}>{sy.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="termId">Term</Label>
                <select id="termId" name="termId" className="mt-1 flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm">
                  <option value="">—</option>
                  {terms.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="feeItemId">Fee Item *</Label>
                <select id="feeItemId" name="feeItemId" required className="mt-1 flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm">
                  <option value="">Select fee item</option>
                  {feeItems.map((f) => (
                    <option key={f.id} value={f.id}>{f.code} – {f.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="amount">Amount *</Label>
                <Input id="amount" name="amount" type="number" step="0.01" required placeholder="0.00" className="mt-1 h-10" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
              <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
