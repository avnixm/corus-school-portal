"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { markClearedAction } from "./actions";

export function MarkClearedButton({
  enrollmentId,
  disabled,
}: {
  enrollmentId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (disabled) return;
    if (!confirm("Mark this enrollment as cleared?")) return;
    startTransition(async () => {
      const result = await markClearedAction(enrollmentId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Enrollment marked as cleared");
      router.refresh();
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={pending || disabled}
    >
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Mark Cleared
    </Button>
  );
}
