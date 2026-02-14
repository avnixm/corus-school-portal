"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
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
  const [enrollmentId, setEnrollmentId] = useState<string>("");
  const [lines, setLines] = useState<AssessmentLineInput[]>([]);
  const [notes, setNotes] = useState("");

  function handleEnrollmentChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setEnrollmentId(id);
    if (id) {
      getSuggestedFeeLinesAction(id).then((result) => {
        if (result.lines) setLines(result.lines);
        else setLines([]);
      });
    } else {
      setLines([]);
    }
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
    setLines(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!enrollmentId) {
      setError("Select an enrollment");
      return;
    }
    const validLines = lines.filter(
      (l) => l.description.trim() && parseFloat(l.amount) > 0
    );
    if (validLines.length === 0) {
      setError("Add at least one line with description and amount");
      return;
    }
    startTransition(async () => {
      const result = await createAssessmentAction(
        enrollmentId,
        validLines,
        notes || undefined
      );
      if (result?.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setEnrollmentId("");
      setLines([]);
      setNotes("");
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Create Assessment
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border bg-white p-4 shadow-sm"
    >
      <h3 className="font-semibold text-[#6A0000]">Create Assessment</h3>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <Label htmlFor="enrollmentId">Enrollment *</Label>
        <select
          id="enrollmentId"
          value={enrollmentId}
          onChange={handleEnrollmentChange}
          required
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
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
        <div className="mt-2 space-y-2">
          {lines.map((line, i) => (
            <div
              key={i}
              className="flex flex-wrap items-end gap-2 rounded border p-2"
            >
              <div className="min-w-[200px] flex-1">
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
                  onChange={(e) =>
                    updateLine(i, {
                      category: e.target.value as "tuition" | "misc" | "other",
                    })
                  }
                  className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm"
                >
                  <option value="tuition">Tuition</option>
                  <option value="misc">Misc</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="w-24">
                <Label className="text-xs">Amount</Label>
                <Input
                  type="number"
                  step="0.01"
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
                  onChange={(e) =>
                    updateLine(i, { qty: parseInt(e.target.value, 10) || 1 })
                  }
                  className="h-8 text-sm"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeLine(i)}
                className="text-red-600"
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setOpen(false);
            setEnrollmentId("");
            setLines([]);
            setNotes("");
          }}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
