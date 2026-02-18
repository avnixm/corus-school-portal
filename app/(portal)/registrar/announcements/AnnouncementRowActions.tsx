"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";
import { updateAnnouncementAction, deleteAnnouncementAction } from "./actions";
import { toast } from "sonner";

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
  createdByUserId: string;
};

export function AnnouncementRowActions({
  announcement,
  currentUserId,
  currentUserRole,
}: {
  announcement: Announcement;
  currentUserId: string;
  currentUserRole: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user can edit/delete
  const canModify = currentUserRole === "admin" || announcement.createdByUserId === currentUserId;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateAnnouncementAction(announcement.id, formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success("Announcement updated");
    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    setPending(true);
    const result = await deleteAnnouncementAction(announcement.id);
    setPending(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Announcement deleted");
    setDeleteOpen(false);
    router.refresh();
  }

  // Don't show buttons if user can't modify
  if (!canModify) {
    return null;
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
        onClick={() => setDeleteOpen(true)}
        disabled={pending}
        className="h-8 gap-1 text-red-600 hover:bg-red-50"
      >
        <Trash2 className="h-3 w-3" />
        Delete
      </Button>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete announcement</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{announcement.title}&quot;? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={pending}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {pending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
