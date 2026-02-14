"use client";

import { useState } from "react";
import { Archive, Trash2, Check, FileText, AlertCircle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorDialog } from "@/components/ui/ErrorDialog";
import {
  publishCurriculumVersionAction,
  archiveCurriculumVersionAction,
  deleteCurriculumVersionAction,
} from "@/app/(portal)/registrar/curriculum/actions";
import { CloneVersionDialog } from "./CloneVersionDialog";

type Program = { id: string; code: string; name: string };
type SchoolYear = { id: string; name: string };
type Block = { id: string; yearLevel: string; subjects: { id: string }[] };

export function CurriculumHeader({
  version,
  program,
  schoolYear,
  programs,
  schoolYears,
  selectedYearLevel,
  allBlocks,
}: {
  version: { id: string; name: string; status: string; programId: string; schoolYearId: string } | null;
  program: Program | null;
  schoolYear: SchoolYear | null;
  programs: Program[];
  schoolYears: SchoolYear[];
  selectedYearLevel: string;
  allBlocks: Block[];
}) {
  const [showClone, setShowClone] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [confirmState, setConfirmState] = useState<"publish" | "archive" | "delete" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isDraft = version?.status === "draft";
  const isPublished = version?.status === "published";
  const isArchived = version?.status === "archived";

  const totalSubjects = allBlocks.reduce((sum, b) => sum + b.subjects.length, 0);
  const hasSubjects = totalSubjects > 0;

  const handlePublish = () => {
    if (!version || !hasSubjects) return;
    setConfirmState("publish");
  };

  const handleArchive = () => {
    if (!version) return;
    setConfirmState("archive");
  };

  const handleDelete = () => {
    if (!version) return;
    setConfirmState("delete");
  };

  const runConfirmAction = async () => {
    if (!version || !confirmState) return;
    const action = confirmState;
    setProcessing(true);
    setConfirmState(null);
    let result: { error?: string };
    if (action === "publish") result = await publishCurriculumVersionAction(version.id);
    else if (action === "archive") result = await archiveCurriculumVersionAction(version.id);
    else result = await deleteCurriculumVersionAction(version.id);
    setProcessing(false);
    if (result.error) setErrorMessage(result.error);
    else window.location.reload();
  };

  const title = [program?.code, schoolYear?.name, selectedYearLevel].filter(Boolean).join(" – ") || "Curriculum";

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <CardTitle className="text-xl font-semibold tracking-tight text-[#6A0000]">
                  {title}
                </CardTitle>
                {version && (
                  <Badge
                    variant="outline"
                    className={`text-xs font-medium ${
                      isDraft
                        ? "border-[#6A0000]/40 bg-[#6A0000]/5 text-[#6A0000]"
                        : isPublished
                          ? "border-neutral-300 bg-neutral-100 text-neutral-700"
                          : "border-neutral-300 bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {isDraft && <FileText className="mr-1 h-3 w-3" />}
                    {isPublished && <Check className="mr-1 h-3 w-3" />}
                    {isArchived && <Archive className="mr-1 h-3 w-3" />}
                    {version.status.charAt(0).toUpperCase() + version.status.slice(1)}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-neutral-800">
                Editing <strong>{selectedYearLevel}</strong> only. Switch year above to edit another.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {version && (
                <Button variant="outline" size="sm" onClick={() => setShowClone(true)}>
                  <Copy className="mr-1.5 h-4 w-4" />
                  Clone to another year
                </Button>
              )}
              {version && isDraft && (
                <>
                  <Button
                    size="sm"
                    onClick={handlePublish}
                    disabled={!hasSubjects || processing}
                  >
                    <Check className="mr-1.5 h-4 w-4" />
                    Publish
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    disabled={processing}
                    className="border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    Delete
                  </Button>
                </>
              )}
              {version && isPublished && (
                <Button variant="outline" size="sm" onClick={handleArchive} disabled={processing}>
                  <Archive className="mr-1.5 h-4 w-4" />
                  Archive
                </Button>
              )}
            </div>
          </div>

          {version && isDraft && !hasSubjects && (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-[#6A0000] mt-0.5" />
              <div className="text-sm text-neutral-800">
                <p className="font-medium">Add subjects before publishing</p>
                <p className="mt-1">Add subjects to at least one year level (1st–4th year).</p>
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      {showClone && version && (
        <CloneVersionDialog
          sourceVersion={version}
          programs={programs}
          schoolYears={schoolYears}
          onClose={() => setShowClone(false)}
        />
      )}

      {confirmState === "publish" && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setConfirmState(null)}
          title="Publish curriculum"
          description="Once published, it cannot be edited."
          confirmLabel="Publish"
          variant="primary"
          icon={Check}
          onConfirm={runConfirmAction}
          pending={processing}
        />
      )}
      {confirmState === "archive" && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setConfirmState(null)}
          title="Archive curriculum"
          description="It will no longer be used for enrollment."
          confirmLabel="Archive"
          variant="default"
          icon={Archive}
          onConfirm={runConfirmAction}
          pending={processing}
        />
      )}
      {confirmState === "delete" && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setConfirmState(null)}
          title="Delete curriculum"
          description="This cannot be undone."
          confirmLabel="Delete"
          variant="destructive"
          icon={Trash2}
          onConfirm={runConfirmAction}
          pending={processing}
        />
      )}
      {errorMessage && (
        <ErrorDialog
          open={!!errorMessage}
          onOpenChange={(open) => !open && setErrorMessage(null)}
          message={errorMessage}
        />
      )}
    </>
  );
}
