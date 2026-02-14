"use client";

import { useState } from "react";
import { MoreHorizontal, Trash2, FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import { removeSubjectFromBlockAction, updateBlockSubjectAction } from "@/app/(portal)/registrar/curriculum/actions";

type SubjectRowProps = {
  subject: {
    id: string;
    code: string;
    title: string;
    units: string | null;
    withLab: boolean;
    isGe?: boolean;
  };
  isDraft: boolean;
};

export function SubjectRow({ subject, isDraft }: SubjectRowProps) {
  const [pending, setPending] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const handleRemoveClick = () => setShowRemoveConfirm(true);

  const handleRemoveConfirm = async () => {
    setPending(true);
    await removeSubjectFromBlockAction(subject.id);
    window.location.reload();
  };

  const handleToggleLab = async () => {
    setPending(true);
    await updateBlockSubjectAction(subject.id, { withLab: !subject.withLab });
    window.location.reload();
  };

  return (
    <div className="group flex h-10 items-center gap-3 rounded-md px-3 transition-colors hover:bg-muted/50">
      <Badge variant="outline" className="font-mono text-xs font-medium text-[#6A0000] border-[#6A0000]/30">
        {subject.code}
      </Badge>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-900">{subject.title}</span>
      <div className="flex items-center gap-2">
        {subject.withLab && (
          <Badge variant="outline" className="text-xs border-amber-500/50 bg-amber-50 text-amber-800">
            <FlaskConical className="mr-1 h-3 w-3" />
            Lab
          </Badge>
        )}
        {subject.isGe && (
          <Badge variant="outline" className="text-xs border-[#6A0000]/40 bg-[#6A0000]/5 text-[#6A0000]">
            GE
          </Badge>
        )}
        <span className="text-xs font-medium text-neutral-700">
          {subject.units ?? "0"} {parseFloat(subject.units ?? "0") === 1 ? "unit" : "units"}
        </span>
        {isDraft && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100" disabled={pending}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleToggleLab} disabled={pending}>
                <FlaskConical className="mr-2 h-4 w-4" />
                {subject.withLab ? "Remove lab" : "Mark as lab course"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRemoveClick} className="text-destructive focus:text-destructive" disabled={pending}>
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <DeleteConfirmDialog
        open={showRemoveConfirm}
        onOpenChange={setShowRemoveConfirm}
        title="Remove subject from curriculum"
        description="This subject will be removed from this term. You can add it again later."
        itemLabel={`${subject.code} – ${subject.title}`}
        onConfirm={handleRemoveConfirm}
        pending={pending}
      />
    </div>
  );
}
