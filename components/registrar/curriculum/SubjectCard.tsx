"use client";

import { GripVertical, Trash2, FlaskConical, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type SubjectCardProps = {
  subject: {
    id: string;
    code: string;
    title: string;
    units: string | null;
    withLab: boolean;
    prereqText: string | null;
    isGe?: boolean;
  };
  isDraft: boolean;
  onRemove: () => void;
};

export function SubjectCard({ subject, isDraft, onRemove }: SubjectCardProps) {
  return (
    <div className="group relative flex items-start gap-3 rounded-xl border border-neutral-200 bg-white/80 p-3 transition-colors hover:border-neutral-300">
      {isDraft && (
        <div className="cursor-move pt-1">
          <GripVertical className="h-4 w-4 text-neutral-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-mono text-sm font-semibold text-[#6A0000]">{subject.code}</h4>
              {subject.isGe && (
                <Badge variant="outline" className="text-xs border-[#6A0000]/40 bg-[#6A0000]/5 text-[#6A0000]">
                  GE
                </Badge>
              )}
              {subject.withLab && (
                <Badge variant="outline" className="text-xs border-neutral-300 bg-neutral-100 text-neutral-700 flex items-center gap-1">
                  <FlaskConical className="h-3 w-3" />
                  Lab
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-neutral-800 line-clamp-1">{subject.title}</p>
            {subject.prereqText && (
              <p className="mt-1 text-xs text-neutral-600">
                <span className="font-medium">Prerequisite:</span> {subject.prereqText}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="whitespace-nowrap text-xs font-medium border-neutral-300 text-neutral-700">
              {subject.units ?? "0"} {parseFloat(subject.units ?? "0") === 1 ? "unit" : "units"}
            </Badge>
            {isDraft && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onRemove}
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
