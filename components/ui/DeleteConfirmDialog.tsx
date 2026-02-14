"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

type DeleteConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  itemLabel?: string;
  onConfirm: () => void | Promise<void>;
  pending?: boolean;
};

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title = "Remove item",
  description = "This action cannot be undone.",
  itemLabel,
  onConfirm,
  pending = false,
}: DeleteConfirmDialogProps) {
  async function handleConfirm() {
    await onConfirm();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showClose={!pending}>
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-[#6A0000]">{title}</DialogTitle>
              <DialogDescription className="mt-1">
                {itemLabel && (
                  <span className="block font-medium text-neutral-800">
                    &ldquo;{itemLabel}&rdquo;
                  </span>
                )}
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={pending}
            className="border-red-300 bg-red-600 text-white hover:bg-red-700"
          >
            {pending ? "Removing…" : "Remove"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
