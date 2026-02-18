"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ComponentRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value = 0, max = 100, ...props }, ref) => {
  const pct = Math.min(max, Math.max(0, Number(value) ?? 0))
  const widthPct = max > 0 ? (pct / max) * 100 : 0
  return (
    <ProgressPrimitive.Root
      ref={ref}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuetext={`${Math.round(widthPct)}%`}
      className={cn(
        "relative h-2.5 w-full overflow-hidden rounded-full bg-neutral-200",
        className
      )}
      value={pct}
      max={max}
      {...props}
    >
      {/* Plain div for fill so width is fully under our control; Radix Indicator can conflict with Tailwind/serialization */}
      <div
        aria-hidden
        className="rounded-full bg-primary transition-[width] duration-500 ease-out"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          height: "100%",
          width: `${widthPct}%`,
          minWidth: widthPct > 0 ? 6 : 0,
        }}
      />
    </ProgressPrimitive.Root>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
