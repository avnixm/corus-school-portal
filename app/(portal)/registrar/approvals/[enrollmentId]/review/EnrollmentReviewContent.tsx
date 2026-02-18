"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, ExternalLink, FileText, FileQuestion, Send, Expand } from "lucide-react";
import { verifySubmissionAction, rejectSubmissionAction } from "@/app/(portal)/registrar/requirements/actions";
import { createRequirementRequestAction } from "@/app/(portal)/registrar/approvals/actions";
import type { ApplicableRequirement } from "@/lib/requirements/getApplicableRequirements";
import { formatStatusForDisplay } from "@/lib/formatStatus";

type Props = {
  enrollmentId: string;
  applicable: ApplicableRequirement[];
  pendingRequestSubmissionIds: string[];
};

const STATUS_STYLE: Record<string, string> = {
  missing: "bg-neutral-100 text-neutral-700",
  submitted: "bg-amber-100 text-amber-800",
  verified: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export function EnrollmentReviewContent({ enrollmentId, applicable, pendingRequestSubmissionIds }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [remarks, setRemarks] = useState("");
  const [approvalMessage, setApprovalMessage] = useState("");
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [approveDialog, setApproveDialog] = useState<{ submissionId: string; requirementName: string } | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ submissionId: string; requirementName: string } | null>(null);
  const [fullViewFile, setFullViewFile] = useState<{ id: string; fileName: string; fileType: string } | null>(null);
  const [fullViewUrl, setFullViewUrl] = useState<string | null>(null);
  const [fullViewError, setFullViewError] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const pendingSet = new Set(pendingRequestSubmissionIds);

  const openFullView = useCallback(async (file: { id: string; fileName: string; fileType: string }) => {
    setFullViewFile(file);
    setFullViewUrl(null);
    setFullViewError(null);
    try {
      const res = await fetch(`/api/uploads/requirements/${file.id}`, { credentials: "include" });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const message = errorData?.message || "Could not load file.";
        setFullViewError(message);
        toast.error(message);
        return;
      }
      const data = await res.json();
      const url = data?.url;
      if (!url) {
        const message = data?.message || "Could not load file.";
        setFullViewError(message);
        toast.error(message);
        return;
      }
      // Load view URL with credentials so session is sent; use blob URL so img/iframe can display it
      const viewRes = await fetch(url, { credentials: "include" });
      if (!viewRes.ok) {
        const message =
          viewRes.status === 404
            ? "File not available. It may have been uploaded before storage was enabled—ask the student to re-upload."
            : "Could not load file for viewing.";
        setFullViewError(message);
        toast.error(message);
        return;
      }
      const blob = await viewRes.blob();
      const blobUrl = URL.createObjectURL(blob);
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = blobUrl;
      setFullViewUrl(blobUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load file.";
      setFullViewError(message);
      toast.error(message);
    }
  }, []);

  function closeFullView() {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setFullViewFile(null);
    setFullViewUrl(null);
    setFullViewError(null);
  }

  async function handleViewFile(fileId: string) {
    try {
      const res = await fetch(`/api/uploads/requirements/${fileId}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const message = errorData?.message || "Could not open file.";
        toast.error(message);
        return;
      }
      const data = await res.json();
      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        const message = data?.message || "Could not open file.";
        toast.error(message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to open file.";
      toast.error(message);
    }
  }

  function submitApprove() {
    if (!approveDialog) return;
    startTransition(async () => {
      try {
        await verifySubmissionAction(approveDialog.submissionId, approvalMessage || undefined);
        setApproveDialog(null);
        setApprovalMessage("");
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to approve submission.";
        toast.error(message);
      }
    });
  }

  function submitReject() {
    if (!rejectDialog || !remarks.trim()) return;
    startTransition(async () => {
      try {
        await rejectSubmissionAction(rejectDialog.submissionId, remarks);
        setRejectDialog(null);
        setRemarks("");
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to reject submission.";
        toast.error(message);
      }
    });
  }

  function handleRequestForm(submissionId: string) {
    if (requestingId !== submissionId) {
      setRequestingId(submissionId);
      setRequestMessage("");
      return;
    }
    startTransition(async () => {
      try {
        const result = await createRequirementRequestAction(enrollmentId, submissionId, requestMessage);
        setRequestingId(null);
        setRequestMessage("");
        if (result?.error) {
          toast.error(result.error);
        } else {
          router.refresh();
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to send request.";
        toast.error(message);
        setRequestingId(null);
        setRequestMessage("");
      }
    });
  }

  const required = applicable.filter((a) => a.rule.isRequired);

  return (
    <div className="space-y-4">
      {required.length === 0 ? (
        <p className="text-sm text-neutral-600">No requirements apply to this enrollment.</p>
      ) : (
        <ul className="divide-y divide-neutral-200">
          {required.map((a) => (
            <li key={a.submission.id} className="py-3 first:pt-0">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-xs text-neutral-500">{a.requirement.code}</span>
                  <span className="ml-1 font-medium text-neutral-900">{a.requirement.name}</span>
                  {(a.submission.markAsToFollow ?? false) && (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      To follow
                    </span>
                  )}
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[a.submission.status] ?? "bg-neutral-100 text-neutral-800"}`}
                  >
                    {formatStatusForDisplay(a.submission.status)}
                  </span>
                </div>
                {a.submission.status === "submitted" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="gap-1 bg-green-600 hover:bg-green-700"
                      onClick={() => setApproveDialog({ submissionId: a.submission.id, requirementName: a.requirement.name })}
                      disabled={isPending}
                    >
                      <CheckCircle className="h-3 w-3" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 border-red-600 text-red-600"
                      onClick={() => setRejectDialog({ submissionId: a.submission.id, requirementName: a.requirement.name })}
                      disabled={isPending}
                    >
                      <XCircle className="h-3 w-3" />
                      Reject
                    </Button>
                  </div>
                )}
                {(a.submission.status === "missing" || (a.submission.markAsToFollow ?? false)) &&
                  !pendingSet.has(a.submission.id) && (
                  <div className="mt-2">
                    {requestingId === a.submission.id ? (
                      <div className="flex flex-col gap-2 rounded-lg border border-blue-200 bg-blue-50/50 p-2">
                        <Label className="text-xs font-medium text-blue-800">
                          Message to student (optional)
                        </Label>
                        <Input
                          value={requestMessage}
                          onChange={(e) => setRequestMessage(e.target.value)}
                          placeholder="e.g. Please submit your Birth Certificate by next week."
                          className="h-8 text-sm"
                        />
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            className="gap-1 bg-blue-600 hover:bg-blue-700"
                            onClick={() => handleRequestForm(a.submission.id)}
                            disabled={isPending}
                          >
                            <Send className="h-3 w-3" />
                            Send request
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setRequestingId(null)} disabled={isPending}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 border-blue-600 text-blue-700 hover:bg-blue-50"
                        onClick={() => setRequestingId(a.submission.id)}
                        disabled={isPending}
                      >
                        <Send className="h-3 w-3" />
                        Request form
                      </Button>
                    )}
                  </div>
                )}
                {pendingSet.has(a.submission.id) && (a.submission.status === "missing" || (a.submission.markAsToFollow ?? false)) && (
                  <p className="mt-1 text-xs text-blue-700">Request sent to student.</p>
                )}
              </div>
              {a.submission.registrarRemarks && (
                <p className="mt-1 text-xs text-red-700">Remarks: {a.submission.registrarRemarks}</p>
              )}
              {/* Uploaded docs: View full (modal) + Open in new tab */}
              <div className="mt-2 rounded-lg border border-neutral-200 bg-neutral-50/50 p-3 min-h-[52px]">
                {a.files.length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {a.files.map((f) => (
                      <li key={f.id} className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openFullView({ id: f.id, fileName: f.fileName, fileType: f.fileType })}
                          className="inline-flex items-center gap-1.5 rounded border border-[#6A0000]/40 bg-white px-2.5 py-1.5 text-sm font-medium text-[#6A0000] hover:bg-[#6A0000]/5"
                        >
                          <Expand className="h-4 w-4" />
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleViewFile(f.id)}
                          className="inline-flex items-center gap-1.5 rounded border border-neutral-200 bg-white px-2.5 py-1.5 text-sm text-neutral-900 hover:bg-neutral-50 hover:border-[#6A0000]/30"
                        >
                          <FileText className="h-4 w-4 text-[#6A0000]" />
                          {f.fileName}
                          <ExternalLink className="h-3.5 w-3.5 text-neutral-500" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex items-center gap-2 text-neutral-500">
                    <FileQuestion className="h-5 w-5 shrink-0" />
                    <span className="text-sm">
                      {a.submission.status === "missing"
                        ? "No file uploaded yet"
                        : "No file uploaded"}
                    </span>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Approve document pop-up */}
      <Dialog
        open={!!approveDialog}
        onOpenChange={(open) => {
          if (!open) {
            setApproveDialog(null);
            setApprovalMessage("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#6A0000]">
              Approve document
            </DialogTitle>
            <DialogDescription className="sr-only">
              Optionally add a message to the student, then confirm approval.
            </DialogDescription>
          </DialogHeader>
          {approveDialog && (
            <>
              <p className="text-sm text-neutral-600">
                {approveDialog.requirementName}
              </p>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-neutral-700">
                  Message to student (optional)
                </Label>
                <Input
                  value={approvalMessage}
                  onChange={(e) => setApprovalMessage(e.target.value)}
                  placeholder="e.g. Document accepted."
                  className="text-sm"
                />
              </div>
            </>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setApproveDialog(null)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              className="gap-1 bg-green-600 hover:bg-green-700"
              onClick={submitApprove}
              disabled={isPending}
            >
              <CheckCircle className="h-4 w-4" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject document pop-up */}
      <Dialog
        open={!!rejectDialog}
        onOpenChange={(open) => {
          if (!open) {
            setRejectDialog(null);
            setRemarks("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#6A0000]">
              Reject document
            </DialogTitle>
            <DialogDescription className="sr-only">
              Enter a reason for rejection that the student will see.
            </DialogDescription>
          </DialogHeader>
          {rejectDialog && (
            <>
              <p className="text-sm text-neutral-600">
                {rejectDialog.requirementName}
              </p>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-red-800">
                  Reason for rejection (student will see this)
                </Label>
                <Input
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Document is blurry; please upload a clearer scan."
                  className="text-sm"
                />
              </div>
            </>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRejectDialog(null)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50"
              onClick={submitReject}
              disabled={isPending || !remarks.trim()}
            >
              <XCircle className="h-4 w-4" />
              Reject & send message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full-size view dialog for images/documents */}
      <Dialog open={!!fullViewFile} onOpenChange={(open) => !open && closeFullView()}>
        <DialogContent className="max-h-[90vh] max-w-[95vw] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="truncate pr-8 text-[#6A0000]">
              {fullViewFile?.fileName ?? "Document"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Full-size view of the uploaded document.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-[50vh] flex-1 overflow-auto rounded border bg-neutral-100 flex items-center justify-center p-2">
            {fullViewError && (
              <p className="text-sm text-red-600">{fullViewError}</p>
            )}
            {fullViewUrl && fullViewFile && (
              <>
                {fullViewFile.fileType.startsWith("image/") ? (
                  <img
                    src={fullViewUrl}
                    alt={fullViewFile.fileName}
                    className="max-h-[75vh] w-auto max-w-full object-contain"
                  />
                ) : fullViewFile.fileType === "application/pdf" || fullViewFile.fileType.toLowerCase().includes("pdf") ? (
                  <iframe
                    src={fullViewUrl}
                    title={fullViewFile.fileName}
                    className="h-[75vh] w-full min-w-[280px] rounded border-0 bg-white"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <p className="text-sm text-neutral-600">Preview not available for this file type.</p>
                    <a
                      href={fullViewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium hover:bg-neutral-50"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open in new tab
                    </a>
                  </div>
                )}
              </>
            )}
            {fullViewFile && !fullViewUrl && !fullViewError && (
              <p className="text-sm text-neutral-500">Loading…</p>
            )}
          </div>
          {fullViewUrl && (
            <div className="flex justify-end border-t pt-2">
              <a
                href={fullViewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium hover:bg-neutral-50"
              >
                <ExternalLink className="h-4 w-4" />
                Open in new tab
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
