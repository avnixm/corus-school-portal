"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { addCapabilitiesAction, listDepartmentTeachersAction, listSubjectsForCapabilityBuilderAction } from "@/app/(portal)/program-head/teacher-capabilities/actions";

type Subject = { id: string; code: string; title: string; isGe: boolean; programCode: string | null };
type Teacher = { id: string; name: string; email: string | null };

export function AddCapabilitiesSheet({
  open,
  onOpenChange,
  packageId,
  programId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageId: string;
  programId: string;
  onSuccess: () => void;
}) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<{ major: Subject[]; ge: Subject[]; cross: Subject[] }>({ major: [], ge: [], cross: [] });
  const [teacherId, setTeacherId] = useState("");
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"major" | "ge" | "cross">("major");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !programId) return;
    Promise.all([
      listDepartmentTeachersAction(programId),
      listSubjectsForCapabilityBuilderAction(programId),
    ]).then(([tRes, sRes]) => {
      if (tRes.teachers) setTeachers(tRes.teachers);
      if (sRes.major || sRes.ge || sRes.cross) setSubjects({ major: sRes.major ?? [], ge: sRes.ge ?? [], cross: sRes.cross ?? [] });
    });
  }, [open, programId]);

  const displaySubjects = filter === "major" ? subjects.major : filter === "ge" ? subjects.ge : subjects.cross;

  function toggleSubject(id: string) {
    setSelectedSubjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAdd() {
    if (!packageId || !teacherId || selectedSubjectIds.size === 0) {
      setError("Select a teacher and at least one subject.");
      return;
    }
    setError(null);
    setLoading(true);
    const res = await addCapabilitiesAction(packageId, [
      { teacherId, subjectIds: Array.from(selectedSubjectIds), notes: notes.trim() || null },
    ]);
    setLoading(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setTeacherId("");
    setSelectedSubjectIds(new Set());
    setNotes("");
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto text-neutral-900">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#6A0000]">
            Add Capabilities
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <Label className="text-neutral-900">Teacher</Label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            >
              <option value="">— Select —</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-neutral-900">Subject filter</Label>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setFilter("major")}
                className={`rounded px-3 py-1.5 text-sm text-neutral-900 ${filter === "major" ? "bg-neutral-200" : "bg-neutral-100"}`}
              >
                Major
              </button>
              <button
                type="button"
                onClick={() => setFilter("ge")}
                className={`rounded px-3 py-1.5 text-sm text-neutral-900 ${filter === "ge" ? "bg-blue-200" : "bg-blue-50"}`}
              >
                GE
              </button>
              <button
                type="button"
                onClick={() => setFilter("cross")}
                className={`rounded px-3 py-1.5 text-sm text-neutral-900 ${filter === "cross" ? "bg-amber-200" : "bg-amber-50"}`}
              >
                Cross
              </button>
            </div>
          </div>
          <div>
            <Label className="text-neutral-900">Subjects (multi-select)</Label>
            <div className="mt-2 max-h-48 overflow-y-auto rounded border border-neutral-200 bg-white p-2">
              {displaySubjects.map((s) => (
                <label key={s.id} className="flex cursor-pointer items-center gap-2 py-1 text-sm text-neutral-900">
                  <input
                    type="checkbox"
                    checked={selectedSubjectIds.has(s.id)}
                    onChange={() => toggleSubject(s.id)}
                  />
                  {s.code} – {s.title}
                </label>
              ))}
              {displaySubjects.length === 0 && <p className="text-sm text-neutral-500">No subjects</p>}
            </div>
          </div>
          <div>
            <Label className="text-neutral-900">Notes (optional)</Label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-500"
              placeholder="e.g. lab instructor"
            />
          </div>
          <Button onClick={handleAdd} disabled={loading || !teacherId || selectedSubjectIds.size === 0} className="bg-[#6A0000] hover:bg-[#6A0000]/90">
            {loading ? "Adding…" : "Add selected"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
