"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { voidPaymentAction } from "./actions";

export function VoidPaymentButton({
  paymentId,
  amount,
  disabled,
}: {
  paymentId: string;
  amount: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleConfirm() {
    startTransition(async () => {
      const result = await voidPaymentAction(paymentId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Payment voided");
      setConfirmOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="border-red-300 text-red-700 hover:bg-red-50"
        onClick={() => setConfirmOpen(true)}
        disabled={pending || disabled}
      >
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Void
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleConfirm}
        title="Void Payment?"
        description={`This will void the payment of ₱${parseFloat(amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}. The amount will be added back to the student's balance.`}
        confirmText="Void Payment"
        variant="default"
        pending={pending}
      />
    </>
  );
}
