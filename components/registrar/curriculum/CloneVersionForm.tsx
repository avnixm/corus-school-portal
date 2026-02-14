// path: components/registrar/curriculum/CloneVersionForm.tsx
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
import { cloneCurriculumVersionAction } from "@/app/(portal)/registrar/curriculum/actions";
import { Loader2 } from "lucide-react";

type Version = {
  id: string;
  name: string;
  programCode: string | null;
  schoolYearName: string | null;
  status: string;
};
type Program = { id: string; code: string; name: string };
type SchoolYear = { id: string; name: string };

export function CloneVersionForm({
  versions,
  programs,
  schoolYears,
}: {
  versions: Version[];
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
      const result = await cloneCurriculumVersionAction(formData);
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
        Clone from previous
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="text-neutral-900 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-neutral-900">Clone curriculum version</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div>
              <label className="text-sm font-medium text-neutral-900">Source version *</label>
              <select
                name="fromVersionId"
                required
                className="mt-1 w-full rounded border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
              >
                <option value="">Select version to clone</option>
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.programCode} · {v.schoolYearName})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-900">New name *</label>
              <input
                name="name"
                type="text"
                required
                placeholder="e.g. BSIT Curriculum AY 2025-2026"
                className="mt-1 w-full rounded border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-900">Target program (optional)</label>
              <select
                name="programId"
                className="mt-1 w-full rounded border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
              >
                <option value="">Same as source</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-900">Target school year (optional)</label>
              <select
                name="schoolYearId"
                className="mt-1 w-full rounded border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
              >
                <option value="">Same as source</option>
                {schoolYears.map((sy) => (
                  <option key={sy.id} value={sy.id}>
                    {sy.name}
                  </option>
                ))}
              </select>
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
              <Button type="submit" disabled={pending || versions.length === 0}>
                {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Clone
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
