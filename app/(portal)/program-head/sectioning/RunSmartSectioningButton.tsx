"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Zap } from "lucide-react";
import { runSmartSectioningAction } from "./actions";

export function RunSmartSectioningButton({
  schoolYearId,
  termId,
  programId,
  yearLevel,
  disabled,
}: {
  schoolYearId: string;
  termId: string;
  programId?: string;
  yearLevel?: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRun() {
    startTransition(async () => {
      const result = await runSmartSectioningAction({
        schoolYearId,
        termId,
        programId,
        yearLevel,
      });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Assigned ${result.assigned} students. Skipped ${result.skipped} (no matching section).`);
      router.refresh();
    });
  }

  return (
    <Button
      onClick={handleRun}
      disabled={disabled || isPending}
      className="gap-2 bg-[#6A0000] hover:bg-[#6A0000]/90"
    >
      <Zap className="h-4 w-4" />
      {isPending ? "Running…" : "Run smart sectioning"}
    </Button>
  );
}
