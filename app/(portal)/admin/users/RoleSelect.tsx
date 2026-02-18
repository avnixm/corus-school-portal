"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateUserRoleAction, type ValidRole } from "./actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const ROLE_LABELS: Record<string, string> = {
  student: "Student",
  registrar: "Registrar",
  admin: "Admin",
  teacher: "Teacher",
  finance: "Finance",
  program_head: "Program Head",
  dean: "Dean",
};

const ROLES: ValidRole[] = [
  "student",
  "registrar",
  "admin",
  "teacher",
  "finance",
  "program_head",
  "dean",
];

export function RoleSelect({
  profileId,
  currentRole,
}: {
  profileId: string;
  currentRole: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirmRole, setConfirmRole] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const role = e.target.value;
    if (!role || role === currentRole) return;
    setConfirmRole(role);
  }

  async function handleConfirm() {
    if (!confirmRole) return;
    setPending(true);
    const result = await updateUserRoleAction(profileId, confirmRole);
    setPending(false);
    setConfirmRole(null);
    if (!result?.error) router.refresh();
  }

  function getRoleColorClasses(role: string): string {
    switch (role) {
      case "admin":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "registrar":
        return "bg-[#6A0000]/10 text-[#6A0000] border-[#6A0000]/30";
      case "student":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "teacher":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "finance":
        return "bg-green-100 text-green-800 border-green-300";
      case "program_head":
        return "bg-indigo-100 text-indigo-800 border-indigo-300";
      case "dean":
        return "bg-teal-100 text-teal-800 border-teal-300";
      default:
        return "bg-neutral-100 text-neutral-800 border-neutral-300";
    }
  }

  return (
    <>
      <select
        value={currentRole}
        onChange={handleChange}
        disabled={pending}
        className={`rounded px-2 py-0.5 text-xs font-medium uppercase border focus:outline-none focus:ring-2 focus:ring-[#6A0000]/40 ${getRoleColorClasses(currentRole)} ${pending ? "opacity-70 cursor-wait" : "cursor-pointer"}`}
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r] ?? r}
          </option>
        ))}
      </select>

      <Dialog open={!!confirmRole} onOpenChange={() => setConfirmRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm role change</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-neutral-700">
            Change role to <strong>{confirmRole ? ROLE_LABELS[confirmRole] ?? confirmRole : ""}</strong>?
            This will be recorded in the audit log.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRole(null)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={pending}>
              {pending ? "Updating…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
