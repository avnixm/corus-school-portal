"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, ExternalLink } from "lucide-react";

export type PassedFormItem = {
  submissionId: string;
  requirementName: string;
  requirementCode: string;
  submittedAt: Date | string | null;
  verifiedAt: Date | string | null;
  registrarRemarks: string | null;
  files: {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    url: string | null;
  }[];
};

export function PassedFormsCard({ forms }: { forms: PassedFormItem[] }) {
  const [viewing, setViewing] = useState<PassedFormItem | null>(null);

  if (forms.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-[#6A0000]">
            Passed forms
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-600">
            No verified forms yet. Forms appear here after the registrar verifies
            submitted requirements.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-[#6A0000]">
            Passed forms
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {forms.map((form) => (
              <div
                key={form.submissionId}
                className="flex flex-col rounded-lg border bg-neutral-50/80 p-3 text-sm"
              >
                <div className="flex min-h-10 items-center gap-2">
                  <FileText className="h-5 w-5 shrink-0 text-[#6A0000]" />
                  <span className="font-medium text-neutral-900 line-clamp-2">
                    {form.requirementName}
                  </span>
                </div>
                <p className="mt-1 text-xs text-neutral-600">
                  Verified{" "}
                  {form.verifiedAt
                    ? new Date(form.verifiedAt).toLocaleDateString()
                    : "—"}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 w-full text-xs"
                  onClick={() => setViewing(form)}
                >
                  View
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#6A0000]">
              {viewing?.requirementName ?? "Form"}
            </DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div className="grid gap-2 text-sm">
                <p>
                  <span className="text-neutral-600">Code:</span>{" "}
                  {viewing.requirementCode}
                </p>
                {viewing.submittedAt && (
                  <p>
                    <span className="text-neutral-600">Submitted:</span>{" "}
                    {new Date(viewing.submittedAt).toLocaleString()}
                  </p>
                )}
                {viewing.verifiedAt && (
                  <p>
                    <span className="text-neutral-600">Verified:</span>{" "}
                    {new Date(viewing.verifiedAt).toLocaleString()}
                  </p>
                )}
                {viewing.registrarRemarks && (
                  <p>
                    <span className="text-neutral-600">Remarks:</span>{" "}
                    {viewing.registrarRemarks}
                  </p>
                )}
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-neutral-700">
                  Files
                </p>
                {viewing.files.length === 0 ? (
                  <p className="text-sm text-neutral-600">No files attached.</p>
                ) : (
                  <ul className="space-y-2">
                    {viewing.files.map((f) => (
                      <li
                        key={f.id}
                        className="flex items-center justify-between rounded border bg-white px-3 py-2 text-sm"
                      >
                        <span className="truncate text-neutral-900">
                          {f.fileName}
                        </span>
                        {f.url ? (
                          <a
                            href={f.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 shrink-0 text-[#6A0000] hover:underline"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : (
                          <span className="ml-2 text-xs text-neutral-500">
                            (no link)
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
