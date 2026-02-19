"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import {
  createPromissoryNoteAction,
  submitPromissoryNoteAction,
  getTotalsForPromissoryNoteAction,
} from "../../../actions";
import { generateInstallmentSchedule } from "@/lib/clearance/installmentSchedule";

type Period = { id: string; name: string };

function formatPeso(value: string) {
  const n = parseFloat(value || "0");
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

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
  const [includePreviousBalances, setIncludePreviousBalances] = useState(true);
  const [limitToCurrentTermOnly, setLimitToCurrentTermOnly] = useState(false);
  const [totals, setTotals] = useState<{
    currentTermBalance: string;
    previousUnpaidTotal: string;
    totalOutstanding: string;
    totalPromisedDefault: string;
  } | null>(null);
  const [totalsLoading, setTotalsLoading] = useState(true);
  const [totalPromisedAmount, setTotalPromisedAmount] = useState("");
  const [installmentMonths, setInstallmentMonths] = useState(3);
  const [startDate, setStartDate] = useState("");
  const [reason, setReason] = useState("");
  const [financeRemarks, setFinanceRemarks] = useState("");

  useEffect(() => {
    let cancelled = false;
    setTotalsLoading(true);
    getTotalsForPromissoryNoteAction(enrollmentId, studentId, includePreviousBalances)
      .then((result) => {
        if (cancelled || "error" in result) return;
        setTotals(result);
        if (!limitToCurrentTermOnly) {
          setTotalPromisedAmount(result.totalOutstanding);
        } else {
          setTotalPromisedAmount((prev) => {
            const cur = parseFloat(result.currentTermBalance);
            if (prev === "" || parseFloat(prev) > cur) return result.currentTermBalance;
            return prev;
          });
        }
      })
      .finally(() => {
        if (!cancelled) setTotalsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enrollmentId, studentId, includePreviousBalances]);

  useEffect(() => {
    if (!totals) return;
    if (!limitToCurrentTermOnly) {
      setTotalPromisedAmount(totals.totalOutstanding);
    } else {
      setTotalPromisedAmount((prev) => {
        const max = parseFloat(totals.currentTermBalance);
        const p = parseFloat(prev || "0");
        if (p > max || prev === "") return totals.currentTermBalance;
        return prev;
      });
    }
  }, [limitToCurrentTermOnly, totals]);

  const schedulePreview = useMemo(() => {
    const amount = totalPromisedAmount.trim() || "0";
    const n = Math.max(1, Math.min(6, installmentMonths));
    if (parseFloat(amount) <= 0 || !startDate) return [];
    const start = new Date(startDate);
    if (Number.isNaN(start.getTime())) return [];
    return generateInstallmentSchedule(amount, start, n);
  }, [totalPromisedAmount, installmentMonths, startDate]);

  const totalOutstanding = totals?.totalOutstanding ?? "0";
  const canEditTotalPromised = limitToCurrentTermOnly;
  const maxPromised = limitToCurrentTermOnly ? (totals?.currentTermBalance ?? "0") : totalOutstanding;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!periodId || !reason.trim()) {
      toast.error("Fill required fields: period, reason.");
      return;
    }
    if (!totalPromisedAmount || parseFloat(totalPromisedAmount) <= 0) {
      toast.error("Total amount promised must be greater than 0.");
      return;
    }
    if (!startDate) {
      toast.error("Start date is required.");
      return;
    }
    if (installmentMonths < 1 || installmentMonths > 6) {
      toast.error("Installment months must be between 1 and 6.");
      return;
    }
    if (canEditTotalPromised && parseFloat(totalPromisedAmount) > parseFloat(maxPromised)) {
      toast.error("Total promised cannot exceed current term balance when limiting to current term only.");
      return;
    }

    startTransition(async () => {
      const createResult = await createPromissoryNoteAction({
        enrollmentId,
        studentId,
        periodId,
        totalOutstandingAmount: totalOutstanding,
        totalPromisedAmount: totalPromisedAmount.trim(),
        installmentMonths,
        startDate,
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
            <Label htmlFor="periodId">Semester</Label>
            <p className="mt-1 text-xs text-neutral-500">
              One promissory note per semester; it covers all grading periods (Prelim, Midterm, Final) in that term.
            </p>
            <Select value={periodId} onValueChange={setPeriodId} required>
              <SelectTrigger id="periodId" className="mt-1">
                <SelectValue placeholder="Select semester period" />
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

          <div className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50/50 p-3">
            <p className="text-xs font-medium text-neutral-700">Include balances</p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includePreviousBalances}
                onChange={(e) => setIncludePreviousBalances(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300"
              />
              Include previous unpaid balances (default ON)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={limitToCurrentTermOnly}
                onChange={(e) => setLimitToCurrentTermOnly(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300"
              />
              Limit to current term only (default OFF)
            </label>
          </div>

          <div className="space-y-2 rounded-lg border border-neutral-200 p-3">
            <p className="text-xs font-medium text-neutral-700">Computed totals</p>
            {totalsLoading ? (
              <p className="text-sm text-neutral-500">Loading…</p>
            ) : (
              <>
                <p className="text-sm">
                  <span className="text-neutral-600">Current term balance:</span>{" "}
                  {formatPeso(totals?.currentTermBalance ?? "0")}
                </p>
                {includePreviousBalances && (
                  <p className="text-sm">
                    <span className="text-neutral-600">Previous unpaid:</span>{" "}
                    {formatPeso(totals?.previousUnpaidTotal ?? "0")}
                  </p>
                )}
                <p className="text-sm">
                  <span className="text-neutral-600">Total outstanding:</span>{" "}
                  {formatPeso(totalOutstanding)}
                </p>
                <div>
                  <Label htmlFor="totalPromised" className="text-sm">
                    Total amount promised
                  </Label>
                  <Input
                    id="totalPromised"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={totalPromisedAmount}
                    onChange={(e) => setTotalPromisedAmount(e.target.value)}
                    disabled={!canEditTotalPromised}
                    className="mt-1 max-w-[12rem]"
                  />
                  {canEditTotalPromised && (
                    <p className="mt-1 text-xs text-neutral-500">
                      Max: {formatPeso(maxPromised)} (current term only)
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="installmentMonths">Payment term (months)</Label>
              <Select
                value={String(installmentMonths)}
                onValueChange={(v) => setInstallmentMonths(Number(v))}
              >
                <SelectTrigger id="installmentMonths" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} month{n > 1 ? "s" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="startDate">Start date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
                required
              />
            </div>
          </div>

          {schedulePreview.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-neutral-700">Installment schedule (preview)</p>
              <div className="overflow-x-auto rounded border border-neutral-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-neutral-600">Payment</th>
                      <th className="px-3 py-2 text-left font-medium text-neutral-600">Due date</th>
                      <th className="px-3 py-2 text-right font-medium text-neutral-600">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedulePreview.map((row) => (
                      <tr key={row.sequence} className="border-t border-neutral-100">
                        <td className="px-3 py-2">
                          {row.sequence === 1
                            ? "1st payment"
                            : row.sequence === 2
                              ? "2nd payment"
                              : row.sequence === 3
                                ? "3rd payment"
                                : `${row.sequence}th payment`}
                        </td>
                        <td className="px-3 py-2">
                          {new Date(row.dueDate + "Z").toLocaleDateString("en-PH")}
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          {formatPeso(row.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="reason">Reason / terms</Label>
            <Textarea
              id="reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1"
              placeholder="e.g. Balance to be paid in monthly installments as scheduled"
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
