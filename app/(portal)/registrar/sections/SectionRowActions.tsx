"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import { updateSectionAction, toggleSectionActiveAction } from "./actions";

type Program = { id: string; code: string; name: string };
type Section = {
  id: string;
  programId: string | null;
  name: string;
  yearLevel: string | null;
  gradeLevel: string | null;
  programCode: string | null;
  active: boolean;
};

export function SectionRowActions({
  section,
  programs,
}: {
  section: Section;
  programs: Program[];
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateSectionAction(section.id, formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setEditOpen(false);
    router.refresh();
  }

  async function handleToggle() {
    setPending(true);
    await toggleSectionActiveAction(section.id, !section.active);
    setPending(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          disabled={pending}
          className="h-8 text-xs"
        >
          {section.active ? "Deactivate" : "Activate"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditOpen(true)}
          className="h-8 gap-1"
        >
          <Pencil className="h-3 w-3" />
          Edit
        </Button>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#6A0000]">Edit Section</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div>
              <Label htmlFor={`edit-programId-${section.id}`}>Program *</Label>
              <select
                id={`edit-programId-${section.id}`}
                name="programId"
                defaultValue={section.programId ?? ""}
                className="mt-1 flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
                required
              >
                <option value="">Select</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor={`edit-name-${section.id}`}>Name *</Label>
              <Input
                id={`edit-name-${section.id}`}
                name="name"
                defaultValue={section.name}
                required
                className="mt-1 h-10"
              />
            </div>
            <div>
              <Label htmlFor={`edit-yearLevel-${section.id}`}>Year Level</Label>
              <Input
                id={`edit-yearLevel-${section.id}`}
                name="yearLevel"
                defaultValue={section.yearLevel ?? section.gradeLevel ?? ""}
                className="mt-1 h-10"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
