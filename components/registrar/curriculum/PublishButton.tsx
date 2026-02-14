// path: components/registrar/curriculum/PublishButton.tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { publishCurriculumVersionAction } from "@/app/(portal)/registrar/curriculum/actions";
import { Loader2 } from "lucide-react";

export function PublishButton({ versionId }: { versionId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await publishCurriculumVersionAction(versionId);
      if (result?.error) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Button variant="default" size="sm" onClick={handleClick} disabled={pending}>
      {pending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
      Publish
    </Button>
  );
}
