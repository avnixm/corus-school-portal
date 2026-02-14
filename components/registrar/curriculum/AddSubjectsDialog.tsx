"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Plus, Check, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ErrorDialog } from "@/components/ui/ErrorDialog";
import {
  getSubjectsForCurriculumVersionAction,
  addSubjectsToTermAction,
} from "@/app/(portal)/registrar/curriculum/actions";

type Subject = {
  id: string;
  code: string;
  title: string;
  units: string;
  isGe: boolean;
};

export function AddSubjectsDialog({
  versionId,
  yearLevel,
  termId,
  onClose,
}: {
  versionId: string;
  yearLevel: string;
  termId: string;
  onClose: () => void;
}) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [labSubjectIds, setLabSubjectIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const result = await getSubjectsForCurriculumVersionAction(versionId);
      if (!result.error && result.subjects) {
        setSubjects(result.subjects);
      }
      setLoading(false);
    }
    load();
  }, [versionId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return subjects;
    const q = search.toLowerCase().trim();
    return subjects.filter(
      (s) =>
        s.code.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q)
    );
  }, [subjects, search]);

  const toggleSubject = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setLabSubjectIds((l) => {
          const nextLab = new Set(l);
          nextLab.delete(id);
          return nextLab;
        });
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleLab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setLabSubjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = async () => {
    if (selected.size === 0) return;
    setSubmitting(true);
    const result = await addSubjectsToTermAction({
      versionId,
      yearLevel,
      termId,
      items: Array.from(selected).map((subjectId) => ({
        subjectId,
        withLab: labSubjectIds.has(subjectId),
      })),
    });
    if (result.error) {
      setErrorMessage(result.error);
      setSubmitting(false);
    } else {
      window.location.reload();
    }
  };

  const geSubjects = filtered.filter((s) => s.isGe);
  const programSubjects = filtered.filter((s) => !s.isGe);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-tight text-[#6A0000]">
            Add Subjects
          </DialogTitle>
          <DialogDescription className="text-neutral-800">
            Select subjects to add to <span className="font-semibold">{yearLevel}</span>. Mark as <span className="font-medium">Lab</span> if the course has a laboratory component (lab fee applies).
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Search subjects by code or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {loading ? (
            <div className="py-12 text-center text-sm text-neutral-600">Loading subjects...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-neutral-600">
              {search ? "No subjects match your search." : "No subjects available."}
            </div>
          ) : (
            <>
              {/* Program Subjects */}
              {programSubjects.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-neutral-900">Program Subjects</h3>
                  <div className="space-y-2">
                    {programSubjects.map((subject) => {
                      const isSelected = selected.has(subject.id);
                      return (
                        <button
                          key={subject.id}
                          type="button"
                          onClick={() => toggleSubject(subject.id)}
                          className={`group flex w-full items-center justify-between rounded-lg border-2 p-3 text-left transition-all ${
                            isSelected
                              ? "border-[#6A0000] bg-[#6A0000]/5"
                              : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-semibold text-neutral-900">
                                {subject.code}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-neutral-700 line-clamp-1">{subject.title}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            {isSelected && (
                              <button
                                type="button"
                                onClick={(e) => toggleLab(e, subject.id)}
                                title={labSubjectIds.has(subject.id) ? "Remove lab" : "Mark as lab course"}
                                className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors ${
                                  labSubjectIds.has(subject.id)
                                    ? "border-amber-500/50 bg-amber-50 text-amber-800"
                                    : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                                }`}
                              >
                                <FlaskConical className="h-3 w-3" />
                                Lab
                              </button>
                            )}
                            <Badge variant="outline" className="whitespace-nowrap text-xs">
                              {subject.units} {parseFloat(subject.units) === 1 ? "unit" : "units"}
                            </Badge>
                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                                isSelected
                                  ? "border-[#6A0000] bg-[#6A0000] text-white"
                                  : "border-neutral-300 bg-white"
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* GE Subjects */}
              {geSubjects.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-neutral-900">General Education Subjects</h3>
                  <div className="space-y-2">
                    {geSubjects.map((subject) => {
                      const isSelected = selected.has(subject.id);
                      return (
                        <button
                          key={subject.id}
                          type="button"
                          onClick={() => toggleSubject(subject.id)}
                          className={`group flex w-full items-center justify-between rounded-lg border-2 p-3 text-left transition-all ${
                            isSelected
                              ? "border-[#6A0000] bg-[#6A0000]/5"
                              : "border-neutral-200 bg-white hover:border-neutral-300"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-semibold text-neutral-900">
                                {subject.code}
                              </span>
                              <Badge variant="outline" className="text-xs border-[#6A0000]/40 bg-[#6A0000]/5 text-[#6A0000]">
                                GE
                              </Badge>
                            </div>
                            <p className="mt-1 text-sm text-neutral-700 line-clamp-1">{subject.title}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            {isSelected && (
                              <button
                                type="button"
                                onClick={(e) => toggleLab(e, subject.id)}
                                title={labSubjectIds.has(subject.id) ? "Remove lab" : "Mark as lab course"}
                                className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors ${
                                  labSubjectIds.has(subject.id)
                                    ? "border-amber-500/50 bg-amber-50 text-amber-800"
                                    : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                                }`}
                              >
                                <FlaskConical className="h-3 w-3" />
                                Lab
                              </button>
                            )}
                            <Badge variant="outline" className="whitespace-nowrap text-xs border-neutral-300">
                              {subject.units} {parseFloat(subject.units) === 1 ? "unit" : "units"}
                            </Badge>
                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                                isSelected
                                  ? "border-[#6A0000] bg-[#6A0000] text-white"
                                  : "border-neutral-300 bg-white"
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-neutral-600">
            {selected.size} {selected.size === 1 ? "subject" : "subjects"} selected
            {labSubjectIds.size > 0 && (
              <span className="ml-2 text-amber-700">
                · {labSubjectIds.size} lab {labSubjectIds.size === 1 ? "course" : "courses"}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={selected.size === 0 || submitting}>
              {submitting ? (
                "Adding..."
              ) : (
                <>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Add {selected.size > 0 ? `(${selected.size})` : ""}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
      {errorMessage && (
        <ErrorDialog
          open={!!errorMessage}
          onOpenChange={(open) => !open && setErrorMessage(null)}
          message={errorMessage}
        />
      )}
    </Dialog>
  );
}
