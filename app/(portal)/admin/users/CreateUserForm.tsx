"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { createUserAction } from "./actions";

const ROLES = [
  { value: "student", label: "Student" },
  { value: "registrar", label: "Registrar" },
  { value: "admin", label: "Admin" },
  { value: "teacher", label: "Teacher" },
  { value: "finance", label: "Finance" },
  { value: "program_head", label: "Program Head" },
  { value: "dean", label: "Dean" },
];

export function CreateUserForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await createUserAction(formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
    e.currentTarget.reset();
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Create User
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border bg-white p-4 shadow-sm"
    >
      <h3 className="font-semibold text-[#6A0000]">Create Test User</h3>
      <p className="text-xs text-neutral-800">
        Creates an auth user + profile. Skips email verification (for testing).
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="user@test.local"
          />
        </div>
        <div>
          <Label htmlFor="password">Password *</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="Min 8 characters"
          />
        </div>
        <div>
          <Label htmlFor="fullName">Full Name *</Label>
          <Input id="fullName" name="fullName" required placeholder="John Doe" />
        </div>
        <div>
          <Label htmlFor="role">Role *</Label>
          <select
            id="role"
            name="role"
            required
            className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm text-neutral-900"
          >
            <option value="">Select role</option>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          Create User
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(false)}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
