"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function SubjectTypeBadge({
  isGe,
  programCode,
  className,
}: {
  isGe: boolean;
  programCode?: string | null;
  className?: string;
}) {
  if (isGe) {
    return (
      <Badge variant="outline" className={cn("bg-amber-100/80 text-amber-800 border-amber-200/60 font-medium", className)}>
        GE
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={cn("border-[#6A0000]/40 text-[#6A0000] font-mono text-xs", className)}>
      {programCode ?? "—"}
    </Badge>
  );
}
