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
import { CheckCircle, XCircle } from "lucide-react";
import { approveEnrollment, rejectEnrollment } from "./actions";

interface EnrollmentApprovalActionsProps {
  enrollmentId: string;
}

export function EnrollmentApprovalActions({
  enrollmentId,
}: EnrollmentApprovalActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleApprove() {
    setError(null);
    startTransition(() => {
      approveEnrollment(enrollmentId);
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
    <div className="flex gap-2">
      <Button
        onClick={handleApprove}
        disabled={isPending}
        className="gap-2 bg-green-600 hover:bg-green-700"
      >
        <CheckCircle className="h-4 w-4" />
        Approve
      </Button>
      <Button
        variant="outline"
        onClick={handleReject}
        disabled={isPending}
        className="gap-2 border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700"
      >
        <XCircle className="h-4 w-4" />
        Reject
      </Button>

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
              placeholder="e.g. Missing Form 138; please upload your report card."
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
    </div>
  );
}
