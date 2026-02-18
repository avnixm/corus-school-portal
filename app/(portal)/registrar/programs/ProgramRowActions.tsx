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
import { updateProgramAction, toggleProgramActiveAction } from "./actions";

type Program = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
};

export function ProgramRowActions({ program }: { program: Program }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateProgramAction(program.id, formData);
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
    await toggleProgramActiveAction(program.id, !program.active);
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
          {program.active ? "Deactivate" : "Activate"}
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
            <DialogTitle className="text-[#6A0000]">Edit Program</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor={`edit-code-${program.id}`}>Code *</Label>
                <Input
                  id={`edit-code-${program.id}`}
                  name="code"
                  defaultValue={program.code}
                  required
                  className="mt-1 h-10"
                />
              </div>
              <div>
                <Label htmlFor={`edit-name-${program.id}`}>Name *</Label>
                <Input
                  id={`edit-name-${program.id}`}
                  name="name"
                  defaultValue={program.name}
                  required
                  className="mt-1 h-10"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor={`edit-description-${program.id}`}>
                  Description
                </Label>
                <Input
                  id={`edit-description-${program.id}`}
                  name="description"
                  defaultValue={program.description ?? ""}
                  placeholder="Optional"
                  className="mt-1 h-10"
                />
              </div>
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
