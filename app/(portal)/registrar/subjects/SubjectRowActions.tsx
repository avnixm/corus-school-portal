"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { updateSubjectAction, toggleSubjectActiveAction } from "./actions";

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

type Program = { id: string; code: string; name: string };

export function SubjectRowActions({ subject, programs }: { subject: Subject; programs: Program[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayTitle = (subject.title || subject.description) ?? "";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const programId = formData.get("programId") as string;
    if (programId === "__ge__") {
      formData.set("type", "GE");
      formData.set("programId", "");
    } else {
      formData.set("type", "PROGRAM");
    }
    const result = await updateSubjectAction(subject.id, formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  async function handleToggle() {
    setPending(true);
    await toggleSubjectActiveAction(subject.id, !subject.active);
    setPending(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="h-8 gap-1">
          <Pencil className="h-3 w-3" />
          Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={handleToggle} disabled={pending} className="h-8">
          {subject.active ? "Deactivate" : "Activate"}
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="text-neutral-900">
          <DialogHeader>
            <DialogTitle className="text-neutral-900">Edit Subject</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 text-neutral-900">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div>
              <Label htmlFor="programId" className="text-neutral-900">Program / GE *</Label>
              <select
                id="programId"
                name="programId"
                required
                defaultValue={subject.isGe ? "__ge__" : (subject.programId ?? "")}
                className="mt-1 flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
              >
                <option value="">Select program or GE</option>
                <option value="__ge__">GE – General Education</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} – {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="code" className="text-neutral-900">Code *</Label>
              <Input id="code" name="code" defaultValue={subject.code} className="mt-1 h-10 text-neutral-900 placeholder:text-neutral-500" required />
            </div>
            <div>
              <Label htmlFor="title" className="text-neutral-900">Title *</Label>
              <Input id="title" name="title" defaultValue={displayTitle} className="mt-1 h-10 text-neutral-900 placeholder:text-neutral-500" required />
            </div>
            <div>
              <Label htmlFor="description" className="text-neutral-900">Description (optional)</Label>
              <Input id="description" name="description" defaultValue={subject.description ?? ""} className="mt-1 h-10 text-neutral-900 placeholder:text-neutral-500" />
            </div>
            <div>
              <Label htmlFor="units" className="text-neutral-900">Units</Label>
              <Input id="units" name="units" type="number" step="0.5" min={0} defaultValue={subject.units ?? ""} className="mt-1 h-10 text-neutral-900 placeholder:text-neutral-500" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending} className="text-neutral-900">Cancel</Button>
              <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
