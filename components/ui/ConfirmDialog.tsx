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
import { AlertTriangle, Archive, Check, LucideIcon } from "lucide-react";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  itemLabel?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive" | "primary";
  icon?: LucideIcon;
  onConfirm: () => void | Promise<void>;
  pending?: boolean;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  itemLabel,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  icon: Icon = AlertTriangle,
  onConfirm,
  pending = false,
}: ConfirmDialogProps) {
  async function handleConfirm() {
    await onConfirm();
    onOpenChange(false);
  }

  const iconBg =
    variant === "destructive"
      ? "bg-red-100"
      : variant === "primary"
        ? "bg-[#6A0000]/10"
        : "bg-amber-100";
  const iconColor =
    variant === "destructive"
      ? "text-red-600"
      : variant === "primary"
        ? "text-[#6A0000]"
        : "text-amber-600";
  const buttonClass =
    variant === "destructive"
      ? "border-red-300 bg-red-600 text-white hover:bg-red-700"
      : variant === "primary"
        ? "bg-[#6A0000] text-white hover:bg-[#4A0000]"
        : "bg-neutral-900 text-white hover:bg-neutral-800";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showClose={!pending}>
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg}`}
            >
              <Icon className={`h-5 w-5 ${iconColor}`} />
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
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={pending}
            className={buttonClass}
          >
            {pending ? "Please wait…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
