"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { createSectionAction } from "./actions";

export function CreateSectionForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await createSectionAction(formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Section
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border bg-white p-4 shadow-sm"
    >
      <h3 className="font-semibold text-[#6A0000]">Create Section</h3>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input id="name" name="name" required placeholder="e.g. 1-A" />
        </div>
        <div>
          <Label htmlFor="yearLevel">Year Level</Label>
          <Input id="yearLevel" name="yearLevel" placeholder="e.g. 1" />
        </div>
        <div>
          <Label htmlFor="program">Program</Label>
          <Input id="program" name="program" placeholder="e.g. BSIT" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          Create
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(false)}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
