"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignProgramHeadAction, unassignProgramHeadAction } from "./actions";
type Assignment = { id: string; userId: string; programCode: string; active: boolean };
type User = { userId: string; fullName: string | null; email: string | null };
type Program = { id: string; code: string; name: string; active: boolean };

export function ProgramHeadAssignmentsSection({
  assignments,
  programHeads,
  programs,
}: {
  assignments: Assignment[];
  programHeads: User[];
  programs: Program[];
}) {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [programCode, setProgramCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!userId || !programCode) return;
    setPending(true);
    const result = await assignProgramHeadAction(userId, programCode);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setUserId("");
    setProgramCode("");
    router.refresh();
  }

  async function handleUnassign(assignmentId: string) {
    await unassignProgramHeadAction(assignmentId);
    router.refresh();
  }

  const userById = Object.fromEntries(programHeads.map((u) => [u.userId, u]));

  return (
    <div className="space-y-4">
      <form onSubmit={handleAssign} className="flex flex-wrap items-end gap-4">
        <div className="min-w-[200px]">
          <Label>User (Program Head)</Label>
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {programHeads.map((u) => (
                <SelectItem key={u.userId} value={u.userId}>
                  {u.fullName ?? u.email ?? u.userId.slice(0, 8)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[140px]">
          <Label>Program</Label>
          <Select value={programCode} onValueChange={setProgramCode}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select program" />
            </SelectTrigger>
            <SelectContent>
              {programs.filter((p) => p.active).map((p) => (
                <SelectItem key={p.id} value={p.code}>
                  {p.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={pending || !userId || !programCode}>
          Assign
        </Button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl border bg-white text-sm text-neutral-900">
        <table className="min-w-full text-left">
          <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
            <tr>
              <th className="px-4 py-2">User</th>
              <th className="px-4 py-2">Program</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={a.id} className="border-b last:border-0">
                <td className="px-4 py-2 text-neutral-900">
                  {userById[a.userId]?.fullName ??
                    userById[a.userId]?.email ??
                    a.userId.slice(0, 8)}
                </td>
                <td className="px-4 py-2 text-neutral-900">{a.programCode}</td>
                <td className="px-4 py-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-red-600"
                    onClick={() => handleUnassign(a.id)}
                  >
                    Unassign
                  </Button>
                </td>
              </tr>
            ))}
            {assignments.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-neutral-600">
                  No assignments
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
