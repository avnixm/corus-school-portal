"use client";

import { useState } from "react";
import Link from "next/link";
import { Archive, Trash2, Check, FileText, Copy, MoreHorizontal, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
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

export function CurriculumPageHeader({
  version,
  program,
  schoolYear,
  programs,
  schoolYears,
  selectedYearLevel,
  allBlocks,
  otherViewHref,
  otherViewLabel,
}: {
  version: { id: string; name: string; status: string; programId: string; schoolYearId: string } | null;
  program: Program | null;
  schoolYear: SchoolYear | null;
  programs: Program[];
  schoolYears: SchoolYear[];
  selectedYearLevel: string;
  allBlocks: Block[];
  otherViewHref?: string | null;
  otherViewLabel?: string | null;
}) {
  const [showClone, setShowClone] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const isDraft = version?.status === "draft";
  const isPublished = version?.status === "published";
  const isArchived = version?.status === "archived";

  const totalSubjects = allBlocks.reduce((sum, b) => sum + b.subjects.length, 0);
  const hasSubjects = totalSubjects > 0;

  const handlePublishClick = () => {
    if (version && hasSubjects) setShowPublishConfirm(true);
  };

  const handlePublishConfirm = async () => {
    if (!version || !hasSubjects) return;
    setProcessing(true);
    const result = await publishCurriculumVersionAction(version.id);
    if (result.error) {
      setProcessing(false);
      setErrorMessage(result.error);
      throw new Error(result.error);
    }
    window.location.reload();
  };

  const handleArchiveClick = () => {
    if (version) setShowArchiveConfirm(true);
  };

  const handleArchiveConfirm = async () => {
    if (!version) return;
    setProcessing(true);
    const result = await archiveCurriculumVersionAction(version.id);
    if (result.error) {
      setProcessing(false);
      setErrorMessage(result.error);
      throw new Error(result.error);
    }
    window.location.reload();
  };

  const handleDeleteClick = () => {
    if (version) setShowDelete(true);
  };

  const handleDeleteConfirm = async () => {
    if (!version) return;
    setProcessing(true);
    const result = await deleteCurriculumVersionAction(version.id);
    if (result.error) {
      setProcessing(false);
      setErrorMessage(result.error);
      throw new Error(result.error);
    }
    window.location.reload();
  };

  return (
    <>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
            Curriculum Builder
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage curriculum by program and school year. Edit one year level at a time.
          </p>
        </div>

        {version && (
          <div className="flex h-10 flex-shrink-0 items-center gap-2">
            <Badge
              variant="outline"
              className={
                isDraft
                  ? "border-[#6A0000]/40 bg-[#6A0000]/5 text-[#6A0000]"
                  : "border-border bg-muted/30 text-muted-foreground"
              }
            >
              {isDraft && <FileText className="mr-1 h-3 w-3" />}
              {isPublished && <Check className="mr-1 h-3 w-3" />}
              {isArchived && <Archive className="mr-1 h-3 w-3" />}
              {version.status.charAt(0).toUpperCase() + version.status.slice(1)}
            </Badge>
            {otherViewHref && otherViewLabel && (
              <Link
                href={otherViewHref}
                className="text-xs font-medium text-[#6A0000] hover:underline flex items-center gap-1"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {otherViewLabel}
              </Link>
            )}
            <div className="h-4 w-px bg-border" />
            <Button
              size="sm"
              className="h-10 bg-[#6A0000] hover:bg-[#4A0000] text-white"
              onClick={handlePublishClick}
              disabled={!hasSubjects || processing}
            >
              <Check className="mr-1.5 h-4 w-4" />
              Publish
            </Button>
            <Button size="sm" variant="outline" className="h-10" onClick={() => setShowClone(true)}>
              <Copy className="mr-1.5 h-4 w-4" />
              Clone
            </Button>
            {isDraft && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="h-10 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDeleteClick} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete draft
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {isPublished && (
              <Button size="sm" variant="outline" className="h-10" onClick={handleArchiveClick} disabled={processing}>
                <Archive className="mr-1.5 h-4 w-4" />
                Archive
              </Button>
            )}
          </div>
        )}
      </header>

      {version && isDraft && !hasSubjects && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Add subjects to at least one year level (1st–4th year) before publishing.
        </div>
      )}

      {showClone && version && (
        <CloneVersionDialog
          sourceVersion={version}
          programs={programs}
          schoolYears={schoolYears}
          onClose={() => setShowClone(false)}
        />
      )}

      <DeleteConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete draft curriculum"
        description="This will permanently remove this curriculum draft and all its subjects. This cannot be undone."
        itemLabel={version ? `${program?.code ?? ""} ${schoolYear?.name ?? ""}`.trim() || undefined : undefined}
        onConfirm={handleDeleteConfirm}
        pending={processing}
      />

      <ConfirmDialog
        open={showPublishConfirm}
        onOpenChange={setShowPublishConfirm}
        title="Publish curriculum"
        description="Once published, it cannot be edited. It will be used for enrollment and fee calculation."
        itemLabel={version ? `${program?.code ?? ""} ${schoolYear?.name ?? ""}`.trim() || undefined : undefined}
        confirmLabel="Publish"
        variant="primary"
        icon={Check}
        onConfirm={handlePublishConfirm}
        pending={processing}
      />

      <ConfirmDialog
        open={showArchiveConfirm}
        onOpenChange={setShowArchiveConfirm}
        title="Archive curriculum"
        description="It will no longer be used for enrollment. You can still view it or clone it later."
        itemLabel={version ? `${program?.code ?? ""} ${schoolYear?.name ?? ""}`.trim() || undefined : undefined}
        confirmLabel="Archive"
        variant="default"
        icon={Archive}
        onConfirm={handleArchiveConfirm}
        pending={processing}
      />

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
