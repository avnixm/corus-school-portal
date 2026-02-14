"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateTeacherSubjectPermissionAction } from "@/app/(portal)/registrar/teachers/actions";

type Permission = {
  id: string;
  subjectId: string;
  subjectCode: string;
  subjectTitle: string;
  notes: string | null;
};

export function EditCourseNoteDialog({
  teacherId,
  permission,
  onClose,
}: {
  teacherId: string;
  permission: Permission;
  onClose: () => void;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(permission.notes || "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const result = await updateTeacherSubjectPermissionAction(teacherId, permission.subjectId, {
      notes: notes.trim() || null,
    });
    setSubmitting(false);
    
    if (result?.error) {
      alert(result.error);
    } else {
      router.refresh();
      onClose();
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#6A0000]">
            Edit Course Note
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm">
            <p className="font-medium text-[#6A0000]">{permission.subjectCode}</p>
            <p className="text-neutral-700">{permission.subjectTitle}</p>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this course authorization..."
              className="mt-1"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="bg-[#6A0000] hover:bg-[#6A0000]/90">
              {submitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
