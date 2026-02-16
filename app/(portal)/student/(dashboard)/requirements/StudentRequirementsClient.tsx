"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { RequirementChecklist } from "@/components/requirements/RequirementChecklist";
import type { ApplicableRequirement } from "@/lib/requirements/getApplicableRequirements";
import {
  submitRequirement,
  resubmitRequirement,
  removeFile,
  markAsToFollowAction,
} from "./actions";

type SerializableItem = {
  requirement: ApplicableRequirement["requirement"];
  rule: ApplicableRequirement["rule"];
  submission: {
    id: string;
    status: ApplicableRequirement["submission"]["status"];
    submittedAt: string | null;
    verifiedAt: string | null;
    registrarRemarks: string | null;
    markAsToFollow?: boolean;
  };
  files: ApplicableRequirement["files"];
};

function toItem(s: SerializableItem): ApplicableRequirement {
  return {
    ...s,
    submission: {
      ...s.submission,
      submittedAt: s.submission.submittedAt ? new Date(s.submission.submittedAt) : null,
      verifiedAt: s.submission.verifiedAt ? new Date(s.submission.verifiedAt) : null,
      markAsToFollow: s.submission.markAsToFollow ?? false,
    },
  };
}

export function StudentRequirementsClient({
  items,
  enrollmentId,
  pendingRequestSubmissionIds = [],
}: {
  items: ApplicableRequirement[];
  enrollmentId: string | null;
  pendingRequestSubmissionIds?: string[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const serializable: SerializableItem[] = items.map((i) => ({
    requirement: i.requirement,
    rule: i.rule,
    submission: {
      id: i.submission.id,
      status: i.submission.status,
      submittedAt: i.submission.submittedAt?.toISOString() ?? null,
      verifiedAt: i.submission.verifiedAt?.toISOString() ?? null,
      registrarRemarks: i.submission.registrarRemarks,
      markAsToFollow: i.submission.markAsToFollow,
    },
    files: i.files,
  }));

  const [localItems, setLocalItems] = React.useState<SerializableItem[]>(serializable);

  React.useEffect(() => {
    setLocalItems(serializable);
  }, [JSON.stringify(serializable)]);

  const onUpload = async (submissionId: string, file: File) => {
    const formData = new FormData();
    formData.set("submissionId", submissionId);
    formData.set("file", file);
    const res = await fetch("/api/uploads/requirements", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Upload failed");
      throw new Error(data.error || "Upload failed");
    }
    toast.success("File uploaded successfully");
    startTransition(() => router.refresh());
  };

  const onRemoveFile = async (fileId: string) => {
    const result = await removeFile(fileId);
    if (result?.error) throw new Error(result.error);
    startTransition(() => router.refresh());
  };

  const onSubmit = async (submissionId: string) => {
    const result = await submitRequirement(submissionId);
    if (result?.error) {
      toast.error(result.error);
      throw new Error(result.error);
    }
    toast.success("Requirement submitted for verification");
    startTransition(() => router.refresh());
  };

  const onResubmit = async (submissionId: string) => {
    const result = await resubmitRequirement(submissionId);
    if (result?.error) {
      toast.error(result.error);
      throw new Error(result.error);
    }
    toast.success("Requirement resubmitted for verification");
    startTransition(() => router.refresh());
  };

  const onMarkAsToFollow = async (submissionId: string, value: boolean) => {
    const result = await markAsToFollowAction(submissionId, value);
    if (result?.error) throw new Error(result.error);
    startTransition(() => router.refresh());
  };

  return (
    <RequirementChecklist
      items={localItems.map(toItem)}
      onUpload={onUpload}
      onRemoveFile={onRemoveFile}
      onSubmit={onSubmit}
      onResubmit={onResubmit}
      onMarkAsToFollow={onMarkAsToFollow}
      pendingRequestSubmissionIds={pendingRequestSubmissionIds}
      readOnly={false}
    />
  );
}
