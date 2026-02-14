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
import { createAnnouncementAction } from "./actions";

const AUDIENCE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "students", label: "Students" },
  { value: "teachers", label: "Teachers" },
  { value: "registrar", label: "Registrar" },
  { value: "finance", label: "Finance" },
  { value: "program_head", label: "Program Head" },
  { value: "dean", label: "Dean" },
];

export function CreateAnnouncementForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await createAnnouncementAction(formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Announcement
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Announcement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input id="title" name="title" required placeholder="Announcement title" className="mt-1 h-10" />
            </div>
            <div>
              <Label htmlFor="body">Body *</Label>
              <textarea
                id="body"
                name="body"
                required
                rows={4}
                placeholder="Announcement content..."
                className="mt-1 flex w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="audience">Audience</Label>
              <select
                id="audience"
                name="audience"
                className="mt-1 flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
              >
                {AUDIENCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
              <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
