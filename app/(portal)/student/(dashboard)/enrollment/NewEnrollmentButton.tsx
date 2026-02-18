"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileEdit } from "lucide-react";
import { startNewEnrollment } from "./actions";

export function NewEnrollmentButton({ enrollmentId }: { enrollmentId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        const result = await startNewEnrollment(enrollmentId);
        if (result?.error) {
          toast.error(result.error);
        } else {
          router.refresh();
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to start new enrollment.";
        toast.error(message);
      }
    });
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isPending}
      className="mt-3 gap-2 bg-[#6A0000] hover:bg-[#6A0000]/90"
    >
      <FileEdit className="h-4 w-4" />
      {isPending ? "Starting…" : "Start new enrollment"}
    </Button>
  );
}
