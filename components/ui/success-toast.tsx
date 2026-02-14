"use client";

import { useEffect } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuccessToastProps {
  message: string;
  onDismiss: () => void;
  duration?: number;
  className?: string;
}

export function SuccessToast({
  message,
  onDismiss,
  duration = 3000,
  className,
}: SuccessToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [onDismiss, duration]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "fixed bottom-6 right-6 z-[10000] flex items-center gap-3 rounded-xl border border-green-200 bg-white px-4 py-3 shadow-lg animate-in fade-in slide-in-from-bottom-4",
        className
      )}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100">
        <Check className="h-5 w-5 text-green-700" />
      </div>
      <p className="text-sm font-medium text-neutral-900">{message}</p>
    </div>
  );
}
