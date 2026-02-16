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
import { updateTeacherDepartmentAction } from "@/app/(portal)/registrar/teachers/actions";

type Program = { id: string; code: string; name: string };
type Teacher = {
  id: string;
  firstName: string;
  lastName: string;
  departmentProgramId: string | null;
};

export function EditTeacherDialog({
  teacher,
  programs,
  open,
  onOpenChange,
  onSuccess,
}: {
  teacher: Teacher;
  programs: Program[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [departmentProgramId, setDepartmentProgramId] = useState<string>(
    teacher.departmentProgramId ?? ""
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const result = await updateTeacherDepartmentAction(
      teacher.id,
      departmentProgramId || null
    );
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    onOpenChange(false);
    onSuccess?.();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Teacher</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <p className="text-sm text-neutral-600">
            {teacher.firstName} {teacher.lastName}
          </p>
          <div>
            <Label htmlFor="departmentProgramId">Department (Program)</Label>
            <select
              id="departmentProgramId"
              value={departmentProgramId}
              onChange={(e) => setDepartmentProgramId(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            >
              <option value="">— None —</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} – {p.name}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
