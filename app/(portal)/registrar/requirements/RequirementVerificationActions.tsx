"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle } from "lucide-react";
import { verifyRequirementAction, rejectRequirementAction } from "./actions";
import { useState } from "react";

export function RequirementVerificationActions({
  verificationId,
}: {
  verificationId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [notes, setNotes] = useState("");

  function handleVerify() {
    startTransition(() => {
      verifyRequirementAction(verificationId);
    });
  }

  function handleReject() {
    if (!rejecting) {
      setRejecting(true);
      return;
    }
    startTransition(() => {
      rejectRequirementAction(verificationId, notes);
      setRejecting(false);
      setNotes("");
    });
  }

  if (rejecting) {
    return (
      <div className="flex flex-col gap-2">
        <Label htmlFor="notes" className="text-xs">Rejection notes</Label>
        <Input
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Reason for rejection"
          className="h-8 text-sm"
        />
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            className="border-red-600 text-red-600"
            onClick={handleReject}
            disabled={isPending || !notes.trim()}
          >
            Confirm Reject
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setRejecting(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        onClick={handleVerify}
        disabled={isPending}
        className="gap-1 bg-green-600 hover:bg-green-700"
      >
        <CheckCircle className="h-3 w-3" />
        Verify
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={handleReject}
        disabled={isPending}
        className="gap-1 border-red-600 text-red-600"
      >
        <XCircle className="h-3 w-3" />
        Reject
      </Button>
    </div>
  );
}
