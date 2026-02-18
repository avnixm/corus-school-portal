"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "./FileDropzone";
import { AlertCircle, RefreshCw, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatStatusForDisplay } from "@/lib/formatStatus";

export type RequirementItem = {
  requirement: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    instructions: string | null;
    allowedFileTypes: string[];
    maxFiles: number;
  };
  rule: { id: string; isRequired: boolean; sortOrder: number };
  submission: {
    id: string;
    status: "missing" | "submitted" | "verified" | "rejected";
    submittedAt: Date | null;
    verifiedAt: Date | null;
    registrarRemarks: string | null;
    markAsToFollow?: boolean;
  };
  files: { id: string; fileName: string; fileType: string; fileSize: number; storageKey: string }[];
};

interface RequirementCardProps {
  item: RequirementItem;
  onUpload: (submissionId: string, file: File) => Promise<void>;
  onRemoveFile: (fileId: string) => Promise<void>;
  onSubmit: (submissionId: string) => Promise<void>;
  onResubmit: (submissionId: string) => Promise<void>;
  onMarkAsToFollow?: (submissionId: string, value: boolean) => Promise<void>;
  hasPendingRequest?: boolean;
  readOnly?: boolean;
}

const statusVariant: Record<string, "default" | "outline"> = {
  missing: "outline",
  submitted: "outline",
  verified: "default",
  rejected: "outline",
};

export function RequirementCard({
  item,
  onUpload,
  onRemoveFile,
  onSubmit,
  onResubmit,
  onMarkAsToFollow,
  hasPendingRequest,
  readOnly,
}: RequirementCardProps) {
  const [uploading, setUploading] = React.useState(false);
  const [actionPending, setActionPending] = React.useState(false);
  const [toFollowPending, setToFollowPending] = React.useState(false);
  const { requirement, submission, files } = item;
  const markAsToFollow = submission.markAsToFollow ?? false;
  const canEdit = submission.status !== "verified" && !readOnly;
  const atLimit = requirement.maxFiles > 0 && files.length >= requirement.maxFiles;

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      await onUpload(submission.id, file);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    setActionPending(true);
    try {
      await onSubmit(submission.id);
    } finally {
      setActionPending(false);
    }
  };

  const handleResubmit = async () => {
    setActionPending(true);
    try {
      await onResubmit(submission.id);
    } finally {
      setActionPending(false);
    }
  };

  return (
    <Card className="border-neutral-200">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold text-[#6A0000]">{requirement.name}</h3>
            {requirement.description && (
              <p className="text-sm text-neutral-600">{requirement.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {markAsToFollow && (
              <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300">
                To follow
              </Badge>
            )}
            <Badge variant={statusVariant[submission.status] ?? "outline"}>
              {formatStatusForDisplay(submission.status)}
            </Badge>
          </div>
        </div>
        {requirement.instructions && (
          <p className="text-sm text-neutral-700">{requirement.instructions}</p>
        )}
        {requirement.allowedFileTypes?.length > 0 && (
          <p className="text-xs text-neutral-500">
            Allowed: {requirement.allowedFileTypes.join(", ")} • Max {requirement.maxFiles} file(s)
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {submission.status === "rejected" && submission.registrarRemarks && (
          <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <div>
              <span className="font-medium">Registrar feedback: </span>
              {submission.registrarRemarks}
            </div>
          </div>
        )}
        {submission.status === "verified" && submission.registrarRemarks && (
          <div className="flex gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            <div>
              <span className="font-medium">Registrar: </span>
              {submission.registrarRemarks}
            </div>
          </div>
        )}

        {hasPendingRequest && (
          <div className="flex gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>Registrar requested this document. Please upload below.</p>
          </div>
        )}

        {markAsToFollow && submission.status === "missing" && (
          <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <Clock className="h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">You marked this as &quot;To follow&quot;</p>
              <p className="mt-0.5 text-amber-700">
                You can upload this later; the registrar may send a request for this document.
              </p>
              {onMarkAsToFollow && canEdit && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 border-amber-400 text-amber-800 hover:bg-amber-100"
                  disabled={toFollowPending}
                  onClick={async () => {
                    setToFollowPending(true);
                    try {
                      await onMarkAsToFollow(submission.id, false);
                    } finally {
                      setToFollowPending(false);
                    }
                  }}
                >
                  Unmark to follow (I&apos;ll upload now)
                </Button>
              )}
            </div>
          </div>
        )}

        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-1 rounded-md border bg-neutral-50 px-2 py-1 text-sm"
              >
                <span className="truncate max-w-[160px]">{f.fileName}</span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => onRemoveFile(f.id)}
                    className="rounded p-0.5 hover:bg-neutral-200"
                    aria-label="Remove file"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {canEdit && (
          <>
            {!atLimit && (
              <FileDropzone
                onFileSelect={handleFile}
                accept={requirement.allowedFileTypes?.length ? requirement.allowedFileTypes.map((t) => `.${t}`).join(",") : undefined}
                disabled={actionPending}
                isUploading={uploading}
              />
            )}
            <div className="flex flex-wrap gap-2">
              {submission.status === "missing" && !markAsToFollow && onMarkAsToFollow && (
                <div className="w-full">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1 border-amber-400 text-amber-800 hover:bg-amber-50"
                    disabled={toFollowPending}
                    onClick={async () => {
                      setToFollowPending(true);
                      try {
                        await onMarkAsToFollow(submission.id, true);
                      } finally {
                        setToFollowPending(false);
                      }
                    }}
                  >
                    <Clock className="h-3 w-3" />
                    Mark as To follow (I&apos;ll submit later)
                  </Button>
                  <p className="mt-1.5 text-xs text-amber-700">
                    You can submit your enrollment without this file, but you must upload and verify it later to access Schedule, Billing, and Grades.
                  </p>
                </div>
              )}
              {submission.status === "missing" && files.length > 0 && (
                <Button
                  size="sm"
                  className="bg-[#6A0000] hover:bg-[#6A0000]/90"
                  onClick={handleSubmit}
                  disabled={actionPending || files.length === 0}
                >
                  Submit for verification
                </Button>
              )}
              {submission.status === "rejected" && (
                <Button
                  size="sm"
                  className="gap-1 bg-[#6A0000] hover:bg-[#6A0000]/90"
                  onClick={handleResubmit}
                  disabled={actionPending}
                >
                  <RefreshCw className="h-3 w-3" />
                  Resubmit
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
