"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LoadingButton } from "@/components/ui/loading-button";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  signClearanceWithPromissoryNoteAction,
  markClearedAction,
  clearClearanceItemAction,
} from "./actions";

export function FinanceBlockedRowActions({
  enrollmentId,
  periodId,
  itemId,
  hasHold,
  approvedPn,
  existingPn,
}: {
  enrollmentId: string;
  periodId: string;
  itemId: string | null;
  hasHold: boolean;
  approvedPn: { id: string; refNo: string } | null;
  existingPn: { id: string; status: string } | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleSignWithPn() {
    if (!approvedPn || !itemId) return;
    startTransition(async () => {
      const result = await signClearanceWithPromissoryNoteAction(itemId, approvedPn.id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Clearance signed with promissory note");
      setConfirmOpen(false);
      router.refresh();
    });
  }

  function handleMarkCleared() {
    const id = itemId;
    if (!id) return;
    startTransition(async () => {
      const cleared = await markClearedAction(enrollmentId);
      if ("error" in cleared) {
        toast.error(cleared.error);
        return;
      }
      const itemCleared = await clearClearanceItemAction(id);
      if ("error" in itemCleared) {
        toast.error(itemCleared.error);
        return;
      }
      toast.success("Marked as cleared");
      setConfirmOpen(false);
      router.refresh();
    });
  }

  if (approvedPn && itemId) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="text-xs text-neutral-600">
          Approved PN Ref #{approvedPn.refNo}
        </span>
        <Link
          href={`/finance/promissory-notes/${approvedPn.id}/print`}
          className="inline-flex items-center rounded-md border border-[#6A0000] bg-white px-2 py-1.5 text-xs font-medium text-[#6A0000] hover:bg-neutral-50"
        >
          Print PN
        </Link>
        <LoadingButton
          variant="outline"
          size="sm"
          onClick={() => setConfirmOpen(true)}
          pending={pending}
        >
          Sign clearance (with PN)
        </LoadingButton>
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          onConfirm={handleSignWithPn}
          title="Sign clearance with PN?"
          description="Confirm you have verified the approved promissory note and are signing the finance clearance."
          confirmText="Sign clearance (with PN)"
          pending={pending}
        />
      </div>
    );
  }

  const hasDraftOrSubmitted =
    existingPn && existingPn.status !== "approved";

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {hasDraftOrSubmitted ? (
        <Link
          href={`/finance/promissory-notes/${existingPn!.id}/print`}
          className="inline-flex items-center rounded-md border border-amber-600 bg-amber-50 px-2 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
        >
          View PN ({existingPn!.status === "draft" ? "Draft" : "Submitted"})
        </Link>
      ) : (
        <Link
          href={`/finance/clearance/${enrollmentId}/promissory-note/new?periodId=${periodId}`}
          className="inline-flex items-center rounded-md border border-[#6A0000] bg-white px-2 py-1.5 text-xs font-medium text-[#6A0000] hover:bg-neutral-50"
        >
          Create PN
        </Link>
      )}
      {itemId != null && (
        <>
          <LoadingButton
            variant="outline"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            disabled={hasHold}
            pending={pending}
          >
            Mark Cleared
          </LoadingButton>
          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            onConfirm={handleMarkCleared}
            title="Mark as Cleared?"
            description="Confirm that the student has paid and you are clearing the finance item."
            confirmText="Mark Cleared"
            pending={pending}
          />
        </>
      )}
    </div>
  );
}
