"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  approveSubmissionAction,
  approveAndReleaseAction,
  releaseSubmissionAction,
} from "./actions";
import { Check, CheckCheck, Unlock } from "lucide-react";
import { useRouter } from "next/navigation";

export function GradeRowActions({
  submissionId,
  status,
}: {
  submissionId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const run = async (fn: () => Promise<{ error: string | null }>) => {
    setPending(true);
    try {
      const result = await fn();
      if (!result.error) {
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  };

  if (status === "submitted") {
    return (
      <div className="flex gap-1 justify-end">
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1 border-blue-600 text-blue-700 hover:bg-blue-50"
          disabled={pending}
          onClick={() => run(() => approveSubmissionAction(submissionId))}
        >
          <Check className="h-3 w-3" />
          Approve
        </Button>
        <Button
          size="sm"
          className="h-7 gap-1 bg-[#6A0000] hover:bg-[#6A0000]/90"
          disabled={pending}
          onClick={() => run(() => approveAndReleaseAction(submissionId))}
        >
          <CheckCheck className="h-3 w-3" />
          Approve & Release
        </Button>
      </div>
    );
  }

  if (status === "approved") {
    return (
      <div className="flex justify-end">
        <Button
          size="sm"
          className="h-7 gap-1 bg-[#6A0000] hover:bg-[#6A0000]/90"
          disabled={pending}
          onClick={() => run(() => releaseSubmissionAction(submissionId))}
        >
          <Unlock className="h-3 w-3" />
          Release
        </Button>
      </div>
    );
  }

  return null;
}
