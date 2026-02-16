"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type Package = {
  id: string;
  title: string;
  status: string;
  programCode: string | null;
  programName: string | null;
  schoolYearName: string | null;
  termName: string | null;
  createdByUserId: string;
  submittedAt: Date | string | null;
};

function statusBadge(status: string) {
  switch (status) {
    case "submitted": return <Badge className="bg-amber-100 text-amber-800">Submitted</Badge>;
    case "approved": return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
    case "rejected": return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
}

export function DeanCapabilityTabs({
  submitted,
  approved,
  rejected,
}: {
  submitted: Package[];
  approved: Package[];
  rejected: Package[];
}) {
  const [tab, setTab] = useState<"submitted" | "approved" | "rejected">("submitted");
  const list = tab === "submitted" ? submitted : tab === "approved" ? approved : rejected;

  return (
    <div>
      <div className="flex gap-2 border-b">
        <button
          type="button"
          onClick={() => setTab("submitted")}
          className={`border-b-2 px-4 py-2 text-sm font-medium ${
            tab === "submitted" ? "border-[#6A0000] text-[#6A0000]" : "border-transparent"
          }`}
        >
          Submitted ({submitted.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("approved")}
          className={`border-b-2 px-4 py-2 text-sm font-medium ${
            tab === "approved" ? "border-[#6A0000] text-[#6A0000]" : "border-transparent"
          }`}
        >
          Approved ({approved.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("rejected")}
          className={`border-b-2 px-4 py-2 text-sm font-medium ${
            tab === "rejected" ? "border-[#6A0000] text-[#6A0000]" : "border-transparent"
          }`}
        >
          Rejected ({rejected.length})
        </button>
      </div>
      <Card className="mt-4">
        <CardContent className="pt-4">
          {list.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-600">
              No packages in this tab.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                  <tr>
                    <th className="px-4 py-2">Title</th>
                    <th className="px-4 py-2">Program</th>
                    <th className="px-4 py-2">Year / Term</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Submitted</th>
                    <th className="px-4 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-neutral-50/80">
                      <td className="px-4 py-2 font-medium">{p.title}</td>
                      <td className="px-4 py-2">{p.programCode ?? p.programName ?? "—"}</td>
                      <td className="px-4 py-2">{p.schoolYearName ?? "—"} / {p.termName ?? "—"}</td>
                      <td className="px-4 py-2">{statusBadge(p.status)}</td>
                      <td className="px-4 py-2">
                        {p.submittedAt
                          ? new Date(p.submittedAt).toLocaleString()
                          : "—"}
                      </td>
                      <td className="px-4 py-2">
                        <Link
                          href={`/dean/teacher-capabilities/${p.id}`}
                          className="text-[#6A0000] hover:underline"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
