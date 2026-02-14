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
import { createProgramAction, updateProgramAction } from "@/app/(portal)/registrar/academic/actions";

type Program = { id: string; code: string; name: string; active: boolean };

export function ProgramDialog({
  open,
  onOpenChange,
  program,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: Program | null;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!program;

  useEffect(() => {
    if (!open) setError(null);
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("active", (form.querySelector<HTMLInputElement>('[name="active"]')?.checked ?? true) ? "true" : "false");
    const result = isEdit
      ? await updateProgramAction(program.id, formData)
      : await createProgramAction(formData);
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
          <DialogTitle>{isEdit ? "Edit Program" : "Add Program"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <Label htmlFor="program-code">Code *</Label>
            <Input
              id="program-code"
              name="code"
              required
              defaultValue={program?.code}
              placeholder="e.g. BSIT"
              className="mt-1 uppercase"
              onChange={(e) => (e.target.value = e.target.value.toUpperCase())}
            />
          </div>
          <div>
            <Label htmlFor="program-name">Name *</Label>
            <Input
              id="program-name"
              name="name"
              required
              defaultValue={program?.name}
              placeholder="e.g. Bachelor of Science in IT"
              className="mt-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="program-active"
              name="active"
              value="true"
              defaultChecked={program?.active ?? true}
              className="h-4 w-4 rounded border-neutral-300"
            />
            <Label htmlFor="program-active" className="font-normal text-neutral-700">
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
