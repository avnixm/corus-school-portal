"use client";

import { useEffect, useState } from "react";
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
import { createSubjectAction, updateSubjectAction } from "@/app/(portal)/registrar/academic/actions";

type Program = { id: string; code: string; name: string };
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

export function SubjectDialog({
  open,
  onOpenChange,
  subject,
  programs,
  defaultProgramId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: Subject | null;
  programs: Program[];
  defaultProgramId?: string;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subjectType, setSubjectType] = useState<"PROGRAM" | "GE">(subject?.isGe ? "GE" : "PROGRAM");
  const isEdit = !!subject;

  useEffect(() => {
    if (!open) setError(null);
    if (open && subject) setSubjectType(subject.isGe ? "GE" : "PROGRAM");
    if (open && !subject) setSubjectType(defaultProgramId ? "PROGRAM" : "GE");
  }, [open, subject, defaultProgramId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("type", subjectType);
    formData.set("active", (form.querySelector<HTMLInputElement>('[name="active"]')?.checked ?? true) ? "true" : "false");
    if (subjectType === "PROGRAM") {
      const programId = (form.querySelector<HTMLSelectElement>('[name="programId"]')?.value ?? "").trim();
      formData.set("programId", programId);
    } else {
      formData.set("programId", "");
    }
    const result = isEdit
      ? await updateSubjectAction(subject.id, formData)
      : await createSubjectAction(formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    onOpenChange(false);
    onSuccess?.();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Subject" : "Add Subject"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <Label className="text-xs text-neutral-600">Subject Type</Label>
            <div className="mt-2 flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  checked={subjectType === "PROGRAM"}
                  onChange={() => setSubjectType("PROGRAM")}
                  className="h-4 w-4"
                />
                <span className="text-sm">Program Subject</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  checked={subjectType === "GE"}
                  onChange={() => setSubjectType("GE")}
                  className="h-4 w-4"
                />
                <span className="text-sm">GE Subject</span>
              </label>
            </div>
          </div>
          {subjectType === "PROGRAM" && (
            <div>
              <Label htmlFor="subject-programId">Program *</Label>
              <select
                id="subject-programId"
                name="programId"
                required
                defaultValue={subject?.programId ?? defaultProgramId ?? ""}
                className="mt-1 flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm"
              >
                <option value="">Select program</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} – {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <Label htmlFor="subject-code">Code *</Label>
            <Input
              id="subject-code"
              name="code"
              required
              defaultValue={subject?.code}
              placeholder="e.g. CC 101"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="subject-title">Title *</Label>
            <Input
              id="subject-title"
              name="title"
              required
              defaultValue={subject?.title ?? subject?.description ?? ""}
              placeholder="e.g. Introduction to Programming"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="subject-description">Description (optional)</Label>
            <Input
              id="subject-description"
              name="description"
              defaultValue={subject?.description ?? ""}
              placeholder="Short description"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="subject-units">Units *</Label>
            <Input
              id="subject-units"
              name="units"
              type="number"
              step="0.5"
              min={0}
              required
              defaultValue={subject?.units ?? ""}
              placeholder="3"
              className="mt-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="subject-active"
              name="active"
              value="true"
              defaultChecked={subject?.active ?? true}
              className="h-4 w-4 rounded border-neutral-300"
            />
            <Label htmlFor="subject-active" className="font-normal text-neutral-700">
              Active
            </Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
