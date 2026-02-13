"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateUserRoleAction, type ValidRole } from "./actions";

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

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const role = e.target.value;
    if (!role || role === currentRole) return;

    setPending(true);
    const result = await updateUserRoleAction(profileId, role);
    setPending(false);

    if (result?.error) {
      // Could show toast; for now just refresh to reset
    }
    router.refresh();
  }

  return (
    <select
      value={currentRole}
      onChange={handleChange}
      disabled={pending}
      className={`rounded px-2 py-0.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#6A0000]/40 ${
        currentRole === "admin"
          ? "bg-amber-100 text-amber-800"
          : currentRole === "registrar"
          ? "bg-[#6A0000]/10 text-[#6A0000]"
          : "bg-neutral-100 text-neutral-800"
      } ${pending ? "opacity-70 cursor-wait" : "cursor-pointer"}`}
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {ROLE_LABELS[r] ?? r}
        </option>
      ))}
    </select>
  );
}
