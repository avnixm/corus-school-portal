"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgramsPanel } from "@/components/registrar/academic/ProgramsPanel";
import { SubjectsPanel } from "@/components/registrar/academic/SubjectsPanel";
import { MobileProgramSelect } from "@/components/registrar/academic/MobileProgramSelect";
import { ProgramDialog } from "@/components/registrar/academic/ProgramDialog";
import { SubjectDialog } from "@/components/registrar/academic/SubjectDialog";
import { useRouter } from "next/navigation";

type Program = { id: string; code: string; name: string; active: boolean };
type Subject = {
  id: string;
  code: string;
  title?: string;
  description?: string | null;
  units: string | null;
  active: boolean;
  isGe?: boolean;
  programId?: string | null;
  programCode?: string | null;
};

export function AcademicSetupClient({
  programs,
  subjects,
}: {
  programs: Program[];
  subjects: Subject[];
}) {
  const router = useRouter();
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [programDialogOpen, setProgramDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const selectedProgram = programs.find((p) => p.id === selectedProgramId);

  function openAddProgram() {
    setEditingProgram(null);
    setProgramDialogOpen(true);
  }

  function openEditProgram(program: Program) {
    setEditingProgram(program);
    setProgramDialogOpen(true);
  }

  function openAddSubject() {
    setEditingSubject(null);
    setSubjectDialogOpen(true);
  }

  function openEditSubject(subject: Subject) {
    setEditingSubject(subject);
    setSubjectDialogOpen(true);
  }

  return (
    <>
      <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
            Academic Setup
          </h2>
          <p className="mt-1 text-sm text-neutral-800">
            Manage programs and subjects. Create program-specific or GE (General Education) subjects.
          </p>
        </div>
        <div className="mt-2 sm:mt-0">
          <Button size="sm" className="gap-1.5" onClick={openAddProgram}>
            <Plus className="h-4 w-4" />
            Add Program
          </Button>
        </div>
      </header>

      <div className="block md:hidden">
        <MobileProgramSelect
          programs={programs}
          value={selectedProgramId ?? ""}
          onChange={(id) => setSelectedProgramId(id || null)}
          placeholder="Select a program"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <aside className="hidden md:block md:col-span-4">
          <ProgramsPanel
            programs={programs}
            selectedId={selectedProgramId}
            onSelect={setSelectedProgramId}
            onAddProgram={openAddProgram}
            onEditProgram={openEditProgram}
          />
        </aside>
        <main className="md:col-span-8">
          <SubjectsPanel
            subjects={subjects}
            programs={programs}
            selectedProgramId={selectedProgramId}
            selectedProgramCode={selectedProgram?.code ?? null}
            onAddSubject={openAddSubject}
            onEditSubject={openEditSubject}
          />
        </main>
      </div>

      <ProgramDialog
        open={programDialogOpen}
        onOpenChange={(open) => {
          setProgramDialogOpen(open);
          if (!open) setEditingProgram(null);
        }}
        program={editingProgram}
        onSuccess={() => router.refresh()}
      />

      <SubjectDialog
        open={subjectDialogOpen}
        onOpenChange={(open) => {
          setSubjectDialogOpen(open);
          if (!open) setEditingSubject(null);
        }}
        subject={editingSubject}
        programs={programs}
        defaultProgramId={selectedProgramId ?? undefined}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
