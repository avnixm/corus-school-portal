"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { createScheduleAction } from "./actions";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type SchoolYear = { id: string; name: string };
type Term = { id: string; name: string; schoolYearId: string };
type Section = { id: string; name: string };
type Subject = { id: string; code: string; description: string };

export function CreateScheduleForm({
  schoolYears,
  terms,
  sections,
  subjects,
}: {
  schoolYears: SchoolYear[];
  terms: Term[];
  sections: Section[];
  subjects: Subject[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSyId, setSelectedSyId] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const filteredTerms = selectedSyId ? terms.filter((t) => t.schoolYearId === selectedSyId) : [];

  function toggleDay(day: string) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

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
    setSelectedDays([]);
    router.refresh();
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Schedule
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border bg-white p-4 shadow-sm"
    >
      <h3 className="font-semibold text-[#6A0000]">Create Schedule</h3>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor="schoolYearId">School Year *</Label>
          <select
            id="schoolYearId"
            name="schoolYearId"
            required
            value={selectedSyId}
            onChange={(e) => setSelectedSyId(e.target.value)}
            className="mt-1 flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm"
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
            className="mt-1 flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm"
          >
            <option value="">Select</option>
            {filteredTerms.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="sectionId">Section *</Label>
          <select
            id="sectionId"
            name="sectionId"
            required
            className="mt-1 flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm"
          >
            <option value="">Select</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="subjectId">Subject *</Label>
          <select
            id="subjectId"
            name="subjectId"
            required
            className="mt-1 flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm"
          >
            <option value="">Select</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} – {s.description}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="teacherName">Teacher Name</Label>
          <Input id="teacherName" name="teacherName" className="mt-1 h-9" />
        </div>
        <div>
          <Label htmlFor="room">Room</Label>
          <Input id="room" name="room" className="mt-1 h-9" />
        </div>
        <div>
          <Label htmlFor="timeIn">Time In</Label>
          <Input id="timeIn" name="timeIn" type="time" className="mt-1 h-9" />
        </div>
        <div>
          <Label htmlFor="timeOut">Time Out</Label>
          <Input id="timeOut" name="timeOut" type="time" className="mt-1 h-9" />
        </div>
      </div>
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
      <div className="flex gap-2">
        <Button type="submit" disabled={pending || selectedDays.length === 0}>
          Create
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(false)}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
