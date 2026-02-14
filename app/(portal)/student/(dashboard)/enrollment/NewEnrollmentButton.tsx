"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileEdit } from "lucide-react";
import { startNewEnrollment } from "./actions";

export function NewEnrollmentButton({ enrollmentId }: { enrollmentId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await startNewEnrollment(enrollmentId);
      if (result?.error) alert(result.error);
      else router.refresh();
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
