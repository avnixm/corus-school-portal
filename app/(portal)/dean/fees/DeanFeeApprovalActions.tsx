// path: app/(portal)/dean/fees/DeanFeeApprovalActions.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { approveFeeSetupAsDean, rejectFeeSetupAsDean } from "./actions";

export function DeanFeeApprovalActions({ feeSetupId }: { feeSetupId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [remarks, setRemarks] = useState("");

  async function handleApprove() {
    setPending(true);
    const r = await approveFeeSetupAsDean(feeSetupId);
    setPending(false);
    if (r?.error) alert(r.error);
    else router.push("/dean/approvals?tab=feeSetups");
  }

  async function handleReject() {
    if (!remarks.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }
    setPending(true);
    const r = await rejectFeeSetupAsDean(feeSetupId, remarks);
    setPending(false);
    if (r?.error) alert(r.error);
    else router.push("/dean/approvals?tab=feeSetups");
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        onClick={handleApprove}
        disabled={pending}
        className="bg-green-600 hover:bg-green-700"
      >
        Approve
      </Button>
      {!showReject ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowReject(true)}
          disabled={pending}
        >
          Reject
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <textarea
            placeholder="Reason for rejection"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="min-w-[200px] rounded border px-2 py-1 text-sm"
            rows={1}
          />
          <Button
            size="sm"
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50"
            onClick={handleReject}
            disabled={pending}
          >
            Confirm
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setShowReject(false);
              setRemarks("");
            }}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
