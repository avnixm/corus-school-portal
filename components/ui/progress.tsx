// path: components/ui/progress.tsx
"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

/**
 * DEBUG CHECKLIST (Progress fill invisible):
 * - Cause: Indicator fill relied on Tailwind bg-primary / CSS var; in some builds or
 *   Tailwind v4 configs the token did not apply to the Indicator, so fill was transparent.
 * - Fix: Use width-based fill (not only transform) + inline backgroundColor so fill does
 *   not depend on Tailwind. Pass value to Root for a11y. Use CORUS maroon.
 * - Prevention: Keep Indicator background as inline style or explicit bg-corus-maroon;
 *   ensure value is number 0–100; avoid removing overflow-hidden from Root.
 */
const Progress = React.forwardRef<
  React.ComponentRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => {
  const pct = Math.min(100, Math.max(0, Number(value ?? 0)))
  return (
    <ProgressPrimitive.Root
      ref={ref}
      value={pct}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full flex-none rounded-full transition-all duration-300 ease-out"
        style={{
          width: `${pct}%`,
          backgroundColor: "var(--corus-maroon, #6A0000)",
        }}
      />
    </ProgressPrimitive.Root>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
