"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const ROLES = [
  { value: "", label: "All roles" },
  { value: "student", label: "Student" },
  { value: "teacher", label: "Teacher" },
  { value: "registrar", label: "Registrar" },
  { value: "finance", label: "Finance" },
  { value: "program_head", label: "Program Head" },
  { value: "dean", label: "Dean" },
  { value: "admin", label: "Admin" },
];

export function UserManagementSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const q = (form.elements.namedItem("q") as HTMLInputElement)?.value?.trim() ?? "";
    const role = (form.elements.namedItem("role") as HTMLSelectElement)?.value ?? "";
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (role) p.set("role", role);
    router.push(`/admin/users?${p.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
      <div className="min-w-[200px]">
        <Label htmlFor="search-q" className="sr-only">
          Search
        </Label>
        <Input
          id="search-q"
          name="q"
          defaultValue={searchParams.get("q") ?? ""}
          placeholder="User ID, name, or email"
          className="h-9"
        />
      </div>
      <div className="min-w-[140px]">
        <Label htmlFor="search-role" className="sr-only">
          Role
        </Label>
        <select
          id="search-role"
          name="role"
          defaultValue={searchParams.get("role") ?? ""}
          className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm"
        >
          {ROLES.map((r) => (
            <option key={r.value || "all"} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" size="sm">
        Search
      </Button>
    </form>
  );
}
