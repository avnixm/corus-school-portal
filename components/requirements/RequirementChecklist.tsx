"use client";

import * as React from "react";
import { RequirementCard, type RequirementItem } from "./RequirementCard";

interface RequirementChecklistProps {
  items: RequirementItem[];
  onUpload: (submissionId: string, file: File) => Promise<void>;
  onRemoveFile: (fileId: string) => Promise<void>;
  onSubmit: (submissionId: string) => Promise<void>;
  onResubmit: (submissionId: string) => Promise<void>;
  onMarkAsToFollow?: (submissionId: string, value: boolean) => Promise<void>;
  pendingRequestSubmissionIds?: string[];
  readOnly?: boolean;
  requiredOnly?: boolean;
}

export function RequirementChecklist({
  items,
  onUpload,
  onRemoveFile,
  onSubmit,
  onResubmit,
  onMarkAsToFollow,
  pendingRequestSubmissionIds = [],
  readOnly,
  requiredOnly,
}: RequirementChecklistProps) {
  const toShow = requiredOnly ? items.filter((i) => i.rule.isRequired) : items;
  const required = items.filter((i) => i.rule.isRequired);
  const optional = items.filter((i) => !i.rule.isRequired);
  const pendingSet = new Set(pendingRequestSubmissionIds);

  const cardProps = (item: RequirementItem) => ({
    onUpload,
    onRemoveFile,
    onSubmit,
    onResubmit,
    onMarkAsToFollow,
    readOnly,
    hasPendingRequest: pendingSet.has(item.submission.id),
  });

  if (requiredOnly) {
    return (
      <div className="space-y-4">
        {toShow.map((item) => (
          <RequirementCard key={item.submission.id} item={item} {...cardProps(item)} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {required.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#6A0000]">Required</h3>
          <div className="space-y-4">
            {required.map((item) => (
              <RequirementCard key={item.submission.id} item={item} {...cardProps(item)} />
            ))}
          </div>
        </section>
      )}
      {optional.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-neutral-700">Optional / Later</h3>
          <div className="space-y-4">
            {optional.map((item) => (
              <RequirementCard key={item.submission.id} item={item} {...cardProps(item)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
