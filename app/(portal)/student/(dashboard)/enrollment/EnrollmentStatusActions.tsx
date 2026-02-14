"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { submitEnrollment, cancelEnrollment } from "./actions";

export function EnrollmentStatusActions({
  enrollmentId,
  canSubmit,
  policyMessage,
}: {
  enrollmentId: string;
  canSubmit: boolean;
  policyMessage?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [cancelPending, setCancelPending] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      const result = await submitEnrollment(enrollmentId);
      if (result?.error) alert(result.error);
      else router.refresh();
    });
  }

  function handleCancel() {
    if (!confirm("Cancel this enrollment? You can start a new one for this term if needed.")) return;
    setCancelPending(async () => {
      const result = await cancelEnrollment(enrollmentId);
      if (result?.error) alert(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        onClick={handleSubmit}
        disabled={isPending || !canSubmit}
        className="bg-[#6A0000] hover:bg-[#6A0000]/90"
      >
        {isPending ? "Submitting…" : "Submit for approval"}
      </Button>
      <Button variant="outline" onClick={handleCancel} disabled={cancelPending}>
        {cancelPending ? "Cancelling…" : "Cancel enrollment"}
      </Button>
      {!canSubmit && policyMessage && (
        <p className="w-full text-sm text-amber-700">{policyMessage}</p>
      )}
    </div>
  );
}
