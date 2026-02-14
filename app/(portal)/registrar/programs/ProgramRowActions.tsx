"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import { updateProgramAction, toggleProgramActiveAction } from "./actions";

type Program = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
};

export function ProgramRowActions({ program }: { program: Program }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateProgramAction(program.id, formData);
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
    await toggleProgramActiveAction(program.id, !program.active);
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
          <Label htmlFor="code" className="text-xs">
            Code
          </Label>
          <Input
            id="code"
            name="code"
            defaultValue={program.code}
            className="h-8 text-sm"
            required
          />
        </div>
        <div>
          <Label htmlFor="name" className="text-xs">
            Name
          </Label>
          <Input
            id="name"
            name="name"
            defaultValue={program.name}
            className="h-8 text-sm"
            required
          />
        </div>
        <div>
          <Label htmlFor="description" className="text-xs">
            Description
          </Label>
          <Input
            id="description"
            name="description"
            defaultValue={program.description ?? ""}
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
        {program.active ? "Deactivate" : "Activate"}
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
