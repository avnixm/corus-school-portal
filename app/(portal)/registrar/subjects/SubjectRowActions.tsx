"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import { updateSubjectAction, toggleSubjectActiveAction } from "./actions";

type Subject = {
  id: string;
  code: string;
  description: string;
  units: string | null;
  active: boolean;
};

export function SubjectRowActions({ subject }: { subject: Subject }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateSubjectAction(subject.id, formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  async function handleToggle() {
    setPending(true);
    await toggleSubjectActiveAction(subject.id, !subject.active);
    setPending(false);
    router.refresh();
  }

  if (editing) {
    return (
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 rounded border p-2"
      >
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div>
          <Label htmlFor="code" className="text-xs">Code</Label>
          <Input
            id="code"
            name="code"
            defaultValue={subject.code}
            className="h-8 text-sm"
            required
          />
        </div>
        <div>
          <Label htmlFor="description" className="text-xs">Description</Label>
          <Input
            id="description"
            name="description"
            defaultValue={subject.description}
            className="h-8 text-sm"
            required
          />
        </div>
        <div>
          <Label htmlFor="units" className="text-xs">Units</Label>
          <Input
            id="units"
            name="units"
            type="number"
            step="0.5"
            defaultValue={subject.units ?? ""}
            className="h-8 text-sm"
          />
        </div>
        <div className="flex gap-1">
          <Button type="submit" size="sm" disabled={pending}>
            Save
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEditing(false)}
            disabled={pending}
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setEditing(true)}
        className="h-8 gap-1"
      >
        <Pencil className="h-3 w-3" />
        Edit
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        disabled={pending}
        className="h-8"
      >
        {subject.active ? "Deactivate" : "Activate"}
      </Button>
    </div>
  );
}
