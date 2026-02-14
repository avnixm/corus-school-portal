"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createEnrollmentAction } from "./actions";

type SchoolYear = { id: string; name: string };
type Term = { id: string; name: string; schoolYearId: string };
type Student = {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  studentCode: string | null;
};
type Program = { id: string; code: string; name: string };
type Section = {
  id: string;
  name: string;
  programId: string | null;
  yearLevel: string | null;
  programCode: string | null;
};

export function CreateEnrollmentForm({
  schoolYears,
  terms,
  students,
  programs,
  sections,
}: {
  schoolYears: SchoolYear[];
  terms: Term[];
  students: Student[];
  programs: Program[];
  sections: Section[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSyId, setSelectedSyId] = useState("");
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedYearLevel, setSelectedYearLevel] = useState("");

  const filteredTerms = selectedSyId ? terms.filter((t) => t.schoolYearId === selectedSyId) : [];
  const filteredSections = sections.filter((s) => {
    if (selectedProgramId && s.programId !== selectedProgramId) return false;
    if (selectedYearLevel && s.yearLevel !== selectedYearLevel) return false;
    return true;
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await createEnrollmentAction(formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setSelectedSyId("");
    setSelectedProgramId("");
    setSelectedYearLevel("");
    router.refresh();
    e.currentTarget.reset();
  }

  function fullName(s: Student) {
    return [s.firstName, s.middleName, s.lastName].filter(Boolean).join(" ");
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Enrollment
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Enrollment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="studentId">Student *</Label>
                <select
                  id="studentId"
                  name="studentId"
                  required
                  className="mt-1 flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
                >
                  <option value="">Select student</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {fullName(s)} {s.studentCode ? `(${s.studentCode})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="schoolYearId">School Year *</Label>
                <select
                  id="schoolYearId"
                  name="schoolYearId"
                  required
                  value={selectedSyId}
                  onChange={(e) => setSelectedSyId(e.target.value)}
                  className="mt-1 flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
                >
                  <option value="">Select</option>
                  {schoolYears.map((sy) => (
                    <option key={sy.id} value={sy.id}>{sy.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="termId">Term *</Label>
                <select
                  id="termId"
                  name="termId"
                  required
                  disabled={!selectedSyId}
                  className="mt-1 flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
                >
                  <option value="">Select school year first</option>
                  {filteredTerms.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="programId">Program *</Label>
                <select
                  id="programId"
                  name="programId"
                  required
                  value={selectedProgramId}
                  onChange={(e) => { setSelectedProgramId(e.target.value); setSelectedYearLevel(""); }}
                  className="mt-1 flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
                >
                  <option value="">Select program</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>{p.code} – {p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="yearLevel">Year Level *</Label>
                <Input
                  id="yearLevel"
                  name="yearLevel"
                  required
                  placeholder="e.g. 1"
                  value={selectedYearLevel}
                  onChange={(e) => setSelectedYearLevel(e.target.value)}
                  className="mt-1 h-10"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="sectionId">Section</Label>
                <select
                  id="sectionId"
                  name="sectionId"
                  className="mt-1 flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
                >
                  <option value="">None (assign later)</option>
                  {filteredSections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.programCode ?? (s as { program?: string | null }).program ?? "—"} {s.yearLevel ?? ""} – {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
              <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create Enrollment"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
