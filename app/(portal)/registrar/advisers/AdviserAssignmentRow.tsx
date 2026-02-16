"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { assignAdviserAction } from "./actions";

type Teacher = { id: string; fullName: string | null; email: string | null };
type Row = {
  id: string;
  name: string;
  yearLevel: string | null;
  programCode: string | null;
  adviser: { teacherUserProfileId: string; adviserName: string | null } | null;
};

export function AdviserAssignmentRow({
  row,
  schoolYearId,
  teachers,
}: {
  row: Row;
  schoolYearId: string;
  teachers: Teacher[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const currentAdviserId = row.adviser?.teacherUserProfileId ?? "";

  async function handleChange(teacherUserProfileId: string) {
    setPending(true);
    const formData = new FormData();
    formData.set("sectionId", row.id);
    formData.set("schoolYearId", schoolYearId);
    formData.set("teacherUserProfileId", teacherUserProfileId);
    await assignAdviserAction(formData);
    setPending(false);
    router.refresh();
  }

  return (
    <tr className="border-b last:border-0 hover:bg-neutral-50/80">
      <td className="px-4 py-2 font-mono text-[#6A0000]">{row.programCode ?? "—"}</td>
      <td className="px-4 py-2">{row.yearLevel ?? "—"}</td>
      <td className="px-4 py-2 font-medium">{row.name}</td>
      <td className="px-4 py-2">
        <select
          value={currentAdviserId}
          onChange={(e) => handleChange(e.target.value)}
          disabled={pending}
          className="h-9 min-w-[180px] rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900"
        >
          <option value="">— No adviser —</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.fullName || t.email || t.id.slice(0, 8)}
            </option>
          ))}
        </select>
      </td>
    </tr>
  );
}
