"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingButton } from "@/components/ui/loading-button";
import { toast } from "sonner";
import { createPromissoryNoteAction, submitPromissoryNoteAction } from "../../../actions";

type Period = { id: string; name: string };

export function CreatePromissoryNoteForm({
  enrollmentId,
  studentId,
  periods,
  defaultPeriodId,
}: {
  enrollmentId: string;
  studentId: string;
  periods: Period[];
  defaultPeriodId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [periodId, setPeriodId] = useState(defaultPeriodId);
  const [amountPromised, setAmountPromised] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [reason, setReason] = useState("");
  const [financeRemarks, setFinanceRemarks] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!periodId || !amountPromised.trim() || !dueDate || !reason.trim()) {
      toast.error("Fill required fields: period, amount, due date, reason.");
      return;
    }
    startTransition(async () => {
      const createResult = await createPromissoryNoteAction({
        enrollmentId,
        studentId,
        periodId,
        amountPromised: amountPromised.trim(),
        dueDate,
        reason: reason.trim(),
        financeRemarks: financeRemarks.trim() || null,
      });
      if ("error" in createResult) {
        toast.error(createResult.error);
        return;
      }
      const noteId = createResult.noteId;
      const submitResult = await submitPromissoryNoteAction(noteId);
      if ("error" in submitResult) {
        toast.error(submitResult.error);
        return;
      }
      toast.success("Promissory note submitted to Dean.");
      router.push("/finance/clearance");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-neutral-900">
          Promissory note details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="periodId">Grading period</Label>
            <Select value={periodId} onValueChange={setPeriodId} required>
              <SelectTrigger id="periodId" className="mt-1">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="amountPromised">Amount promised (₱)</Label>
            <Input
              id="amountPromised"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amountPromised}
              onChange={(e) => setAmountPromised(e.target.value)}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="dueDate">Due date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="reason">Reason / terms</Label>
            <Textarea
              id="reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1"
              placeholder="e.g. Balance to be paid by end of term"
              required
            />
          </div>
          <div>
            <Label htmlFor="financeRemarks">Finance remarks (optional)</Label>
            <Textarea
              id="financeRemarks"
              rows={2}
              value={financeRemarks}
              onChange={(e) => setFinanceRemarks(e.target.value)}
              className="mt-1"
            />
          </div>
          <LoadingButton type="submit" pending={pending}>
            Create & submit to Dean
          </LoadingButton>
        </form>
      </CardContent>
    </Card>
  );
}
