// path: app/(portal)/dean/fees/DeanFeeApprovalRow.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  approveFeeSetupAsDean,
  rejectFeeSetupAsDean,
} from "./actions";

export function DeanFeeApprovalRow({
  feeSetupId,
  programCode,
  programName,
  yearLevel,
  schoolYearName,
  termName,
  tuitionPerUnit,
}: {
  feeSetupId: string;
  programCode: string;
  programName: string;
  yearLevel: string | null;
  schoolYearName: string | null;
  termName: string | null;
  tuitionPerUnit: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [remarks, setRemarks] = useState("");

  async function handleApprove() {
    setPending(true);
    const r = await approveFeeSetupAsDean(feeSetupId);
    setPending(false);
    if (r?.error) alert(r.error);
    else router.refresh();
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
    else {
      setShowReject(false);
      setRemarks("");
      router.refresh();
    }
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={`/dean/fees/${feeSetupId}`}
            className="font-medium text-[#6A0000] hover:underline"
          >
            {programCode} – {programName}
          </Link>
          <p className="mt-1 text-sm text-neutral-600">
            {yearLevel ?? "All"} · {schoolYearName ?? "Any"} · {termName ?? "Any"}
          </p>
          <p className="mt-1 text-sm">
            Tuition: ₱{parseFloat(tuitionPerUnit).toFixed(2)}/unit
          </p>
        </div>
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
            <div className="flex flex-col gap-2">
              <textarea
                placeholder="Reason for rejection"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="min-w-[200px] rounded border px-2 py-1 text-sm"
                rows={2}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                  onClick={handleReject}
                  disabled={pending}
                >
                  Confirm reject
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
