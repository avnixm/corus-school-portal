"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, ExternalLink, FileText, FileQuestion } from "lucide-react";
import { verifySubmissionAction, rejectSubmissionAction } from "@/app/(portal)/registrar/requirements/actions";
import type { ApplicableRequirement } from "@/lib/requirements/getApplicableRequirements";

type Props = {
  enrollmentId: string;
  applicable: ApplicableRequirement[];
};

const STATUS_STYLE: Record<string, string> = {
  missing: "bg-neutral-100 text-neutral-700",
  submitted: "bg-amber-100 text-amber-800",
  verified: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export function EnrollmentReviewContent({ enrollmentId, applicable }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approvalMessage, setApprovalMessage] = useState("");

  async function handleViewFile(fileId: string) {
    const res = await fetch(`/api/uploads/requirements/${fileId}`);
    const data = await res.json();
    if (data?.url) window.open(data.url, "_blank");
    else if (data?.message) alert(data.message);
    else alert("Could not open file.");
  }

  function handleApprove(submissionId: string) {
    if (approvingId !== submissionId) {
      setApprovingId(submissionId);
      setApprovalMessage("");
      return;
    }
    startTransition(async () => {
      await verifySubmissionAction(submissionId, approvalMessage || undefined);
      setApprovingId(null);
      setApprovalMessage("");
      router.refresh();
    });
  }

  function handleReject(submissionId: string) {
    if (rejectingId !== submissionId) {
      setRejectingId(submissionId);
      setRemarks("");
      return;
    }
    startTransition(async () => {
      await rejectSubmissionAction(submissionId, remarks);
      setRejectingId(null);
      setRemarks("");
      router.refresh();
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
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[a.submission.status] ?? "bg-neutral-100 text-neutral-800"}`}
                  >
                    {a.submission.status}
                  </span>
                </div>
                {a.submission.status === "submitted" && (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                    {approvingId === a.submission.id ? (
                      <div className="flex flex-col gap-2 rounded-lg border border-green-200 bg-green-50/50 p-2">
                        <Label className="text-xs font-medium text-green-800">
                          Message to student (optional)
                        </Label>
                        <Input
                          value={approvalMessage}
                          onChange={(e) => setApprovalMessage(e.target.value)}
                          placeholder="e.g. Document accepted."
                          className="h-8 text-sm"
                        />
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            className="gap-1 bg-green-600 hover:bg-green-700"
                            onClick={() => handleApprove(a.submission.id)}
                            disabled={isPending}
                          >
                            <CheckCircle className="h-3 w-3" />
                            Approve
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setApprovingId(null)} disabled={isPending}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : rejectingId === a.submission.id ? (
                      <div className="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50/50 p-2">
                        <Label className="text-xs font-medium text-red-800">
                          Reason for rejection (student will see this)
                        </Label>
                        <Input
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="e.g. Document is blurry; please upload a clearer scan."
                          className="h-8 text-sm"
                        />
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-600 text-red-600"
                            onClick={() => handleReject(a.submission.id)}
                            disabled={isPending || !remarks.trim()}
                          >
                            Reject & send message
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setRejectingId(null)} disabled={isPending}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="gap-1 bg-green-600 hover:bg-green-700"
                          onClick={() => setApprovingId(a.submission.id)}
                          disabled={isPending}
                        >
                          <CheckCircle className="h-3 w-3" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 border-red-600 text-red-600"
                          onClick={() => setRejectingId(a.submission.id)}
                          disabled={isPending}
                        >
                          <XCircle className="h-3 w-3" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {a.submission.registrarRemarks && (
                <p className="mt-1 text-xs text-red-700">Remarks: {a.submission.registrarRemarks}</p>
              )}
              {/* Placeholder area: always show where uploaded docs appear */}
              <div className="mt-2 rounded-lg border border-neutral-200 bg-neutral-50/50 p-3 min-h-[52px]">
                {a.files.length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {a.files.map((f) => (
                      <li key={f.id}>
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
    </div>
  );
}
