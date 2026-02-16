"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createScheduleAction, getSubjectsForSectionAction, getEligibleTeachersForSubjectAction } from "./actions";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type SchoolYear = { id: string; name: string };
type Term = { id: string; name: string; schoolYearId: string };
type Section = {
  id: string;
  name: string;
  programId: string | null;
  yearLevel: string | null;
  programCode: string | null;
};
type Subject = {
  id: string;
  code: string;
  title?: string;
  description?: string | null;
  isGe?: boolean;
};
type Program = { id: string; code: string; name: string };
type Teacher = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
};

export function CreateScheduleForm({
  schoolYears,
  terms,
  sections,
  programs,
  teachers,
}: {
  schoolYears: SchoolYear[];
  terms: Term[];
  sections: Section[];
  programs: Program[];
  teachers: Teacher[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSyId, setSelectedSyId] = useState("");
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedYearLevel, setSelectedYearLevel] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [subjectsForSection, setSubjectsForSection] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [eligibleTeachers, setEligibleTeachers] = useState<{ recommended: { teacherId: string; teacherName: string }[]; departmentMatch: { teacherId: string; teacherName: string }[] }>({ recommended: [], departmentMatch: [] });
  const [authCheckLoading, setAuthCheckLoading] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  useEffect(() => {
    if (!selectedSectionId) {
      setSubjectsForSection([]);
      return;
    }
    let cancelled = false;
    setSubjectsLoading(true);
    getSubjectsForSectionAction(selectedSectionId).then((list) => {
      if (!cancelled) {
        setSubjectsForSection(list);
        setSubjectsLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [selectedSectionId]);

  useEffect(() => {
    if (!selectedSubjectId || !selectedSectionId) {
      setEligibleTeachers({ recommended: [], departmentMatch: [] });
      return;
    }
    setAuthCheckLoading(true);
    getEligibleTeachersForSubjectAction(selectedSubjectId, selectedSectionId).then((res) => {
      setEligibleTeachers(res);
      setAuthCheckLoading(false);
    });
  }, [selectedSubjectId, selectedSectionId]);

  const filteredTerms = selectedSyId ? terms.filter((t) => t.schoolYearId === selectedSyId) : [];
  const filteredSections = sections.filter((s) => {
    if (selectedProgramId && s.programId !== selectedProgramId) return false;
    if (selectedYearLevel && s.yearLevel !== selectedYearLevel) return false;
    return true;
  });

  function toggleDay(day: string) {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  const recommendedIds = new Set(eligibleTeachers.recommended.map((t) => t.teacherId));
  const isEligible = selectedTeacherId ? recommendedIds.has(selectedTeacherId) : true;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    selectedDays.forEach((d) => formData.append("days", d));
    const result = await createScheduleAction(formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setSelectedSyId("");
    setSelectedProgramId("");
    setSelectedYearLevel("");
    setSelectedSectionId("");
    setSelectedSubjectId("");
    setSelectedTeacherId("");
    setSelectedDays([]);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Schedule
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Schedule</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
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
                  <option value="">Select</option>
                  {filteredTerms.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="programId">Program *</Label>
                <select
                  id="programId"
                  value={selectedProgramId}
                  onChange={(e) => { setSelectedProgramId(e.target.value); setSelectedYearLevel(""); }}
                  className="mt-1 flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
                >
                  <option value="">Select</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>{p.code} – {p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="yearLevelFilter">Year Level</Label>
                <select
                  id="yearLevelFilter"
                  value={selectedYearLevel}
                  onChange={(e) => setSelectedYearLevel(e.target.value)}
                  className="mt-1 flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
                >
                  <option value="">All</option>
                  {["1", "2", "3", "4", "5"].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="sectionId">Section *</Label>
                <select
                  id="sectionId"
                  name="sectionId"
                  required
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="mt-1 flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
                >
                  <option value="">Select program (and optional year level) first</option>
                  {filteredSections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.programCode ?? (s as { program?: string | null }).program ?? "—"} {s.yearLevel ?? ""} – {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="subjectId">Subject *</Label>
                <select
                  id="subjectId"
                  name="subjectId"
                  required
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  disabled={!selectedSectionId || subjectsLoading}
                  className="mt-1 flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
                >
                  <option value="">{!selectedSectionId ? "Select section first" : subjectsLoading ? "Loading…" : "Select"}</option>
                  {subjectsForSection.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} – {(s.title || s.description) ?? ""} {s.isGe ? "(GE)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="teacherId">Teacher *</Label>
                <Select
                  name="teacherId"
                  value={selectedTeacherId}
                  onValueChange={setSelectedTeacherId}
                  disabled={!selectedSubjectId || authCheckLoading}
                  required
                >
                  <SelectTrigger className="mt-1 h-10">
                    <SelectValue placeholder={authCheckLoading ? "Loading..." : "Select teacher"} />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleTeachers.recommended.length > 0 && (
                      <>
                        <SelectGroup>
                          <SelectLabel>Recommended (approved for this subject)</SelectLabel>
                          {eligibleTeachers.recommended.map((t) => (
                            <SelectItem key={t.teacherId} value={t.teacherId}>
                              {t.teacherName}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                        {eligibleTeachers.departmentMatch.length > 0 && <SelectSeparator />}
                      </>
                    )}
                    {eligibleTeachers.departmentMatch.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Department match (not yet approved – Request capability)</SelectLabel>
                        {eligibleTeachers.departmentMatch.map((t) => (
                          <SelectItem key={t.teacherId} value={t.teacherId} disabled>
                            {t.teacherName} – Not approved
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
                {eligibleTeachers.recommended.length === 0 && !authCheckLoading && selectedSubjectId && (
                  <p className="mt-1 text-xs text-amber-600">
                    No teachers with active capability. Request capability approval in Program Head / Teacher Capabilities.
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="room">Room</Label>
                <Input id="room" name="room" className="mt-1 h-10" />
              </div>
              <div>
                <Label htmlFor="timeIn">Time In</Label>
                <Input id="timeIn" name="timeIn" type="time" className="mt-1 h-10" />
              </div>
              <div>
                <Label htmlFor="timeOut">Time Out</Label>
                <Input id="timeOut" name="timeOut" type="time" className="mt-1 h-10" />
              </div>
            </div>

            {selectedTeacherId && selectedSubjectId && !isEligible && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-800">
                  Teacher is not approved to teach this subject. Request capability approval from Program Head.
                </p>
                <a href="/program-head/teacher-capabilities" className="mt-2 inline-block text-sm font-medium text-[#6A0000] hover:underline">
                  Request capability
                </a>
              </div>
            )}

            <div>
              <Label>Days *</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {DAYS.map((day) => (
                  <label key={day} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedDays.includes(day)}
                      onChange={() => toggleDay(day)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">{day}</span>
                  </label>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
              <Button
                type="submit"
                disabled={pending || selectedDays.length === 0 || !selectedTeacherId || !isEligible}
              >
                {pending ? "Creating…" : "Create & Submit for Approval"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
