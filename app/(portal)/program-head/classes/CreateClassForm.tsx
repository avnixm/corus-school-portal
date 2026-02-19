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
import { createClassAction } from "./actions";

type Program = { id: string; code: string; name: string };

export function CreateClassForm({ programs }: { programs: Program[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await createClassAction(formData);
    setPending(false);
    if (result && "error" in result) {
      setError(result.error ?? null);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Class
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Class</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div>
              <Label htmlFor="programId">Program *</Label>
              <select
                id="programId"
                name="programId"
                required
                className="mt-1 flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
              >
                <option value="">Select program</option>
                {programs.filter((p) => p.id).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} – {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="yearLevel">Year Level *</Label>
                <Input
                  id="yearLevel"
                  name="yearLevel"
                  required
                  placeholder="e.g. 1"
                  className="mt-1 h-10"
                />
              </div>
              <div>
                <Label htmlFor="name">Section Name *</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  placeholder="e.g. 1-A"
                  className="mt-1 h-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="maxCapacity">Max students per class</Label>
              <Input
                id="maxCapacity"
                name="maxCapacity"
                type="number"
                min={0}
                placeholder="Leave empty for default (40)"
                className="mt-1 h-10"
              />
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
