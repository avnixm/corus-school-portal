"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { approvePendingApplication, rejectPendingApplication } from "@/app/actions/pendingStudents";
import { CheckCircle, XCircle } from "lucide-react";

interface PendingApplicationActionsProps {
  applicationId: string;
  registrarProfileId: string;
}

export function PendingApplicationActions({
  applicationId,
  registrarProfileId,
}: PendingApplicationActionsProps) {
  const [isPending, startTransition] = useTransition();

  function handleApprove() {
    startTransition(() => {
      approvePendingApplication(applicationId, registrarProfileId);
    });
  }

  function handleReject() {
    startTransition(() => {
      rejectPendingApplication(applicationId, registrarProfileId);
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
    </div>
  );
}
