"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [editing, setEditing] = useState(false);
  const [posting, setPosting] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<AssessmentLineInput[]>([]);
  const [notes, setNotes] = useState("");
  const [fullPaymentDiscount, setFullPaymentDiscount] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editing && assessment.id) {
      setFullPaymentDiscount(parseFloat(assessment.discounts ?? "0") > 0);
      setLoading(true);
      getAssessmentLinesAction(assessment.id)
        .then((res) => {
          if (res.lines?.length) setLines(res.lines);
        })
        .finally(() => setLoading(false));
    }
  }, [editing, assessment.id, assessment.discounts]);

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
    setEditing(false);
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

  if (editing) {
    return (
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 rounded border p-2 max-w-md"
      >
        {error && <p className="text-xs text-red-600">{error}</p>}
        {loading && <p className="text-xs text-neutral-600">Loading lines…</p>}
        <div>
          <Label className="text-xs">Lines</Label>
          <Button type="button" variant="outline" size="sm" onClick={addLine}>
            Add line
          </Button>
          <div className="mt-2 space-y-1">
            {lines.map((line, i) => (
              <div key={i} className="flex gap-1 items-end">
                <Input
                  value={line.description}
                  onChange={(e) => updateLine(i, { description: e.target.value })}
                  placeholder="Description"
                  className="h-8 text-sm flex-1"
                  required
                />
                <Input
                  type="number"
                  step="0.01"
                  value={line.amount}
                  onChange={(e) => updateLine(i, { amount: e.target.value })}
                  className="h-8 w-20 text-sm"
                  required
                />
                <Input
                  type="number"
                  min={1}
                  value={line.qty ?? 1}
                  onChange={(e) =>
                    updateLine(i, { qty: parseInt(e.target.value, 10) || 1 })
                  }
                  className="h-8 w-14 text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLine(i)}
                  className="h-8 text-red-600"
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
          <Label htmlFor="edit-fullPaymentDiscount" className="text-xs font-normal">
            Apply full payment discount (10% off tuition & lab)
          </Label>
        </div>
        <div>
          <Label className="text-xs">Notes</Label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="flex gap-1">
          <LoadingButton type="submit" size="sm" pending={pending} disabled={lines.length === 0}>
            Save
          </LoadingButton>
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
  );
}
