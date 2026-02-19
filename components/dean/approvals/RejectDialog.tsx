// path: components/dean/approvals/RejectDialog.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onConfirm: (remarks: string) => void | Promise<void>;
  pending?: boolean;
}

export function RejectDialog({
  open,
  onOpenChange,
  title = "Reject",
  description = "Please provide a reason for rejection.",
  onConfirm,
  pending = false,
}: RejectDialogProps) {
  const [remarks, setRemarks] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!remarks.trim()) return;
    await onConfirm(remarks.trim());
    setRemarks("");
    onOpenChange(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) setRemarks("");
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="reject-remarks">Remarks *</Label>
            <Textarea
              id="reject-remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Reason for rejection"
              required
              rows={3}
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
              disabled={pending || !remarks.trim()}
            >
              {pending ? "Rejecting…" : "Reject"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
