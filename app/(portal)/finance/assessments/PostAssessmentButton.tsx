"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoadingButton } from "@/components/ui/loading-button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { postAssessmentAction } from "./actions";
import { toast } from "sonner";

export function PostAssessmentButton({ assessmentId }: { assessmentId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleConfirm() {
    startTransition(async () => {
      const result = await postAssessmentAction(assessmentId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Assessment posted successfully");
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
        pending={pending}
      >
        Post
      </LoadingButton>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleConfirm}
        title="Post Assessment?"
        description="This will create ledger charges for the student. This action cannot be undone."
        confirmText="Post Assessment"
        pending={pending}
      />
    </>
  );
}
