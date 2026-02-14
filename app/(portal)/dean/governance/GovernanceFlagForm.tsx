"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { createFlagAction } from "./actions";

const FLAG_TYPES = [
  "finance_hold",
  "academic_hold",
  "disciplinary_hold",
  "exception",
] as const;

export function GovernanceFlagForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    const result = await createFlagAction(formData);
    if (result.error) {
      alert(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Create Flag</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Governance Flag</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="flagType">Flag Type</Label>
            <select
              id="flagType"
              name="flagType"
              required
              className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
            >
              {FLAG_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="enrollmentId">Enrollment ID (optional)</Label>
            <input
              id="enrollmentId"
              name="enrollmentId"
              className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
              placeholder="uuid"
            />
          </div>
          <div>
            <Label htmlFor="studentId">Student ID (optional)</Label>
            <input
              id="studentId"
              name="studentId"
              className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
              placeholder="uuid"
            />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
            />
          </div>
          <p className="text-xs text-neutral-500">
            Provide at least one of Enrollment ID or Student ID.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
