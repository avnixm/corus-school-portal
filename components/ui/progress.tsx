import * as React from "react"
import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value?: number }
>(({ className, value = 0, style: styleProp, ...props }, ref) => {
  const pct = Math.min(100, Math.max(0, Number(value) ?? 0))
  return (
    <div
      ref={ref}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={`${Math.round(pct)}%`}
      className={cn(
        "relative h-2.5 w-full overflow-hidden rounded-full bg-neutral-200",
        className
      )}
      style={{
        ...styleProp,
        ["--progress-value" as string]: `${pct}%`,
      }}
      {...props}
    >
      <div
        aria-hidden
        className="z-[1] h-full rounded-full bg-[#6A0000] transition-[width] duration-500 ease-out"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          height: "100%",
          width: "var(--progress-value)",
          minWidth: pct > 0 ? 6 : 0,
        }}
      />
    </div>
  )
})
Progress.displayName = "Progress"

export { Progress }
