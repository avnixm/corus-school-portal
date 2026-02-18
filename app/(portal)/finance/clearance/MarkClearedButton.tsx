"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoadingButton } from "@/components/ui/loading-button";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { markClearedAction } from "./actions";

export function MarkClearedButton({
  enrollmentId,
  disabled,
}: {
  enrollmentId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleConfirm() {
    startTransition(async () => {
      const result = await markClearedAction(enrollmentId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Enrollment marked as cleared");
      setConfirmOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <LoadingButton
        variant="outline"
        size="sm"
        onClick={() => setConfirmOpen(true)}
        disabled={disabled}
        pending={pending}
      >
        Mark Cleared
      </LoadingButton>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleConfirm}
        title="Mark as Cleared?"
        description="This will mark the enrollment as financially cleared. The student will be able to proceed with registration."
        confirmText="Mark Cleared"
        pending={pending}
      />
    </>
  );
}
