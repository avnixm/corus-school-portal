"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import { updateSectionAction } from "./actions";

type Section = {
  id: string;
  name: string;
  yearLevel: string | null;
  gradeLevel: string | null;
  program: string | null;
};

export function SectionRowActions({ section }: { section: Section }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateSectionAction(section.id, formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setEditing(false);
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
          <Label htmlFor="name" className="text-xs">Name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={section.name}
            className="h-8 text-sm"
            required
          />
        </div>
        <div>
          <Label htmlFor="yearLevel" className="text-xs">Year Level</Label>
          <Input
            id="yearLevel"
            name="yearLevel"
            defaultValue={section.yearLevel ?? section.gradeLevel ?? ""}
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="program" className="text-xs">Program</Label>
          <Input
            id="program"
            name="program"
            defaultValue={section.program ?? ""}
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
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setEditing(true)}
      className="h-8 gap-1"
    >
      <Pencil className="h-3 w-3" />
      Edit
    </Button>
  );
}
