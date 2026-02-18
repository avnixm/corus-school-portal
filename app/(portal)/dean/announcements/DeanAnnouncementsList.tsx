"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  createDeanAnnouncement,
  updateDeanAnnouncement,
  deleteDeanAnnouncement,
  toggleDeanAnnouncementPinned,
} from "./actions";
import { getRoleDisplayLabel } from "@/lib/announcements/roleLabel";
import { Pin, PinOff, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const AUDIENCES = [
  "all",
  "students",
  "teachers",
  "registrar",
  "finance",
  "program_head",
  "dean",
] as const;

type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  audience: string;
  program: string | null;
  pinned: boolean;
  createdAt: Date | null;
  createdByRole?: string | null;
  createdByUserId: string;
};

export function DeanAnnouncementsList({
  initialAnnouncements,
  currentUserId,
  currentUserRole,
}: {
  initialAnnouncements: AnnouncementRow[];
  currentUserId: string;
  currentUserRole: string;
}) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  async function handleCreate(formData: FormData) {
    const result = await createDeanAnnouncement(formData);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Announcement created");
    setCreateOpen(false);
    window.location.reload();
  }

  async function handleUpdate(id: string, formData: FormData) {
    const result = await updateDeanAnnouncement(id, formData);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Announcement updated");
    setEditingId(null);
    window.location.reload();
  }

  async function handleDelete(id: string) {
    setDeletePending(true);
    const result = await deleteDeanAnnouncement(id);
    setDeletePending(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Announcement deleted");
    setDeleteId(null);
    window.location.reload();
  }

  async function handleTogglePin(id: string, pinned: boolean) {
    const result = await toggleDeanAnnouncementPinned(id, pinned);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(pinned ? "Announcement pinned" : "Announcement unpinned");
    window.location.reload();
  }

  // Check if user can edit/delete an announcement
  function canModify(announcement: AnnouncementRow): boolean {
    return currentUserRole === "admin" || announcement.createdByUserId === currentUserId;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold text-neutral-900">
          All Announcements
        </CardTitle>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">Create</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Announcement</DialogTitle>
            </DialogHeader>
            <form action={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <input
                  id="title"
                  name="title"
                  required
                  className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="body">Body</Label>
                <textarea
                  id="body"
                  name="body"
                  required
                  rows={4}
                  className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="audience">Audience</Label>
                <select
                  id="audience"
                  name="audience"
                  className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
                >
                  {AUDIENCES.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="program">Program (optional)</Label>
                <input
                  id="program"
                  name="program"
                  className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="pinned" name="pinned" value="on" />
                <Label htmlFor="pinned">Pinned</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {announcements.map((a) => {
            const userCanModify = canModify(a);
            return (
              <div
                key={a.id}
                className="rounded-lg border p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase text-[#6A0000]">
                        {getRoleDisplayLabel(a.createdByRole)}
                      </span>
                      {a.pinned && (
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs uppercase text-amber-800">
                          Pinned
                        </span>
                      )}
                      <span className="font-medium text-[#6A0000]">{a.title}</span>
                      <span className="text-xs text-neutral-500">{a.audience}</span>
                      {a.program && (
                        <span className="text-xs text-neutral-500">· {a.program}</span>
                      )}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-800">{a.body}</p>
                    <p className="mt-2 text-xs text-neutral-500">
                      {a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}
                    </p>
                  </div>
                  {userCanModify && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTogglePin(a.id, !a.pinned)}
                        title={a.pinned ? "Unpin" : "Pin"}
                      >
                        {a.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(editingId === a.id ? null : a.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(a.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  )}
                </div>
                {editingId === a.id && (
                  <Dialog open={editingId === a.id} onOpenChange={(open) => !open && setEditingId(null)}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Announcement</DialogTitle>
                      </DialogHeader>
                      <form
                        action={(fd) => handleUpdate(a.id, fd)}
                        className="space-y-4"
                      >
                        <div>
                          <Label htmlFor="edit-title">Title</Label>
                          <input
                            id="edit-title"
                            name="title"
                            defaultValue={a.title}
                            required
                            className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-body">Body</Label>
                          <textarea
                            id="edit-body"
                            name="body"
                            defaultValue={a.body}
                            required
                            rows={4}
                            className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-audience">Audience</Label>
                          <select
                            id="edit-audience"
                            name="audience"
                            defaultValue={a.audience}
                            className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
                          >
                            {AUDIENCES.map((aud) => (
                              <option key={aud} value={aud}>
                                {aud}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="edit-program">Program (optional)</Label>
                          <input
                            id="edit-program"
                            name="program"
                            defaultValue={a.program ?? ""}
                            className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="edit-pinned"
                            name="pinned"
                            value="on"
                            defaultChecked={a.pinned}
                          />
                          <Label htmlFor="edit-pinned">Pinned</Label>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setEditingId(null)}>
                            Cancel
                          </Button>
                          <Button type="submit">Save</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            );
          })}
          {deleteId && (
            <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete announcement</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this announcement? This cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deletePending}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleDelete(deleteId)}
                    disabled={deletePending}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    {deletePending ? "Deleting…" : "Delete"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {announcements.length === 0 && (
            <p className="py-8 text-center text-sm text-neutral-600">No announcements yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
