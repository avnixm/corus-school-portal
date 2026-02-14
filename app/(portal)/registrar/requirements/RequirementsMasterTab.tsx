"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { CreateRequirementForm } from "./CreateRequirementForm";
import { EditRequirementForm } from "./EditRequirementForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, AlertCircle } from "lucide-react";
import { deleteRequirementAction } from "./actions";
import type { requirements } from "@/db/schema";

type RequirementRow = typeof requirements.$inferSelect;

function friendlyDeleteError(message: string): { summary: string; detail?: string } {
  const isDeleteFailure =
    message.includes("delete") ||
    message.includes("foreign key") ||
    message.includes("violates") ||
    message.includes("Failed query");
  if (isDeleteFailure) {
    return {
      summary:
        "This requirement cannot be deleted because it is still in use. Remove or update any rules or submissions that use it, then try again.",
      detail: message,
    };
  }
  return { summary: message };
}

export function RequirementsMasterTab({ requirements: rows }: { requirements: RequirementRow[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteRow, setConfirmDeleteRow] = useState<RequirementRow | null>(null);
  const [error, setError] = useState<{ summary: string; detail?: string } | null>(null);

  async function handleConfirmDelete() {
    if (!confirmDeleteRow) return;
    setDeletingId(confirmDeleteRow.id);
    const result = await deleteRequirementAction(confirmDeleteRow.id);
    setConfirmDeleteRow(null);
    setDeletingId(null);
    if (result?.error) {
      setError(friendlyDeleteError(result.error));
      return;
    }
    router.refresh();
  }

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold text-[#6A0000]">
          Master requirements ({rows.length})
        </CardTitle>
        <CreateRequirementForm />
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-xl border bg-white/80 text-neutral-900">
          <table className="min-w-full text-left text-sm text-neutral-900">
            <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
              <tr>
                <th className="px-4 py-2">Code</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Instructions</th>
                <th className="px-4 py-2">File types</th>
                <th className="px-4 py-2">Max</th>
                <th className="px-4 py-2">Active</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0 hover:bg-neutral-50/80">
                  <td className="px-4 py-2 font-mono text-xs">{row.code}</td>
                  <td className="px-4 py-2 font-medium">{row.name}</td>
                  <td className="max-w-[200px] truncate px-4 py-2 text-neutral-600">
                    {row.instructions ?? "—"}
                  </td>
                  <td className="px-4 py-2">
                    {(row.allowedFileTypes as string[])?.length
                      ? (row.allowedFileTypes as string[]).join(", ")
                      : "—"}
                  </td>
                  <td className="px-4 py-2">{row.maxFiles}</td>
                  <td className="px-4 py-2">
                    <Badge variant={row.isActive ? "default" : "outline"}>
                      {row.isActive ? "Yes" : "No"}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <EditRequirementForm requirement={row} />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => setConfirmDeleteRow(row)}
                        disabled={deletingId === row.id}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-neutral-800">
                    No requirements yet. Add one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    {/* Confirm delete */}
    <Dialog open={!!confirmDeleteRow} onOpenChange={(open) => !open && setConfirmDeleteRow(null)}>
      <DialogContent className="sm:max-w-[400px]" showClose={true}>
        <DialogHeader>
          <DialogTitle className="text-[#6A0000]">Delete requirement?</DialogTitle>
          <DialogDescription>
            {confirmDeleteRow && (
              <>
                You are about to delete <strong>{confirmDeleteRow.name}</strong> ({confirmDeleteRow.code}).
                This cannot be undone.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setConfirmDeleteRow(null)} disabled={!!deletingId}>
            Cancel
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700"
            onClick={handleConfirmDelete}
            disabled={!!deletingId}
          >
            {deletingId ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Error */}
    <Dialog open={!!error} onOpenChange={(open) => !open && setError(null)}>
      <DialogContent className="sm:max-w-[420px]" showClose={true}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Cannot delete requirement
          </DialogTitle>
          <DialogDescription className="mt-1 text-neutral-700">
            {error?.summary}
            {error?.detail && (
              <span className="mt-2 block text-xs text-neutral-500">
                Details: {error.detail}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => setError(null)} className="bg-[#6A0000] hover:bg-[#6A0000]/90">
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
