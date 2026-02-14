"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { markClearedAction, putOnHoldAction } from "./actions";

export function ClearanceRowActions({ enrollmentId }: { enrollmentId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleMarkCleared() {
    if (!confirm("Mark this enrollment as cleared?")) return;
    setPending(true);
    await markClearedAction(enrollmentId);
    setPending(false);
    router.refresh();
  }

  async function handlePutOnHold() {
    if (!confirm("Put this enrollment on hold?")) return;
    setPending(true);
    await putOnHoldAction(enrollmentId);
    setPending(false);
    router.refresh();
  }

  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleMarkCleared}
        disabled={pending}
        className="h-8"
      >
        Mark Cleared
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handlePutOnHold}
        disabled={pending}
        className="h-8 text-amber-600"
      >
        Put on Hold
      </Button>
    </div>
  );
}
