"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
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
import { Plus } from "lucide-react";
import { createRequirementAction } from "./actions";

export function CreateRequirementForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await createRequirementAction(formData);
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
        <Button className="gap-2 bg-[#6A0000] hover:bg-[#6A0000]/90">
          <Plus className="h-4 w-4" />
          Add Requirement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-[#6A0000]">Create requirement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                name="code"
                required
                placeholder="e.g. BIRTH_CERT"
                className="uppercase"
              />
            </div>
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input id="name" name="name" required placeholder="e.g. Birth Certificate" />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" placeholder="Optional" />
          </div>
          <div>
            <Label htmlFor="instructions">Instructions (what to upload, how to scan)</Label>
            <Textarea
              id="instructions"
              name="instructions"
              placeholder="Optional"
              rows={2}
              className="resize-none"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="allowedFileTypes">Allowed file types (comma-separated)</Label>
              <Input
                id="allowedFileTypes"
                name="allowedFileTypes"
                placeholder="pdf, jpg, png"
                defaultValue="pdf, jpg, png"
              />
            </div>
            <div>
              <Label htmlFor="maxFiles">Max files</Label>
              <Input
                id="maxFiles"
                name="maxFiles"
                type="number"
                min={1}
                defaultValue={1}
              />
            </div>
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
            <LoadingButton type="submit" pending={pending} className="bg-[#6A0000] hover:bg-[#6A0000]/90">
              Create
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
