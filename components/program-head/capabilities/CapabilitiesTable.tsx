"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import { Pencil, Trash2 } from "lucide-react";
import { removeCapabilityLineAction, updateCapabilityLineNotesAction } from "@/app/(portal)/program-head/teacher-capabilities/actions";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";

type Line = {
  id: string;
  teacherId: string;
  subjectId: string;
  teacherFirstName: string;
  teacherLastName: string;
  teacherDepartmentProgramId: string | null;
  subjectCode: string;
  subjectTitle: string;
  capabilityType: string;
  status: string;
  notes: string | null;
};

function TypeBadge({ type }: { type: string }) {
  if (type === "major_department") return <Badge className="bg-neutral-100 text-neutral-800">Major</Badge>;
  if (type === "ge") return <Badge className="bg-blue-100 text-blue-800">GE</Badge>;
  return <Badge className="bg-amber-100 text-amber-800">Cross</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active") return <Badge className="bg-green-100 text-green-800">Active</Badge>;
  return <Badge variant="outline">Pending</Badge>;
}

export function CapabilitiesTable({
  lines,
  packageStatus,
  onRemove,
  onUpdateNote,
}: {
  lines: Line[];
  packageStatus: string;
  onRemove: () => void;
  onUpdateNote: () => void;
}) {
  const [editingLine, setEditingLine] = useState<Line | null>(null);
  const [noteValue, setNoteValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Line | null>(null);
  const [pending, setPending] = useState(false);
  const canEdit = packageStatus === "draft";

  async function handleSaveNote() {
    if (!editingLine) return;
    setPending(true);
    await updateCapabilityLineNotesAction(editingLine.id, noteValue.trim() || null);
    setPending(false);
    setEditingLine(null);
    onUpdateNote();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setPending(true);
    await removeCapabilityLineAction(deleteTarget.id);
    setPending(false);
    setDeleteTarget(null);
    onRemove();
  }

  function openEditNote(line: Line) {
    setEditingLine(line);
    setNoteValue(line.notes ?? "");
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border bg-white/80 text-neutral-900">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
            <tr>
              <th className="px-4 py-2">Teacher</th>
              <th className="px-4 py-2">Department</th>
              <th className="px-4 py-2">Subject</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Notes</th>
              <th className="px-4 py-2">Status</th>
              {canEdit && <th className="px-4 py-2 text-center">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id} className="border-b last:border-0 hover:bg-neutral-50/80">
                <td className="px-4 py-2 font-medium">
                  {line.teacherFirstName} {line.teacherLastName}
                </td>
                <td className="px-4 py-2">
                  {line.teacherDepartmentProgramId ? (
                    <Badge variant="outline" className="font-normal">Dept</Badge>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-2">
                  {line.subjectCode} – {line.subjectTitle}
                </td>
                <td className="px-4 py-2">
                  <TypeBadge type={line.capabilityType} />
                </td>
                <td className="px-4 py-2">
                  <span className="text-xs text-neutral-600">{line.notes || "—"}</span>
                </td>
                <td className="px-4 py-2">
                  <StatusBadge status={line.status} />
                </td>
                {canEdit && (
                  <td className="px-4 py-2">
                    <div className="flex justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditNote(line)}
                        className="rounded p-1 hover:bg-neutral-100"
                        title="Edit note"
                      >
                        <Pencil className="h-3.5 w-3.5 text-neutral-600" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(line)}
                        className="rounded p-1 hover:bg-red-50"
                        title="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-600" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {lines.length === 0 && (
        <p className="py-8 text-center text-sm text-neutral-600">
          No capability lines. Click &quot;Add Capabilities&quot; to add.
        </p>
      )}

      <Dialog open={!!editingLine} onOpenChange={(open) => !open && setEditingLine(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
          </DialogHeader>
          {editingLine && (
            <p className="text-sm text-neutral-600">
              {editingLine.subjectCode} – {editingLine.teacherFirstName} {editingLine.teacherLastName}
            </p>
          )}
          <div>
            <Label htmlFor="capability-note">Notes</Label>
            <Input
              id="capability-note"
              value={noteValue}
              onChange={(e) => setNoteValue(e.target.value)}
              placeholder="Notes"
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingLine(null)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveNote} disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {deleteTarget && (
        <DeleteConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="Remove capability line"
          itemLabel={`${deleteTarget.subjectCode} – ${deleteTarget.teacherFirstName} ${deleteTarget.teacherLastName}`}
          onConfirm={handleDelete}
          pending={pending}
        />
      )}
    </>
  );
}
