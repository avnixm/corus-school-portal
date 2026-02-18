"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  createAssessmentAction,
  getSuggestedFeeLinesAction,
} from "./actions";
import type { AssessmentLineInput } from "@/lib/finance/queries";

type EnrollmentOption = {
  id: string;
  studentCode: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string;
  schoolYearName: string;
  termName: string;
  program: string | null;
  yearLevel: string | null;
};

function fullName(r: { firstName: string; middleName?: string | null; lastName: string }) {
  return [r.firstName, r.middleName, r.lastName].filter(Boolean).join(" ");
}

export function CreateAssessmentForm({
  enrollments,
}: {
  enrollments: EnrollmentOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [enrollmentId, setEnrollmentId] = useState("");
  const [lines, setLines] = useState<AssessmentLineInput[]>([]);
  const [notes, setNotes] = useState("");
  const [fullPaymentDiscount, setFullPaymentDiscount] = useState(false);

  const subtotal = lines.reduce((sum, l) => {
    const amt = parseFloat(l.amount || "0");
    const qty = l.qty ?? 1;
    return sum + amt * qty;
  }, 0);

  const discountAmount = fullPaymentDiscount
    ? lines.reduce((sum, l) => {
        const amt = parseFloat(l.amount || "0");
        const qty = l.qty ?? 1;
        if (l.category === "tuition" || l.category === "lab") return sum + amt * qty * 0.1;
        return sum;
      }, 0)
    : 0;
  const displayTotal = subtotal - discountAmount;

  function handleEnrollmentChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setEnrollmentId(id);
    if (id) {
      getSuggestedFeeLinesAction(id).then((result) => {
        if (result.lines) setLines(result.lines);
        else setLines([]);
      });
    } else setLines([]);
  }

  function addLine() {
    setLines([...lines, { description: "", category: "other", amount: "0", qty: 1 }]);
  }

  function removeLine(i: number) {
    setLines(lines.filter((_, idx) => idx !== i));
  }

  function updateLine(i: number, updates: Partial<AssessmentLineInput>) {
    const next = [...lines];
    next[i] = { ...next[i], ...updates };
    // Ensure positive amount and qty >= 1
    if (updates.amount !== undefined) {
      const amt = parseFloat(updates.amount);
      if (amt < 0) next[i].amount = "0";
    }
    if (updates.qty !== undefined && updates.qty < 1) {
      next[i].qty = 1;
    }
    setLines(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!enrollmentId) {
      setError("Select an enrollment");
      return;
    }
    const validLines = lines.filter((l) => l.description.trim() && parseFloat(l.amount) > 0);
    if (validLines.length === 0) {
      setError("Add at least one line with description and amount > 0");
      return;
    }
    // Check for invalid amounts or qty
    for (const line of validLines) {
      const amt = parseFloat(line.amount);
      if (amt < 0) {
        setError("Amount cannot be negative");
        return;
      }
      if ((line.qty ?? 1) < 1) {
        setError("Quantity must be at least 1");
        return;
      }
    }
    startTransition(async () => {
      try {
        const result = await createAssessmentAction(
          enrollmentId,
          validLines,
          notes || undefined,
          fullPaymentDiscount
        );
        if (result?.error) {
          setError(result.error);
          toast.error(result.error);
          return;
        }
        toast.success("Assessment draft created successfully");
        setOpen(false);
        setEnrollmentId("");
        setLines([]);
        setNotes("");
        setFullPaymentDiscount(false);
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create assessment.";
        setError(message);
        toast.error(message);
      }
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Create Assessment
      </Button>
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEnrollmentId(""); setLines([]); setNotes(""); setFullPaymentDiscount(false); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Assessment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div>
              <Label htmlFor="enrollmentId">Enrollment *</Label>
              <select
                id="enrollmentId"
                value={enrollmentId}
                onChange={handleEnrollmentChange}
                required
                className="mt-1 flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">Select enrollment</option>
                {enrollments.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.studentCode} – {fullName(e)} – {e.schoolYearName} / {e.termName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label>Line items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLine}>
                  Add line
                </Button>
              </div>
              <div className="mt-2 max-h-48 space-y-2 overflow-y-auto">
                {lines.map((line, i) => (
                  <div key={i} className="flex flex-wrap items-end gap-2 rounded border p-2">
                    <div className="min-w-[160px] flex-1">
                      <Label className="text-xs">Description</Label>
                      <Input
                        value={line.description}
                        onChange={(e) => updateLine(i, { description: e.target.value })}
                        placeholder="Description"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="w-24">
                      <Label className="text-xs">Category</Label>
                      <select
                        value={line.category}
                        onChange={(e) => updateLine(i, { category: e.target.value as "tuition" | "lab" | "misc" | "other" })}
                        className="flex h-8 w-full rounded-md border border-neutral-200 bg-white px-2 text-sm"
                      >
                        <option value="tuition">Tuition</option>
                        <option value="lab">Lab</option>
                        <option value="misc">Misc</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="w-24">
                      <Label className="text-xs">Amount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.amount}
                        onChange={(e) => updateLine(i, { amount: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="w-16">
                      <Label className="text-xs">Qty</Label>
                      <Input
                        type="number"
                        min={1}
                        value={line.qty ?? 1}
                        onChange={(e) => updateLine(i, { qty: parseInt(e.target.value, 10) || 1 })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(i)} className="text-red-600">
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="fullPaymentDiscount"
                checked={fullPaymentDiscount}
                onChange={(e) => setFullPaymentDiscount(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300"
              />
              <Label htmlFor="fullPaymentDiscount" className="font-normal">
                Apply full payment discount (10% off tuition & lab)
              </Label>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" className="mt-1 h-10" />
            </div>
            {lines.length > 0 && (
              <div className="rounded-lg border border-[#6A0000]/20 bg-[#6A0000]/5 p-3">
                <p className="text-sm font-medium text-[#6A0000]">Total Preview</p>
                {fullPaymentDiscount && discountAmount > 0 && (
                  <p className="mt-1 text-xs text-green-700">
                    Less: Full payment discount (10%) −₱{discountAmount.toFixed(2)}
                  </p>
                )}
                <p className="mt-1 text-2xl font-bold text-[#6A0000]">
                  ₱{displayTotal.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="mt-1 text-xs text-neutral-600">{lines.length} line item(s)</p>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setOpen(false); setEnrollmentId(""); setLines([]); setNotes(""); setFullPaymentDiscount(false); }} disabled={pending}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {pending ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
