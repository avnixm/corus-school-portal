"use client";

import * as React from "react";
import { Loader } from "lucide-react";

export interface SpinnerProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
  center?: boolean;
  delayMs?: number;
}

const Spinner = React.memo(function Spinner({
  size = 24,
  strokeWidth = 2,
  className = "",
  label = "Loading…",
  center = false,
  delayMs = 0,
}: SpinnerProps) {
  const [visible, setVisible] = React.useState(delayMs <= 0);

  React.useEffect(() => {
    if (delayMs <= 0) return;
    const id = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(id);
  }, [delayMs]);

  if (delayMs > 0 && !visible) return null;

  const containerClasses = center
    ? "fixed inset-0 min-h-screen flex items-center justify-center"
    : "inline-flex items-center justify-center";
  const mergedClass = [containerClasses, className].filter(Boolean).join(" ");

  return (
    <span
      role="status"
      aria-live="polite"
      aria-busy
      aria-label={label}
      className={mergedClass}
    >
      <Loader
        aria-hidden
        size={size}
        strokeWidth={strokeWidth}
        className="shrink-0 block text-current animate-spin motion-reduce:animate-none"
        style={{ width: size, height: size }}
      />
    </span>
  );
});

export { Spinner };
