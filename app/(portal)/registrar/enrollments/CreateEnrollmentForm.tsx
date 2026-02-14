"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export function CreateEnrollmentForm({
  schoolYears,
  terms,
  students,
}: {
  schoolYears: SchoolYear[];
  terms: Term[];
  students: Student[];
}) {
  const router = useRouter();
  const [pending, setPending] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedSyId, setSelectedSyId] = useState<string>("");
  const filteredTerms = selectedSyId
    ? terms.filter((t) => t.schoolYearId === selectedSyId)
    : [];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await createEnrollmentAction(formData);
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.refresh();
    e.currentTarget.reset();
  }

  function fullName(s: Student) {
    return [s.firstName, s.middleName, s.lastName].filter(Boolean).join(" ");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border bg-white p-4 shadow-sm"
    >
      <h3 className="font-semibold text-[#6A0000]">Create Enrollment</h3>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor="studentId">Student *</Label>
          <select
            id="studentId"
            name="studentId"
            required
            className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm text-neutral-900"
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
            className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm text-neutral-900"
          >
            <option value="">Select</option>
            {schoolYears.map((sy) => (
              <option key={sy.id} value={sy.id}>
                {sy.name}
              </option>
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
            className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm text-neutral-900"
          >
            <option value="">Select school year first</option>
            {filteredTerms.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="program">Program</Label>
          <Input id="program" name="program" placeholder="e.g. BSIT" />
        </div>
        <div>
          <Label htmlFor="yearLevel">Year Level</Label>
          <Input id="yearLevel" name="yearLevel" placeholder="e.g. 1" />
        </div>
      </div>
      <Button type="submit" disabled={!!pending}>
        Create Enrollment
      </Button>
    </form>
  );
}
