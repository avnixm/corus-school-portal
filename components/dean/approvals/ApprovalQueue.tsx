// path: components/dean/approvals/ApprovalQueue.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ApprovalTypeKey, ApprovalStatusFilter, ApprovalQueueRow } from "./ApprovalTypeConfig";
import { APPROVAL_TYPE_LABELS, STATUS_OPTIONS } from "./ApprovalTypeConfig";
import { AlertTriangle } from "lucide-react";

export interface ApprovalQueueProps {
  typeKey: ApprovalTypeKey;
  items: ApprovalQueueRow[];
  status: ApprovalStatusFilter;
  schoolYears: { id: string; name: string }[];
  terms: { id: string; name: string }[];
  programs: { id: string; code: string; name: string }[];
}

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "submitted" || s === "pending" || s === "pending_dean")
    return <Badge className="bg-amber-100 text-amber-800">Submitted</Badge>;
  if (s === "approved") return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
  if (s === "rejected") return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

export function ApprovalQueue({
  typeKey,
  items,
  status,
  schoolYears,
  terms,
  programs,
}: ApprovalQueueProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "schedules";
  const statusOptions = STATUS_OPTIONS[typeKey];
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const reviewBase = "/dean/approvals";
  const reviewHref = (id: string) => `${reviewBase}/${typeKey}/${id}`;

  function setStatus(s: ApprovalStatusFilter) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", s);
    router.push(`/dean/approvals?tab=${tab}&${params.toString()}`);
  }

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/dean/approvals?tab=${tab}&${params.toString()}`);
  }

  const filteredItems = search
    ? items.filter(
        (i) =>
          i.title.toLowerCase().includes(search.toLowerCase()) ||
          (i.program ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : items;

  return (
    <div className="space-y-4">
      {/* Status filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-neutral-700">Status:</span>
        <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-50 p-0.5">
          {statusOptions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize ${
                status === s
                  ? "bg-white text-[#6A0000] shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Common filters: SY, Term, Program (only show if type supports) */}
      <div className="flex flex-wrap gap-4">
        <div className="min-w-[140px]">
          <label className="text-sm font-medium text-neutral-700">School Year</label>
          <select
            value={searchParams.get("schoolYearId") ?? ""}
            onChange={(e) => setFilter("schoolYearId", e.target.value)}
            className="mt-1 flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {schoolYears.map((sy) => (
              <option key={sy.id} value={sy.id}>{sy.name}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="text-sm font-medium text-neutral-700">Term</label>
          <select
            value={searchParams.get("termId") ?? ""}
            onChange={(e) => setFilter("termId", e.target.value)}
            className="mt-1 flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {terms.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="text-sm font-medium text-neutral-700">Program</label>
          <select
            value={searchParams.get("programId") ?? ""}
            onChange={(e) => setFilter("programId", e.target.value)}
            className="mt-1 flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>{p.code ?? p.name}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[200px]">
          <label className="text-sm font-medium text-neutral-700">Search</label>
          <Input
            type="search"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-1 h-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-white/80">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
            <tr>
              <th className="px-4 py-2">Title / Reference</th>
              <th className="px-4 py-2">Program</th>
              <th className="px-4 py-2">Term</th>
              <th className="px-4 py-2">School Year</th>
              <th className="px-4 py-2">Submitted At</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((row) => (
              <tr key={row.id} className="border-b last:border-0 hover:bg-neutral-50/80">
                <td className="px-4 py-2">
                  <div className="font-medium">{row.title}</div>
                  {row.hasIssues && (
                    <div className="mt-1 flex items-center gap-1 text-amber-700">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span className="text-xs">Issues</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-2 text-neutral-700">{row.program ?? "—"}</td>
                <td className="px-4 py-2 text-neutral-700">{row.term ?? "—"}</td>
                <td className="px-4 py-2 text-neutral-700">{row.schoolYear ?? "—"}</td>
                <td className="px-4 py-2 text-neutral-700">
                  {row.submittedAt
                    ? new Date(row.submittedAt).toLocaleString()
                    : "—"}
                </td>
                <td className="px-4 py-2">{statusBadge(row.status)}</td>
                <td className="px-4 py-2 text-right">
                  {(row.status === "submitted" || row.status === "pending" || row.status === "pending_dean") ? (
                    <Link href={reviewHref(row.id)}>
                      <Button variant="outline" size="sm">
                        Review
                      </Button>
                    </Link>
                  ) : (
                    <Link href={reviewHref(row.id)}>
                      <Button variant="ghost" size="sm" className="text-[#6A0000]">
                        View
                      </Button>
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-sm text-neutral-600"
                >
                  No items in this tab.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
