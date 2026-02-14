"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createStudent } from "./actions";

export function CreateStudentForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await createStudent(formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Student
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Student</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <p className="text-xs text-neutral-600">
              Student ID will be auto-assigned (e.g. 2025-0001) when you create.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" name="firstName" required className="mt-1 h-10" />
              </div>
              <div>
                <Label htmlFor="middleName">Middle Name</Label>
                <Input id="middleName" name="middleName" className="mt-1 h-10" />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" name="lastName" required className="mt-1 h-10" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" className="mt-1 h-10" />
              </div>
              <div>
                <Label htmlFor="contactNo">Contact No</Label>
                <Input id="contactNo" name="contactNo" className="mt-1 h-10" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
              <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
