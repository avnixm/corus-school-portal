"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { assignSectionToEnrollmentAction } from "./actions";

type Section = { id: string; name: string; yearLevel: string | null; programId: string | null };

export function RegistrarAssignSectionCell({
  enrollmentId,
  sections,
  enrollmentProgramId,
  enrollmentYearLevel,
}: {
  enrollmentId: string;
  sections: Section[];
  enrollmentProgramId: string | null;
  enrollmentYearLevel: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedSectionId, setSelectedSectionId] = useState("");

  const filteredSections = sections.filter((s) => {
    if (enrollmentProgramId && s.programId && s.programId !== enrollmentProgramId) return false;
    if (!enrollmentYearLevel) return true;
    const sYear = s.yearLevel ?? "";
    const map: Record<string, string> = {
      "1st Year": "1",
      "2nd Year": "2",
      "3rd Year": "3",
      "4th Year": "4",
      "5th Year": "5",
    };
    const norm = map[enrollmentYearLevel] ?? enrollmentYearLevel;
    return sYear === enrollmentYearLevel || sYear === norm;
  });

  function handleAssign() {
    if (!selectedSectionId) {
      toast.error("Select a section first");
      return;
    }
    startTransition(async () => {
      const result = await assignSectionToEnrollmentAction(enrollmentId, selectedSectionId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Section assigned");
      setSelectedSectionId("");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={selectedSectionId}
        onChange={(e) => setSelectedSectionId(e.target.value)}
        className="h-8 rounded-md border border-neutral-200 px-2 text-sm"
        disabled={isPending || filteredSections.length === 0}
      >
        <option value="">Select section</option>
        {filteredSections.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
            {s.yearLevel ? ` (${s.yearLevel})` : ""}
          </option>
        ))}
      </select>
      <Button
        size="sm"
        variant="outline"
        onClick={handleAssign}
        disabled={isPending || !selectedSectionId || filteredSections.length === 0}
      >
        {isPending ? "…" : "Assign"}
      </Button>
    </div>
  );
}
