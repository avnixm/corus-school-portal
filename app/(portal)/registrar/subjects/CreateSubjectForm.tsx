"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { createSubjectAction } from "./actions";

export function CreateSubjectForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await createSubjectAction(formData);
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
        Add Subject
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border bg-white p-4 shadow-sm"
    >
      <h3 className="font-semibold text-[#6A0000]">Create Subject</h3>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="code">Code *</Label>
          <Input id="code" name="code" required placeholder="e.g. CC 101" />
        </div>
        <div>
          <Label htmlFor="description">Description *</Label>
          <Input
            id="description"
            name="description"
            required
            placeholder="e.g. Introduction to Programming"
          />
        </div>
        <div>
          <Label htmlFor="units">Units</Label>
          <Input id="units" name="units" type="number" step="0.5" placeholder="3" />
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
