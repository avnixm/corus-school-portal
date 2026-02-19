// path: components/dean/approvals/ApprovalReview.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { ApproveDialog } from "./ApproveDialog";
import { RejectDialog } from "./RejectDialog";
import type { ApprovalTypeKey } from "./ApprovalTypeConfig";
import { approveScheduleAction, rejectScheduleAction } from "@/app/(portal)/dean/schedules/actions";
import { approveScheduleTimeConfigAction, rejectScheduleTimeConfigAction } from "@/app/(portal)/dean/schedule-time-config/actions";
import { approveCapabilityPackageAction, rejectCapabilityPackageAction } from "@/app/(portal)/dean/teacher-capabilities/actions";
import { approveFeeSetupAsDean, rejectFeeSetupAsDean } from "@/app/(portal)/dean/fees/actions";

export interface ApprovalReviewProps {
  typeKey: ApprovalTypeKey;
  id: string;
  title: string;
  program?: string | null;
  term?: string | null;
  schoolYear?: string | null;
  status: string;
  hasIssues?: boolean;
  backHref: string;
  children: React.ReactNode;
}

export function ApprovalReview({
  typeKey,
  id,
  title,
  program,
  term,
  schoolYear,
  status,
  hasIssues = false,
  backHref,
  children,
}: ApprovalReviewProps) {
  const router = useRouter();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const isPending =
    status === "submitted" ||
    status === "pending" ||
    status === "pending_dean";

  async function handleApprove() {
    setPending(true);
    let result: { error?: string } | undefined;
    switch (typeKey) {
      case "schedules":
        result = await approveScheduleAction(id);
        break;
      case "timeConfig":
        result = await approveScheduleTimeConfigAction(id);
        break;
      case "capabilities":
        result = await approveCapabilityPackageAction(id);
        break;
      case "feeSetups":
        result = await approveFeeSetupAsDean(id);
        break;
    }
    setPending(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Approved successfully");
    router.push(backHref);
    router.refresh();
  }

  async function handleReject(remarks: string) {
    setPending(true);
    let result: { error?: string } | undefined;
    switch (typeKey) {
      case "schedules":
        result = await rejectScheduleAction(id, remarks);
        break;
      case "timeConfig":
        result = await rejectScheduleTimeConfigAction(id, remarks);
        break;
      case "capabilities":
        result = await rejectCapabilityPackageAction(id, remarks);
        break;
      case "feeSetups":
        result = await rejectFeeSetupAsDean(id, remarks);
        break;
    }
    setPending(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Rejected");
    router.push(backHref);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Link href={backHref} className="text-sm text-[#6A0000] hover:underline">
        ← Back to Approvals
      </Link>

      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          {title}
        </h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {program != null && (
            <Badge variant="outline">Program: {program}</Badge>
          )}
          {schoolYear != null && (
            <Badge variant="outline">SY: {schoolYear}</Badge>
          )}
          {term != null && <Badge variant="outline">Term: {term}</Badge>}
          <Badge
            className={
              isPending
                ? "bg-amber-100 text-amber-800"
                : status === "approved"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
            }
          >
            {status === "pending_dean" ? "Submitted" : status}
          </Badge>
        </div>
      </div>

      {hasIssues && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">Issues</p>
              <p className="text-sm text-amber-800 mt-1">
                Please resolve conflicts or overrides before approving.
              </p>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-[#6A0000]">
            Details
          </CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>

      {isPending && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#6A0000]">
              Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button
              onClick={() => setApproveOpen(true)}
              disabled={hasIssues}
              className="bg-[#6A0000] hover:bg-[#6A0000]/90"
            >
              Approve
            </Button>
            <Button
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
              onClick={() => setRejectOpen(true)}
            >
              Reject
            </Button>
          </CardContent>
        </Card>
      )}

      <ApproveDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title="Approve"
        onConfirm={handleApprove}
        pending={pending}
      />
      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Reject"
        onConfirm={handleReject}
        pending={pending}
      />
    </div>
  );
}
