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
import { createScheduleTimeConfigAction } from "./actions";

type Program = { id: string; code: string; name: string };

export function CreateTimeConfigButton({ programs }: { programs: Program[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await createScheduleTimeConfigAction(formData);
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
        Create Time Configuration
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Schedule Time Configuration</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Regular Schedule 2025-2026"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="programId">Program *</Label>
              <select
                id="programId"
                name="programId"
                required
                className="mt-1 flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">Select program</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} – {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="startHour">Start Hour (24h) *</Label>
                <Input
                  id="startHour"
                  name="startHour"
                  type="number"
                  min="0"
                  max="23"
                  defaultValue="7"
                  required
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-neutral-500">e.g., 7 = 7:00 AM</p>
              </div>
              <div>
                <Label htmlFor="endHour">End Hour (24h) *</Label>
                <Input
                  id="endHour"
                  name="endHour"
                  type="number"
                  min="0"
                  max="23"
                  defaultValue="17"
                  required
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-neutral-500">e.g., 17 = 5:00 PM</p>
              </div>
            </div>
            <div>
              <Label htmlFor="timeIncrement">Time Increment (minutes) *</Label>
              <select
                id="timeIncrement"
                name="timeIncrement"
                defaultValue="30"
                className="mt-1 flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">60 minutes</option>
              </select>
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
