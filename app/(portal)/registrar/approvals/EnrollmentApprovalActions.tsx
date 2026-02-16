"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { approveEnrollment, rejectEnrollment } from "./actions";
import type { EnrollmentRequirementsSummary } from "@/lib/requirements/enrollmentSummary";

interface EnrollmentApprovalActionsProps {
  enrollmentId: string;
  requirementsSummary?: EnrollmentRequirementsSummary | null;
}

export function EnrollmentApprovalActions({
  enrollmentId,
  requirementsSummary,
}: EnrollmentApprovalActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const allRequiredVerified =
    !requirementsSummary ||
    requirementsSummary.required === 0 ||
    requirementsSummary.verified >= requirementsSummary.required;
  const canApproveNormally = allRequiredVerified;

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const result = await approveEnrollment(enrollmentId, {});
      if (result?.error) {
        setError(result.error);
        return;
      }
    });
  }

  function handleOverrideApprove() {
    setOverrideOpen(true);
    setOverrideReason("");
    setError(null);
  }

  function handleConfirmOverride() {
    const trimmed = overrideReason.trim();
    if (!trimmed) {
      setError("Please provide a reason for overriding.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await approveEnrollment(enrollmentId, {
        override: true,
        remarks: trimmed,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      setOverrideOpen(false);
      setOverrideReason("");
    });
  }

  function handleReject() {
    setRejectOpen(true);
    setRejectReason("");
    setError(null);
  }

  function handleConfirmReject() {
    const trimmed = rejectReason.trim();
    if (!trimmed) {
      setError("Please provide a reason for rejection so the student knows what to fix.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await rejectEnrollment(enrollmentId, trimmed);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setRejectOpen(false);
      setRejectReason("");
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <Button
          onClick={handleApprove}
          disabled={isPending || !canApproveNormally}
          className="gap-2 bg-green-600 hover:bg-green-700"
          title={
            !canApproveNormally
              ? "Verify all required documents before approving enrollment."
              : undefined
          }
        >
          <CheckCircle className="h-4 w-4" />
          Approve
        </Button>
        {!canApproveNormally && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleOverrideApprove}
            disabled={isPending}
            className="gap-1 border-amber-500 text-amber-700 hover:bg-amber-50"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Override and approve
          </Button>
        )}
        <Button
          variant="outline"
          onClick={handleReject}
          disabled={isPending}
          className="gap-2 border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <XCircle className="h-4 w-4" />
          Reject
        </Button>
      </div>
      {!canApproveNormally && requirementsSummary && requirementsSummary.required > 0 && (
        <p className="text-xs text-amber-700">
          Verify all required documents before approving ({requirementsSummary.verified}/
          {requirementsSummary.required} verified).
        </p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject enrollment</DialogTitle>
            <DialogDescription>
              Provide a reason for rejection. The student will see this message and can fix the issues before resubmitting.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Reason for rejection *</Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Missing Form 137; please upload your permanent record."
              className="min-h-[100px]"
              disabled={isPending}
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50"
              onClick={handleConfirmReject}
              disabled={isPending || !rejectReason.trim()}
            >
              {isPending ? "Rejecting…" : "Reject enrollment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override and approve</DialogTitle>
            <DialogDescription>
              Not all required documents are verified. Provide a reason for approving anyway. This will be recorded.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="override-reason">Reason for override *</Label>
            <Textarea
              id="override-reason"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="e.g. Documents to follow; student will submit next week."
              className="min-h-[100px]"
              disabled={isPending}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleConfirmOverride}
              disabled={isPending || !overrideReason.trim()}
            >
              {isPending ? "Approving…" : "Override and approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
