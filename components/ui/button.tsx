import * as React from "react"
import { cn } from "@/lib/utils"

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "default" | "outline" | "ghost"
    size?: "default" | "sm" | "lg"
  }
>(({ className, variant = "default", size = "default", ...props }, ref) => {
  const variants = {
    default: "bg-[--color-corus-maroon] text-white hover:bg-[--color-corus-maroon-dark] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[--color-corus-maroon]",
    outline: "border border-[--color-corus-maroon]/30 text-[--color-corus-maroon] hover:bg-[--color-corus-maroon]/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[--color-corus-maroon]",
    ghost: "text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-300"
  }
  const sizes = {
    default: "h-9 px-4 py-2 text-sm font-medium rounded-md",
    sm: "h-8 px-3 text-xs font-medium rounded-md",
    lg: "h-10 px-8 text-base font-medium rounded-md"
  }
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button }
