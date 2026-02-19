"use client";

import { useMemo, useState } from "react";
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
import { Pencil, Trash2, Search } from "lucide-react";
import type { ClassManagementRow } from "@/lib/programHead/queries";
import { CLASS_MANAGEMENT_MAX_CAPACITY } from "@/lib/programHead/constants";
import { updateClassAction, deactivateClassAction } from "./actions";

type Program = { id: string; code: string; name: string };

function EnrollmentCell({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;
  return (
    <div className="flex min-w-[100px] flex-col gap-1">
      <span className="text-sm tabular-nums">
        {current}/{max}
      </span>
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function RowActions({
  row,
  programs,
}: {
  row: ClassManagementRow;
  programs: Program[];
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateClassAction(row.id, formData);
    setPending(false);
    if (result && "error" in result) {
      setError(result.error ?? null);
      return;
    }
    setEditOpen(false);
    router.refresh();
  }

  async function handleDeactivate() {
    setPending(true);
    await deactivateClassAction(row.id);
    setPending(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setEditOpen(true)}
          title="Edit"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={handleDeactivate}
          disabled={pending}
          title="Deactivate"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div>
              <Label htmlFor={`edit-programId-${row.id}`}>Program *</Label>
              <select
                id={`edit-programId-${row.id}`}
                name="programId"
                defaultValue={row.programId ?? ""}
                className="mt-1 flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
                required
              >
                <option value="">Select</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} – {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor={`edit-name-${row.id}`}>Section Name *</Label>
              <Input
                id={`edit-name-${row.id}`}
                name="name"
                defaultValue={row.name}
                required
                className="mt-1 h-10"
              />
            </div>
            <div>
              <Label htmlFor={`edit-yearLevel-${row.id}`}>Year Level</Label>
              <Input
                id={`edit-yearLevel-${row.id}`}
                name="yearLevel"
                defaultValue={row.yearLevel ?? ""}
                className="mt-1 h-10"
              />
            </div>
            <div>
              <Label htmlFor={`edit-maxCapacity-${row.id}`}>Max students per class</Label>
              <Input
                id={`edit-maxCapacity-${row.id}`}
                name="maxCapacity"
                type="number"
                min={0}
                placeholder="Leave empty for default (40)"
                defaultValue={row.maxCapacityStored ?? ""}
                className="mt-1 h-10"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ClassManagementTable({
  rows,
  programs,
}: {
  rows: ClassManagementRow[];
  programs: Program[];
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.yearLevel?.toLowerCase().includes(q) ?? false) ||
        (r.adviserName?.toLowerCase().includes(q) ?? false) ||
        (r.program?.toLowerCase().includes(q) ?? false)
    );
  }, [rows, search]);

  function blockFromRow(row: ClassManagementRow): string {
    return row.name.includes("-") ? row.name.split("-").slice(1).join("-").trim() : row.name || "—";
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <Input
          type="search"
          placeholder="Search classes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="overflow-x-auto rounded-xl border bg-white/80 text-sm">
        <table className="min-w-full">
          <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
            <tr>
              <th className="px-4 py-2 text-left">Year</th>
              <th className="px-4 py-2 text-left">Block</th>
              <th className="px-4 py-2 text-left">Teacher</th>
              <th className="px-4 py-2 text-left">Enrollment</th>
              <th className="px-4 py-2 text-right">Schedules</th>
              <th className="px-4 py-2 text-left">Complete</th>
              <th className="px-4 py-2 text-left">Overload</th>
              <th className="px-4 py-2 text-left">Academic Year</th>
              <th className="px-4 py-2 text-left">Term</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const overload = r.enrolledCount > CLASS_MANAGEMENT_MAX_CAPACITY;
              return (
                <tr key={r.id} className="border-b last:border-0 hover:bg-neutral-50/80">
                  <td className="px-4 py-2">{r.yearLevel ?? "—"}</td>
                  <td className="px-4 py-2">{blockFromRow(r)}</td>
                  <td className="px-4 py-2">{r.adviserName ?? "—"}</td>
                  <td className="px-4 py-2">
                    <EnrollmentCell current={r.enrolledCount} max={r.maxCapacity} />
                  </td>
                  <td className="px-4 py-2 text-right">{r.scheduleCount}</td>
                  <td className="px-4 py-2">
                    {r.scheduleCount > 0 ? (
                      <span className="text-green-600">Yes</span>
                    ) : (
                      <span className="text-amber-600">No</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {overload ? (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs uppercase text-amber-800">
                        &gt;{CLASS_MANAGEMENT_MAX_CAPACITY}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2">{r.schoolYearName}</td>
                  <td className="px-4 py-2">{r.termName}</td>
                  <td className="px-4 py-2 text-right">
                    <RowActions row={r} programs={programs} />
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-8 text-center text-neutral-600"
                >
                  {rows.length === 0
                    ? "No classes. Select school year and term."
                    : "No classes match your search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
