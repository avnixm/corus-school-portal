"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorDialog } from "@/components/ui/ErrorDialog";
import { createCurriculumForProgramYearAction } from "@/app/(portal)/registrar/curriculum/actions";

type Props = {
  programId: string | null;
  schoolYearId: string | null;
  programCode: string;
  schoolYearName: string;
  showAddButton: boolean;
  addButtonLabel?: string;
  children: React.ReactNode;
};

export function CurriculumContentContainer({
  programId,
  schoolYearId,
  programCode,
  schoolYearName,
  showAddButton,
  addButtonLabel,
  children,
}: Props) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleCreate() {
    if (!programId || !schoolYearId) return;
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

  const showHeader = showAddButton && programId && schoolYearId;

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      {showHeader && (
        <div className="flex flex-shrink-0 items-center justify-end border-b border-neutral-100 bg-neutral-50/50 px-4 py-3">
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={creating}
            className="bg-[#6A0000] hover:bg-[#4A0000] text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            {creating ? "Creating…" : addButtonLabel ?? "Create curriculum"}
          </Button>
        </div>
      )}
      <div className={showHeader ? "p-4 md:p-6" : "p-0"}>{children}</div>
      {errorMessage && (
        <ErrorDialog
          open={!!errorMessage}
          onOpenChange={(open) => !open && setErrorMessage(null)}
          message={errorMessage}
        />
      )}
    </div>
  );
}
