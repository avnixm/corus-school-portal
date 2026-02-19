// path: app/components/ui/progress.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * DEBUG: Fill was invisible because bg-[--color-corus-maroon] did not resolve in Tailwind v4.
 * Fix: Inline backgroundColor using --corus-maroon so fill always shows. Width-based fill.
 */
export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

export function Progress({ value = 0, className, ...props }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, Number(value)));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-neutral-200",
        className
      )}
      {...props}
    >
      <div
        className="h-full flex-none rounded-full transition-all duration-300 ease-out"
        style={{
          width: `${pct}%`,
          backgroundColor: "var(--corus-maroon, #6A0000)",
        }}
      />
    </div>
  );
}
