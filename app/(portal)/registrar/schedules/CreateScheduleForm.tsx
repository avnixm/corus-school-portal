"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, AlertCircle } from "lucide-react";
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
import { createScheduleAction, getSubjectsForSectionAction, getAuthorizedTeachersForSubjectAction } from "./actions";

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
  const [overrideReason, setOverrideReason] = useState("");
  const [subjectsForSection, setSubjectsForSection] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [authorizedTeachers, setAuthorizedTeachers] = useState<string[]>([]);
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
    if (!selectedSubjectId) {
      setAuthorizedTeachers([]);
      return;
    }
    setAuthCheckLoading(true);
    getAuthorizedTeachersForSubjectAction(selectedSubjectId).then((teacherIds) => {
      setAuthorizedTeachers(teacherIds);
      setAuthCheckLoading(false);
    });
  }, [selectedSubjectId]);

  const filteredTerms = selectedSyId ? terms.filter((t) => t.schoolYearId === selectedSyId) : [];
  const filteredSections = sections.filter((s) => {
    if (selectedProgramId && s.programId !== selectedProgramId) return false;
    if (selectedYearLevel && s.yearLevel !== selectedYearLevel) return false;
    return true;
  });

  function toggleDay(day: string) {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  const isAuthorized = selectedTeacherId ? authorizedTeachers.includes(selectedTeacherId) : true;
  const authorizedTeacherList = teachers.filter(t => authorizedTeachers.includes(t.id));
  const unauthorizedTeacherList = teachers.filter(t => !authorizedTeachers.includes(t.id));

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
    setOverrideReason("");
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
                    {authorizedTeacherList.length > 0 && (
                      <>
                        <SelectGroup>
                          <SelectLabel>Authorized Teachers</SelectLabel>
                          {authorizedTeacherList.map(t => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.firstName} {t.lastName} {t.email ? `(${t.email})` : ""}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                        {unauthorizedTeacherList.length > 0 && <SelectSeparator />}
                      </>
                    )}
                    {unauthorizedTeacherList.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Other Teachers (Requires Dean Approval)</SelectLabel>
                        {unauthorizedTeacherList.map(t => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.firstName} {t.lastName} {t.email ? `(${t.email})` : ""}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
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

            {/* Warning when teacher not authorized */}
            {selectedTeacherId && selectedSubjectId && !isAuthorized && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-semibold text-amber-900">Dean approval required</p>
                    <p className="text-sm text-amber-800">
                      This teacher is not authorized for this subject. The schedule will require Dean approval before activation.
                    </p>
                    <div className="mt-2">
                      <Label htmlFor="overrideReason" className="text-amber-900">
                        Override Reason *
                      </Label>
                      <Textarea
                        id="overrideReason"
                        name="overrideReason"
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        placeholder="Explain why this teacher should be assigned to this subject..."
                        className="mt-1 border-amber-300"
                        rows={2}
                        required
                      />
                    </div>
                  </div>
                </div>
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
                disabled={pending || selectedDays.length === 0 || !selectedTeacherId || (!isAuthorized && !overrideReason.trim())}
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
