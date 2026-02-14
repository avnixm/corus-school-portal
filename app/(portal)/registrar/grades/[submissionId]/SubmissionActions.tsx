// path: app/(portal)/registrar/grades/[submissionId]/SubmissionActions.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

import {
  returnSubmissionAction,
  approveSubmissionAction,
  releaseSubmissionAction,
  approveAndReleaseAction,
} from "../actions";
import { Undo2, Check, Unlock, CheckCheck } from "lucide-react";

import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function SubmissionActions({
  submissionId,
  status,
}: {
  submissionId: string;
  status: string;
}) {
  const [returnRemarks, setReturnRemarks] = useState("");
  const [returnOpen, setReturnOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const run = async (
    label: string,
    fn: () => Promise<{ error: string | null }>
  ) => {
    setMessage(null);
    setPending(label);
    try {
      const result = await fn();
      if (result.error) setMessage({ type: "error", text: result.error });
      else {
        setMessage({ type: "success", text: "Done." });
        setReturnOpen(false);
        window.location.reload();
      }
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="space-y-2">
      {message && (
        <p
          className={`rounded-md px-3 py-2 text-sm ${
            message.type === "error" ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"
          }`}
        >
          {message.text}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {status === "submitted" && (
          <>
            <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-red-500 text-red-700 hover:bg-red-50"
                  disabled={!!pending}
                >
                  <Undo2 className="mr-1 h-4 w-4" />
                  Return to teacher
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Return to teacher</DialogTitle>
                  <DialogDescription>
                    Add remarks for the teacher. Status will be set to &quot;returned&quot; so they can edit again.
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  placeholder="Remarks (optional)"
                  value={returnRemarks}
                  onChange={(e) => setReturnRemarks(e.target.value)}
                  rows={3}
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setReturnOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-red-600 text-white hover:bg-red-700"
                    disabled={pending === "return"}
                    onClick={() =>
                      run("return", () =>
                        returnSubmissionAction(submissionId, returnRemarks)
                      )
                    }
                  >
                    {pending === "return" ? "Returning…" : "Return"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              className="bg-blue-600 text-white hover:bg-blue-700"
              disabled={!!pending}
              onClick={() =>
                run("approve", () => approveSubmissionAction(submissionId))
              }
            >
              <Check className="mr-1 h-4 w-4" />
              {pending === "approve" ? "Approving…" : "Approve"}
            </Button>
            <Button
              className="bg-[#6A0000] text-white hover:bg-[#6A0000]/90"
              disabled={!!pending}
              onClick={() =>
                run("approve-release", () =>
                  approveAndReleaseAction(submissionId)
                )
              }
            >
              <CheckCheck className="mr-1 h-4 w-4" />
              {pending === "approve-release" ? "Processing…" : "Approve & release"}
            </Button>
          </>
        )}
        {status === "approved" && (
          <Button
            className="bg-[#6A0000] text-white hover:bg-[#6A0000]/90"
            disabled={!!pending}
            onClick={() =>
              run("release", () => releaseSubmissionAction(submissionId))
            }
          >
            <Unlock className="mr-1 h-4 w-4" />
            {pending === "release" ? "Releasing…" : "Release"}
          </Button>
        )}
        {(status === "released" || status === "draft" || status === "returned") && (
          <span className="text-sm text-neutral-600">
            {status === "released"
              ? "Grades are released to students."
              : status === "draft"
              ? "Teacher has not submitted yet."
              : "Returned to teacher for edits."}
          </span>
        )}
      </div>
    </div>
  );
}
