"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
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
  updateAssessmentAction,
  postAssessmentAction,
  getAssessmentLinesAction,
} from "./actions";
import type { AssessmentLineInput } from "@/lib/finance/queries";
import type { getAssessmentsList } from "@/lib/finance/queries";

type Assessment = Awaited<ReturnType<typeof getAssessmentsList>>[number];

export function AssessmentRowActions({ assessment }: { assessment: Assessment }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [posting, setPosting] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<AssessmentLineInput[]>([]);
  const [notes, setNotes] = useState("");
  const [fullPaymentDiscount, setFullPaymentDiscount] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editOpen && assessment.id) {
      setFullPaymentDiscount(parseFloat(assessment.discounts ?? "0") > 0);
      setLoading(true);
      getAssessmentLinesAction(assessment.id)
        .then((res) => {
          if (res.lines?.length) setLines(res.lines);
        })
        .finally(() => setLoading(false));
    }
  }, [editOpen, assessment.id, assessment.discounts]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const result = await updateAssessmentAction(
      assessment.id,
      lines,
      notes || undefined,
      fullPaymentDiscount
    );
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setEditOpen(false);
    router.refresh();
  }

  async function handlePost() {
    if (!confirm("Post this assessment? Charges will be created in the ledger."))
      return;
    setError(null);
    setPosting(true);
    const result = await postAssessmentAction(assessment.id);
    setPosting(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  function addLine() {
    setLines((prev) => [
      ...prev,
      { description: "", category: "tuition" as const, amount: "0", qty: 1 },
    ]);
  }

  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateLine(i: number, updates: Partial<AssessmentLineInput>) {
    setLines((prev) =>
      prev.map((l, idx) => (idx === i ? { ...l, ...updates } : l))
    );
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
        <LoadingButton
          variant="ghost"
          size="sm"
          onClick={handlePost}
          pending={posting}
          className="h-8"
        >
          {posting ? "Posting…" : "Post"}
        </LoadingButton>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Assessment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            {loading && <p className="text-sm text-neutral-600">Loading lines…</p>}
            <div>
              <Label>Lines</Label>
              <Button type="button" variant="outline" size="sm" onClick={addLine} className="mt-2">
                Add line
              </Button>
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                {lines.map((line, i) => (
                  <div key={i} className="flex gap-2 items-end">
                    <Input
                      value={line.description}
                      onChange={(e) => updateLine(i, { description: e.target.value })}
                      placeholder="Description"
                      className="h-9 flex-1"
                      required
                    />
                    <Input
                      type="number"
                      step="0.01"
                      value={line.amount}
                      onChange={(e) => updateLine(i, { amount: e.target.value })}
                      className="h-9 w-20"
                      required
                    />
                    <Input
                      type="number"
                      min={1}
                      value={line.qty ?? 1}
                      onChange={(e) =>
                        updateLine(i, { qty: parseInt(e.target.value, 10) || 1 })
                      }
                      className="h-9 w-14"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLine(i)}
                      className="h-9 text-red-600 shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-fullPaymentDiscount"
                checked={fullPaymentDiscount}
                onChange={(e) => setFullPaymentDiscount(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300"
              />
              <Label htmlFor="edit-fullPaymentDiscount" className="text-sm font-normal">
                Apply full payment discount (10% off tuition & lab)
              </Label>
            </div>
            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Input
                id="edit-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 h-9"
              />
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
              <LoadingButton
                type="submit"
                pending={pending}
                disabled={lines.length === 0}
              >
                Save
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
