"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import { updateSectionAction, toggleSectionActiveAction } from "./actions";

type Program = { id: string; code: string; name: string };
type Section = {
  id: string;
  programId: string | null;
  name: string;
  yearLevel: string | null;
  gradeLevel: string | null;
  programCode: string | null;
  active: boolean;
};

export function SectionRowActions({
  section,
  programs,
}: {
  section: Section;
  programs: Program[];
}) {
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

  async function handleToggle() {
    setPending(true);
    await toggleSectionActiveAction(section.id, !section.active);
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
          <Label htmlFor="programId" className="text-xs">
            Program
          </Label>
          <select
            id="programId"
            name="programId"
            defaultValue={section.programId ?? ""}
            className="mt-1 h-8 w-full rounded border border-neutral-200 bg-white px-2 text-sm text-neutral-900"
            required
          >
            <option value="">Select</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="name" className="text-xs">
            Name
          </Label>
          <Input
            id="name"
            name="name"
            defaultValue={section.name}
            className="h-8 text-sm"
            required
          />
        </div>
        <div>
          <Label htmlFor="yearLevel" className="text-xs">
            Year Level
          </Label>
          <Input
            id="yearLevel"
            name="yearLevel"
            defaultValue={section.yearLevel ?? section.gradeLevel ?? ""}
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
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        disabled={pending}
        className="h-8 text-xs"
      >
        {section.active ? "Deactivate" : "Activate"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setEditing(true)}
        className="h-8 gap-1"
      >
        <Pencil className="h-3 w-3" />
        Edit
      </Button>
    </div>
  );
}
