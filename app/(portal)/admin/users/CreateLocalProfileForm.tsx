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
import { createUserProfileAction } from "./actions";

const ROLES = [
  { value: "student", label: "Student" },
  { value: "registrar", label: "Registrar" },
  { value: "admin", label: "Admin" },
  { value: "teacher", label: "Teacher" },
  { value: "finance", label: "Finance" },
  { value: "program_head", label: "Program Head" },
  { value: "dean", label: "Dean" },
];

export function CreateLocalProfileForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await createUserProfileAction(formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
    e.currentTarget.reset();
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)} className="gap-2">
        Create Local Profile
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Local Profile</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-neutral-600">
            Link an existing auth user (by ID) to a profile with a role. Use when the user already exists in auth but has no profile.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="local-userId">User ID (auth) *</Label>
                <Input id="local-userId" name="userId" required placeholder="Auth user UUID" className="mt-1 h-10" />
              </div>
              <div>
                <Label htmlFor="local-role">Role *</Label>
                <select id="local-role" name="role" required className="mt-1 flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm">
                  <option value="">Select role</option>
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="local-name">Display Name</Label>
                <Input id="local-name" name="name" placeholder="Optional" className="mt-1 h-10" />
              </div>
              <div>
                <Label htmlFor="local-email">Email</Label>
                <Input id="local-email" name="email" type="email" placeholder="Optional" className="mt-1 h-10" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
              <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create Profile"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
