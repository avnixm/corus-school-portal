"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { addTeacherSubjectPermissionsAction } from "@/app/(portal)/registrar/teachers/actions";

type Subject = {
  id: string;
  code: string;
  title: string;
  units: string | null;
  programId: string | null;
  isGe: boolean;
};

export function AddCoursesDialog({
  teacherId,
  existingSubjectIds,
  onClose,
}: {
  teacherId: string;
  existingSubjectIds: string[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "ge" | "program">("all");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSubjects() {
      const res = await fetch("/api/subjects");
      if (res.ok) {
        const data = await res.json();
        // Filter out already assigned subjects
        const available = data.filter((s: Subject) => !existingSubjectIds.includes(s.id));
        setSubjects(available);
        setFilteredSubjects(available);
      }
      setLoading(false);
    }
    loadSubjects();
  }, [existingSubjectIds]);

  useEffect(() => {
    let filtered = subjects;
    
    // Apply type filter
    if (filter === "ge") {
      filtered = filtered.filter(s => s.isGe);
    } else if (filter === "program") {
      filtered = filtered.filter(s => !s.isGe);
    }
    
    // Apply search
    if (search.trim()) {
      const term = search.toLowerCase();
      filtered = filtered.filter(
        s => s.code.toLowerCase().includes(term) || s.title.toLowerCase().includes(term)
      );
    }
    
    setFilteredSubjects(filtered);
  }, [subjects, filter, search]);

  function toggleSubject(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleSubmit() {
    if (selected.size === 0) return;
    
    setSubmitting(true);
    const formData = new FormData();
    formData.set("teacherId", teacherId);
    formData.set("subjectIds", JSON.stringify(Array.from(selected)));
    if (notes.trim()) {
      formData.set("notes", notes.trim());
    }
    
    const result = await addTeacherSubjectPermissionsAction(formData);
    setSubmitting(false);
    
    if (result?.error) {
      alert(result.error);
    } else {
      router.refresh();
      onClose();
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#6A0000]">
            Add Authorized Courses
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div>
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by code or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              className={filter === "all" ? "bg-[#6A0000] hover:bg-[#6A0000]/90" : ""}
            >
              All
            </Button>
            <Button
              type="button"
              size="sm"
              variant={filter === "ge" ? "default" : "outline"}
              onClick={() => setFilter("ge")}
              className={filter === "ge" ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              GE Only
            </Button>
            <Button
              type="button"
              size="sm"
              variant={filter === "program" ? "default" : "outline"}
              onClick={() => setFilter("program")}
            >
              Program Only
            </Button>
          </div>

          {/* Selected Count */}
          {selected.size > 0 && (
            <Badge className="bg-[#6A0000]">
              {selected.size} course{selected.size !== 1 ? "s" : ""} selected
            </Badge>
          )}

          {/* Subject List */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {loading ? (
              <p className="text-sm text-neutral-600">Loading subjects...</p>
            ) : filteredSubjects.length === 0 ? (
              <p className="text-sm text-neutral-600">No subjects available.</p>
            ) : (
              filteredSubjects.map((subject) => {
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
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-[#6A0000]">
                          {subject.code}
                        </span>
                        <Badge
                          variant="outline"
                          className={subject.isGe ? "bg-blue-50 text-blue-700" : ""}
                        >
                          {subject.isGe ? "GE" : "Program"}
                        </Badge>
                      </div>
                      <p className="text-sm text-neutral-700 mt-0.5">{subject.title}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{subject.units || "0"} units</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Optional Notes */}
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add notes for all selected courses..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || selected.size === 0}
            className="bg-[#6A0000] hover:bg-[#6A0000]/90"
          >
            {submitting ? "Adding..." : `Add selected (${selected.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
