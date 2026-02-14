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
import { createSubjectAction } from "./actions";

type Program = { id: string; code: string; name: string };

export function CreateSubjectForm({ programs }: { programs: Program[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subjectType, setSubjectType] = useState<"GE" | "PROGRAM">("PROGRAM");
  const [programId, setProgramId] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("type", subjectType);
    if (subjectType === "PROGRAM") formData.set("programId", programId);
    else formData.set("programId", "");
    const result = await createSubjectAction(formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setSubjectType("PROGRAM");
    setProgramId("");
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Subject
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="text-neutral-900">
          <DialogHeader>
            <DialogTitle className="text-neutral-900">Create Subject</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 text-neutral-900">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div>
              <Label className="text-xs font-medium text-neutral-800">Type</Label>
              <div className="mt-1 flex gap-4">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="type"
                    checked={subjectType === "PROGRAM"}
                    onChange={() => setSubjectType("PROGRAM")}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium text-neutral-900">Program subject</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="type"
                    checked={subjectType === "GE"}
                    onChange={() => setSubjectType("GE")}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium text-neutral-900">GE subject</span>
                </label>
              </div>
            </div>
            {subjectType === "PROGRAM" && (
              <div>
                <Label htmlFor="programId" className="text-neutral-900">Program *</Label>
                <select
                  id="programId"
                  required
                  value={programId}
                  onChange={(e) => setProgramId(e.target.value)}
                  className="mt-1 flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="code" className="text-neutral-900">Code *</Label>
                <Input id="code" name="code" required placeholder="e.g. CC 101" className="mt-1 h-10 text-neutral-900 placeholder:text-neutral-500" />
              </div>
              <div>
                <Label htmlFor="title" className="text-neutral-900">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  placeholder="e.g. Introduction to Programming"
                  className="mt-1 h-10 text-neutral-900 placeholder:text-neutral-500"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-neutral-900">Description (optional)</Label>
                <Input id="description" name="description" placeholder="Short description" className="mt-1 h-10 text-neutral-900 placeholder:text-neutral-500" />
              </div>
              <div>
                <Label htmlFor="units" className="text-neutral-900">Units</Label>
                <Input id="units" name="units" type="number" step="0.5" min={0} placeholder="3" className="mt-1 h-10 text-neutral-900 placeholder:text-neutral-500" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending} className="text-neutral-900">
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
