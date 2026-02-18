"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { submitScheduleTimeConfigAction } from "./actions";

export function SubmitToDeanButton({ configId }: { configId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleSubmit() {
    startTransition(async () => {
      const result = await submitScheduleTimeConfigAction(configId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Submitted to Dean for approval");
      setConfirmOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setConfirmOpen(true)}
        disabled={pending}
      >
        Submit to Dean
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Time Configuration?</DialogTitle>
            <DialogDescription>
              This will send the time configuration to the Dean for review and approval.
              You won't be able to edit it until the Dean responds.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={pending}>
              {pending ? "Submitting…" : "Submit to Dean"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
