"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface LoadingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pending?: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ pending = false, children, disabled, className, ...props }, ref) => (
    <Button
      ref={ref}
      disabled={disabled || pending}
      className={className}
      {...props}
    >
      {pending && (
        <Spinner size={16} strokeWidth={2} className="mr-2 shrink-0" />
      )}
      {children}
    </Button>
  )
);

LoadingButton.displayName = "LoadingButton";

export { LoadingButton };
