"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { markUserEmailVerifiedAction } from "./actions";

export function MarkVerifiedButton({ authUserId }: { authUserId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleClick() {
    setError(null);
    setPending(true);
    const result = await markUserEmailVerifiedAction(authUserId);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <span className="text-xs text-green-700 font-medium" title="Neon Auth was updated; this user can sign in without email verification.">
        Marked verified in auth
      </span>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={pending}
        className="text-xs"
      >
        {pending ? "Updating…" : "Mark verified in auth"}
      </Button>
      {error && <span className="text-xs text-red-600 max-w-[220px] break-words">{error}</span>}
    </div>
  );
}
