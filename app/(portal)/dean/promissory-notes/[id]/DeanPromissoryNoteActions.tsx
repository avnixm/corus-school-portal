"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/components/ui/loading-button";
import { toast } from "sonner";
import { approvePromissoryNoteAction, rejectPromissoryNoteAction } from "../actions";

export function DeanPromissoryNoteActions({ noteId }: { noteId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [remarks, setRemarks] = useState("");

  function handleApprove() {
    startTransition(async () => {
      const result = await approvePromissoryNoteAction(noteId, remarks || null);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Promissory note approved.");
      router.refresh();
    });
  }

  function handleReject() {
    startTransition(async () => {
      const result = await rejectPromissoryNoteAction(noteId, remarks || null);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Promissory note rejected.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 rounded-xl border bg-white p-4">
      <Label htmlFor="deanRemarks">Remarks (optional)</Label>
      <Textarea
        id="deanRemarks"
        rows={2}
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
        placeholder="Optional remarks for approval or rejection"
        className="mt-1"
      />
      <div className="flex flex-wrap gap-2">
        <LoadingButton onClick={handleApprove} pending={pending}>
          Approve
        </LoadingButton>
        <Button
          variant="outline"
          className="border-red-600 text-red-600 hover:bg-red-50"
          onClick={handleReject}
          disabled={pending}
        >
          Reject
        </Button>
      </div>
    </div>
  );
}
