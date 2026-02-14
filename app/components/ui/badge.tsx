import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "outline" | "destructive";

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const base =
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors";

  const variants: Record<BadgeVariant, string> = {
    default:
      "border-transparent bg-[--color-corus-maroon]/10 text-[--color-corus-maroon]",
    secondary:
      "border-transparent bg-neutral-100 text-neutral-900",
    outline:
      "border-[--color-corus-maroon]/40 text-[--color-corus-maroon] bg-transparent",
    destructive:
      "border-transparent bg-red-500 text-neutral-50",
  };

  return (
    <span className={cn(base, variants[variant], className)} {...props} />
  );
}

