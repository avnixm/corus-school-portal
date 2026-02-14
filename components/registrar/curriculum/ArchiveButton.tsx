// path: components/registrar/curriculum/ArchiveButton.tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { archiveCurriculumVersionAction } from "@/app/(portal)/registrar/curriculum/actions";
import { Loader2 } from "lucide-react";

export function ArchiveButton({
  versionId,
  status,
}: {
  versionId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`Archive this ${status} curriculum?`)) return;
    startTransition(async () => {
      const result = await archiveCurriculumVersionAction(versionId);
      if (result?.error) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleClick} disabled={pending}>
      {pending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
      Archive
    </Button>
  );
}
