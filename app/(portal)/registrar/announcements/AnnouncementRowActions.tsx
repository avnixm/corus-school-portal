"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2 } from "lucide-react";
import { updateAnnouncementAction, deleteAnnouncementAction } from "./actions";

const AUDIENCE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "students", label: "Students" },
  { value: "teachers", label: "Teachers" },
  { value: "registrar", label: "Registrar" },
  { value: "finance", label: "Finance" },
  { value: "program_head", label: "Program Head" },
  { value: "dean", label: "Dean" },
];

type Announcement = {
  id: string;
  title: string;
  body: string;
  audience: string;
};

export function AnnouncementRowActions({
  announcement,
}: {
  announcement: Announcement;
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
    const result = await updateAnnouncementAction(announcement.id, formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Delete this announcement?")) return;
    setPending(true);
    await deleteAnnouncementAction(announcement.id);
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
          <Label htmlFor="title" className="text-xs">Title</Label>
          <Input
            id="title"
            name="title"
            defaultValue={announcement.title}
            className="h-8 text-sm"
            required
          />
        </div>
        <div>
          <Label htmlFor="body" className="text-xs">Body</Label>
          <textarea
            id="body"
            name="body"
            defaultValue={announcement.body}
            rows={3}
            className="flex w-full rounded-md border border-neutral-200 px-2 py-1 text-sm"
            required
          />
        </div>
        <div>
          <Label htmlFor="audience" className="text-xs">Audience</Label>
          <select
            id="audience"
            name="audience"
            defaultValue={announcement.audience}
            className="mt-1 h-8 w-full rounded-md border border-neutral-200 bg-white px-2 text-sm text-neutral-900"
          >
            {AUDIENCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
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
        onClick={handleDelete}
        disabled={pending}
        className="h-8 gap-1 text-red-600 hover:bg-red-50"
      >
        <Trash2 className="h-3 w-3" />
        Delete
      </Button>
    </div>
  );
}
