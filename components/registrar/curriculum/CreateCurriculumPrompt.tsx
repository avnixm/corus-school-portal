"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorDialog } from "@/components/ui/ErrorDialog";
import { createCurriculumForProgramYearAction } from "@/app/(portal)/registrar/curriculum/actions";

export function CreateCurriculumPrompt({
  programId,
  schoolYearId,
  programCode,
  schoolYearName,
}: {
  programId: string;
  schoolYearId: string;
  programCode: string;
  schoolYearName: string;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleCreate() {
    setCreating(true);
    const name = `${programCode} ${schoolYearName}`.trim() || "Curriculum";
    const result = await createCurriculumForProgramYearAction(programId, schoolYearId, name);
    if (result.error) {
      setErrorMessage(result.error);
      setCreating(false);
    } else {
      router.refresh();
    }
  }

  return (
    <>
    <Card className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/30 shadow-sm">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-[#6A0000]/10">
          <BookOpen className="h-7 w-7 text-[#6A0000]" />
        </div>
        <h3 className="mb-2 text-lg font-semibold tracking-tight text-[#6A0000]">
          No curriculum yet for {programCode} – {schoolYearName}
        </h3>
        <p className="mb-8 max-w-md text-sm text-neutral-600">
          Create a curriculum for this program and school year. You’ll then edit each year level (1st–4th) separately. Published curriculum units are used for tuition (× per unit) in Fee Setup.
        </p>
        <Button
          onClick={handleCreate}
          disabled={creating}
          className="bg-[#6A0000] hover:bg-[#4A0000] text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          {creating ? "Creating…" : `Create curriculum for ${programCode} ${schoolYearName}`}
        </Button>
      </CardContent>
    </Card>
    {errorMessage && (
      <ErrorDialog
        open={!!errorMessage}
        onOpenChange={(open) => !open && setErrorMessage(null)}
        message={errorMessage}
      />
    )}
    </>
  );
}
