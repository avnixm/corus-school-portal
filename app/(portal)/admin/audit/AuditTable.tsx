"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Row = {
  id: string;
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  before: unknown;
  after: unknown;
  createdAt: Date | null;
};

export function AuditTable({
  rows,
  page,
  limit,
  searchParams = {},
}: {
  rows: Row[];
  page: number;
  limit: number;
  searchParams?: Record<string, string | undefined>;
}) {
  const [detail, setDetail] = useState<Row | null>(null);

  function buildUrl(nextPage: number) {
    const p = new URLSearchParams();
    if (searchParams.from) p.set("from", searchParams.from);
    if (searchParams.to) p.set("to", searchParams.to);
    if (searchParams.actor) p.set("actor", searchParams.actor);
    if (searchParams.action) p.set("action", searchParams.action);
    if (searchParams.entity) p.set("entity", searchParams.entity);
    p.set("page", String(nextPage));
    return `/admin/audit?${p.toString()}`;
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border bg-white text-sm text-neutral-900">
        <table className="min-w-full text-left">
          <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
            <tr>
              <th className="px-4 py-2">Time</th>
              <th className="px-4 py-2">Actor</th>
              <th className="px-4 py-2">Action</th>
              <th className="px-4 py-2">Entity</th>
              <th className="px-4 py-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="px-4 py-2 text-neutral-800">
                  {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
                </td>
                <td className="px-4 py-2 text-neutral-900">
                  {r.actorUserId ? (
                    <Link
                      href={`/admin/users/${r.actorUserId}`}
                      className="text-[#6A0000] hover:underline"
                    >
                      {r.actorUserId.slice(0, 8)}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-2 text-neutral-900">{r.action}</td>
                <td className="px-4 py-2 text-neutral-900">
                  {r.entityType}
                  {r.entityId ? ` · ${r.entityId.slice(0, 8)}` : ""}
                </td>
                <td className="px-4 py-2 text-neutral-900">
                  <button
                    type="button"
                    onClick={() => setDetail(r)}
                    className="text-[#6A0000] hover:underline"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-600">
                  No entries
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {rows.length >= limit && (
        <div className="mt-2 flex justify-end gap-2 text-neutral-900">
          {page > 0 && (
            <Link
              href={buildUrl(page - 1)}
              className="text-sm font-medium text-[#6A0000] hover:underline"
            >
              Previous
            </Link>
          )}
          <Link
            href={buildUrl(page + 1)}
            className="text-sm font-medium text-[#6A0000] hover:underline"
          >
            Next
          </Link>
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-auto text-neutral-900">
          <DialogHeader>
            <DialogTitle className="text-neutral-900">Audit entry</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4 font-mono text-xs text-neutral-900">
              <div>
                <p className="font-sans font-medium text-neutral-800">Before</p>
                <pre className="mt-1 overflow-auto rounded bg-neutral-100 p-2 text-neutral-900">
                  {JSON.stringify(detail.before, null, 2)}
                </pre>
              </div>
              <div>
                <p className="font-sans font-medium text-neutral-800">After</p>
                <pre className="mt-1 overflow-auto rounded bg-neutral-100 p-2 text-neutral-900">
                  {JSON.stringify(detail.after, null, 2)}
                </pre>
              </div>
              {detail.entityType === "user_profile" && detail.entityId && (
                <Link
                  href={`/admin/users/${detail.entityId}`}
                  className="font-sans text-sm text-[#6A0000] hover:underline"
                >
                  Open user →
                </Link>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
