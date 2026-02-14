"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import { updateRequirementAction } from "./actions";
import type { requirements } from "@/db/schema";

type RequirementRow = typeof requirements.$inferSelect;

export function EditRequirementForm({ requirement }: { requirement: RequirementRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileTypesStr = Array.isArray(requirement.allowedFileTypes)
    ? (requirement.allowedFileTypes as string[]).join(", ")
    : "";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateRequirementAction(requirement.id, formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setError(null); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-[#6A0000] hover:bg-[#6A0000]/10">
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-[#6A0000]">Edit requirement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="edit-code">Code *</Label>
              <Input
                id="edit-code"
                name="code"
                required
                defaultValue={requirement.code}
                placeholder="e.g. BIRTH_CERT"
                className="uppercase"
              />
            </div>
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                name="name"
                required
                defaultValue={requirement.name}
                placeholder="e.g. Birth Certificate"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Input
              id="edit-description"
              name="description"
              defaultValue={requirement.description ?? ""}
              placeholder="Optional"
            />
          </div>
          <div>
            <Label htmlFor="edit-instructions">Instructions (what to upload, how to scan)</Label>
            <Textarea
              id="edit-instructions"
              name="instructions"
              defaultValue={requirement.instructions ?? ""}
              placeholder="Optional"
              rows={2}
              className="resize-none"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="edit-allowedFileTypes">Allowed file types (comma-separated)</Label>
              <Input
                id="edit-allowedFileTypes"
                name="allowedFileTypes"
                defaultValue={fileTypesStr}
                placeholder="pdf, jpg, png"
              />
            </div>
            <div>
              <Label htmlFor="edit-maxFiles">Max files</Label>
              <Input
                id="edit-maxFiles"
                name="maxFiles"
                type="number"
                min={1}
                defaultValue={requirement.maxFiles}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit-isActive"
              name="isActive"
              value="true"
              defaultChecked={requirement.isActive}
              className="h-4 w-4 rounded border-neutral-300"
            />
            <Label htmlFor="edit-isActive">Active</Label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending} className="bg-[#6A0000] hover:bg-[#6A0000]/90">
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
