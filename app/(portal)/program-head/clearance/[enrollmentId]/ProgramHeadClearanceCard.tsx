"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingButton } from "@/components/ui/loading-button";
import { toast } from "sonner";
import { clearClearanceItemAction } from "../actions";

type Item = {
  id: string;
  officeType: string;
  status: string;
  remarks: string | null;
};

type RequestRow = {
  requestId: string;
  periodId: string;
  periodName: string;
  status: string;
  items: Item[];
};

export function ProgramHeadClearanceCard({
  enrollmentId,
  clearanceRequests,
}: {
  enrollmentId: string;
  clearanceRequests: RequestRow[];
}) {
  const router = useRouter();

  const programHeadRows = clearanceRequests
    .map((r) => {
      const ph = r.items.find((i) => i.officeType === "program_head");
      return ph ? { ...r, item: ph } : null;
    })
    .filter(Boolean) as (RequestRow & { item: Item })[];

  if (programHeadRows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">
            Program head clearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-600">
            No clearance requests for this enrollment yet. Clearance is created per grading period from the student or finance side.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-neutral-900">
          Program head clearance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-xl border bg-white/80 text-sm">
          <table className="min-w-full">
            <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
              <tr>
                <th className="px-4 py-2 text-left">Period</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {programHeadRows.map((row) => (
                <ProgramHeadClearRow
                  key={row.requestId}
                  itemId={row.item.id}
                  periodName={row.periodName}
                  status={row.item.status}
                  remarks={row.item.remarks}
                  onCleared={() => router.refresh()}
                />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function ProgramHeadClearRow({
  itemId,
  periodName,
  status,
  remarks,
  onCleared,
}: {
  itemId: string;
  periodName: string;
  status: string;
  remarks: string | null;
  onCleared: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function handleClear() {
    startTransition(async () => {
      const result = await clearClearanceItemAction(itemId);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Cleared");
      onCleared();
    });
  }

  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-2">{periodName}</td>
      <td className="px-4 py-2">
        <Badge
          variant={status === "cleared" ? "default" : "secondary"}
          className={status === "cleared" ? "bg-emerald-600" : ""}
        >
          {status === "cleared" ? "Cleared" : status === "blocked" ? "Blocked" : "Pending"}
        </Badge>
        {remarks && (
          <span className="ml-2 text-xs text-neutral-500">{remarks}</span>
        )}
      </td>
      <td className="px-4 py-2 text-right">
        {status !== "cleared" && (
          <LoadingButton
            variant="outline"
            size="sm"
            onClick={handleClear}
            pending={pending}
          >
            Clear
          </LoadingButton>
        )}
      </td>
    </tr>
  );
}
