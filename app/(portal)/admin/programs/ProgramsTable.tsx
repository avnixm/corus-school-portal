"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  createProgramAction,
  updateProgramAction,
  toggleProgramActiveAction,
  deleteProgramAction,
} from "./actions";
import { Pencil, Trash2 } from "lucide-react";
type Program = { id: string; code: string; name: string; active: boolean };

export function ProgramsTable({ programs }: { programs: Program[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editProgram, setEditProgram] = useState<Program | null>(null);
  const [deleteProgram, setDeleteProgram] = useState<Program | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await createProgramAction(formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    form?.reset();
    setOpen(false);
    router.refresh();
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    if (!editProgram) return;
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("active", editProgram.active ? "true" : "false");
    const result = await updateProgramAction(editProgram.id, formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setEditProgram(null);
    router.refresh();
  }

  async function handleDeleteConfirm() {
    if (!deleteProgram) return;
    setPending(true);
    const result = await deleteProgramAction(deleteProgram.id, deleteProgram.code);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setDeleteProgram(null);
    router.refresh();
  }

  async function handleToggle(id: string, active: boolean) {
    await toggleProgramActiveAction(id, !active);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Button onClick={() => setOpen(true)}>Add Program</Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setError(null); }}>
        <DialogContent className="text-neutral-900">
          <DialogHeader>
            <DialogTitle className="text-[#6A0000]">Add Program</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="add-code" className="text-neutral-800">Code</Label>
                <Input
                  id="add-code"
                  name="code"
                  required
                  placeholder="e.g. BSIT"
                  className="mt-1 text-neutral-900"
                />
              </div>
              <div>
                <Label htmlFor="add-name" className="text-neutral-800">Name</Label>
                <Input
                  id="add-name"
                  name="name"
                  required
                  placeholder="Bachelor of Science in IT"
                  className="mt-1 text-neutral-900"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editProgram} onOpenChange={(v) => { if (!v) setEditProgram(null); setError(null); }}>
        <DialogContent className="text-neutral-900">
          <DialogHeader>
            <DialogTitle className="text-[#6A0000]">Edit Program</DialogTitle>
          </DialogHeader>
          {editProgram && (
            <form onSubmit={handleEdit} className="space-y-4">
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="edit-code" className="text-neutral-800">Code</Label>
                  <Input
                    id="edit-code"
                    name="code"
                    required
                    defaultValue={editProgram.code}
                    className="mt-1 text-neutral-900"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-name" className="text-neutral-800">Name</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    required
                    defaultValue={editProgram.name}
                    className="mt-1 text-neutral-900"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditProgram(null)} disabled={pending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>Save</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteProgram} onOpenChange={(v) => { if (!v) setDeleteProgram(null); setError(null); }}>
        <DialogContent className="text-neutral-900">
          <DialogHeader>
            <DialogTitle className="text-[#6A0000]">Delete Program</DialogTitle>
          </DialogHeader>
          {deleteProgram && (
            <div className="space-y-4">
              {error && <p className="text-sm text-red-600">{error}</p>}
              <p className="text-sm text-neutral-800">
                Delete <strong>{deleteProgram.code}</strong> ({deleteProgram.name})? This cannot be undone.
                If program head assignments exist for this program, unassign them first.
              </p>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDeleteProgram(null)} disabled={pending}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={handleDeleteConfirm}
                  disabled={pending}
                >
                  {pending ? "Deleting…" : "Delete"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="overflow-hidden rounded-xl border bg-white text-sm text-neutral-900">
        <table className="min-w-full text-left">
          <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
            <tr>
              <th className="px-4 py-2">Code</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Active</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {programs.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="px-4 py-2 font-medium text-neutral-900">{p.code}</td>
                <td className="px-4 py-2 text-neutral-900">{p.name}</td>
                <td className="px-4 py-2">
                  <Button
                    type="button"
                    variant={p.active ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleToggle(p.id, p.active)}
                  >
                    {p.active ? "Active" : "Inactive"}
                  </Button>
                </td>
                  <td className="px-4 py-2">
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-neutral-700 hover:text-[#6A0000]"
                      onClick={() => { setEditProgram(p); setError(null); }}
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-neutral-700 hover:text-red-600"
                      onClick={() => { setDeleteProgram(p); setError(null); }}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {programs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-neutral-600">
                  No programs. Add one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
