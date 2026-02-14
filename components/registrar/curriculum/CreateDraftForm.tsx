// path: components/registrar/curriculum/CreateDraftForm.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createCurriculumVersionAction } from "@/app/(portal)/registrar/curriculum/actions";
import { Loader2 } from "lucide-react";

type Program = { id: string; code: string; name: string };
type SchoolYear = { id: string; name: string };

export function CreateDraftForm({
  programs,
  schoolYears,
}: {
  programs: Program[];
  schoolYears: SchoolYear[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createCurriculumVersionAction(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
      if ("versionId" in result && result.versionId) {
        router.push(`/registrar/curriculum?versionId=${result.versionId}`);
      }
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Create draft
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="text-neutral-900 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-neutral-900">Create draft curriculum</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div>
              <label className="text-sm font-medium text-neutral-900">Program *</label>
              <select
                name="programId"
                required
                className="mt-1 w-full rounded border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
              >
                <option value="">Select program</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} – {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-900">School year *</label>
              <select
                name="schoolYearId"
                required
                className="mt-1 w-full rounded border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
              >
                <option value="">Select school year</option>
                {schoolYears.map((sy) => (
                  <option key={sy.id} value={sy.id}>
                    {sy.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-900">Name *</label>
              <input
                name="name"
                type="text"
                required
                placeholder="e.g. BSIT Curriculum AY 2024-2025"
                className="mt-1 w-full rounded border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-500"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="text-neutral-900"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
