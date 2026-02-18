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
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setEditOpen(false);
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

  if (!canModify) {
    return null;
  }

  return (
    <>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditOpen(true)}
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
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div>
              <Label htmlFor={`edit-title-${announcement.id}`}>Title *</Label>
              <Input
                id={`edit-title-${announcement.id}`}
                name="title"
                defaultValue={announcement.title}
                required
                className="mt-1 h-10"
              />
            </div>
            <div>
              <Label htmlFor={`edit-body-${announcement.id}`}>Body *</Label>
              <textarea
                id={`edit-body-${announcement.id}`}
                name="body"
                defaultValue={announcement.body}
                rows={4}
                className="mt-1 flex w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <Label htmlFor={`edit-audience-${announcement.id}`}>Audience</Label>
              <select
                id={`edit-audience-${announcement.id}`}
                name="audience"
                defaultValue={announcement.audience}
                className="mt-1 flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
              >
                {AUDIENCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
    </>
  );
}
