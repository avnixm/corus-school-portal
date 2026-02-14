"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { updateStudent } from "./actions";
import type { InferSelectModel } from "drizzle-orm";
import type { students } from "@/db/schema";

type Student = InferSelectModel<typeof students>;

export function EditStudentForm({ student }: { student: Student }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateStudent(student.id, formData);
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
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <Pencil className="h-4 w-4" />
        Edit
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="studentNo">Student No</Label>
                <Input id="studentNo" name="studentNo" defaultValue={student.studentCode ?? ""} className="mt-1 h-10" />
              </div>
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" name="firstName" defaultValue={student.firstName} required className="mt-1 h-10" />
              </div>
              <div>
                <Label htmlFor="middleName">Middle Name</Label>
                <Input id="middleName" name="middleName" defaultValue={student.middleName ?? ""} className="mt-1 h-10" />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" name="lastName" defaultValue={student.lastName} required className="mt-1 h-10" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={student.email ?? ""} className="mt-1 h-10" />
              </div>
              <div>
                <Label htmlFor="contactNo">Contact No</Label>
                <Input id="contactNo" name="contactNo" defaultValue={student.contactNo ?? ""} className="mt-1 h-10" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
              <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
