"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { approveScheduleTimeConfigAction, rejectScheduleTimeConfigAction } from "./actions";

export function ApproveRejectButtons({ configId }: { configId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [remarks, setRemarks] = useState("");

  function handleApprove() {
    startTransition(async () => {
      const result = await approveScheduleTimeConfigAction(configId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Time configuration approved");
      setApproveOpen(false);
      router.refresh();
    });
  }

  function handleReject(e: React.FormEvent) {
    e.preventDefault();
    if (!remarks.trim()) {
      toast.error("Remarks required for rejection");
      return;
    }
    startTransition(async () => {
      const result = await rejectScheduleTimeConfigAction(configId, remarks);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Time configuration rejected");
      setRejectOpen(false);
      setRemarks("");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => setApproveOpen(true)}
        disabled={pending}
        className="gap-1 text-green-700 hover:bg-green-50"
      >
        <Check className="h-3 w-3" />
        Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setRejectOpen(true)}
        disabled={pending}
        className="gap-1 text-red-700 hover:bg-red-50"
      >
        <X className="h-3 w-3" />
        Reject
      </Button>

      {/* Approve Confirmation Dialog */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Time Configuration?</DialogTitle>
            <DialogDescription>
              This will activate the time configuration for the program. 
              Registrars will use these time slots when creating class schedules.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={pending}>
              {pending ? "Approving…" : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog with Remarks */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Time Configuration</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this configuration.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReject} className="space-y-4">
            <div>
              <Label htmlFor="remarks">Remarks *</Label>
              <Input
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Reason for rejection"
                required
                className="mt-1"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRejectOpen(false);
                  setRemarks("");
                }}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Rejecting…" : "Reject"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
