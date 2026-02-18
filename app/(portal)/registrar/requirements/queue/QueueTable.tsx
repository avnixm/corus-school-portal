"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { verifySubmissionAction, rejectSubmissionAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAgeBadgeProps } from "@/lib/ui/age";

type QueueRow = {
  id: string;
  studentId: string;
  requirementId: string;
  requirementName: string;
  requirementCode: string;
  submittedAt: Date | null;
  status: string;
  firstName: string | null;
  lastName: string | null;
  studentCode: string | null;
  program: string | null;
  yearLevel: string | null;
  schoolYearId: string | null;
  termId: string | null;
  enrollmentId: string | null;
  enrollmentStatus: string | null;
};

export function QueueTable({ rows }: { rows: QueueRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");

  function handleVerify(id: string) {
    startTransition(async () => {
      try {
        await verifySubmissionAction(id);
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to verify submission.";
        toast.error(message);
      }
    });
  }

  function handleReject(id: string) {
    if (rejectingId !== id) {
      setRejectingId(id);
      setRemarks("");
      return;
    }
    startTransition(async () => {
      try {
        await rejectSubmissionAction(id, remarks);
        setRejectingId(null);
        setRemarks("");
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to reject submission.";
        toast.error(message);
      }
    });
  }

  function fullName(r: QueueRow) {
    return [r.firstName, r.lastName].filter(Boolean).join(" ") || "—";
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-white/80 text-neutral-900">
      <table className="min-w-full text-left text-sm text-neutral-900">
        <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
          <tr>
            <th className="px-4 py-2">Age</th>
            <th className="px-4 py-2">Student</th>
            <th className="px-4 py-2">Requirement</th>
            <th className="px-4 py-2">Program / Year</th>
            <th className="px-4 py-2">Enrollment</th>
            <th className="px-4 py-2">Submitted</th>
            <th className="px-4 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const ageProps = getAgeBadgeProps(row.submittedAt);
            return (
            <tr key={row.id} className="border-b last:border-0 hover:bg-neutral-50/80">
              <td className="px-4 py-2">
                <Badge variant={ageProps.variant} className="text-xs">
                  {ageProps.label}
                </Badge>
              </td>
              <td className="px-4 py-2">
                <Link
                  href={`/registrar/students/${row.studentId}`}
                  className="font-medium text-[#6A0000] hover:underline"
                >
                  {fullName(row)}
                </Link>
                {row.studentCode && (
                  <span className="ml-1 text-xs text-neutral-600">({row.studentCode})</span>
                )}
              </td>
              <td className="px-4 py-2">
                <span className="font-mono text-xs">{row.requirementCode}</span> – {row.requirementName}
              </td>
              <td className="px-4 py-2">
                {row.program ?? "—"} / {row.yearLevel ?? "—"}
              </td>
              <td className="px-4 py-2">
                {row.enrollmentId && row.enrollmentStatus ? (
                  <div className="flex flex-col gap-1">
                    <Badge
                      variant={
                        row.enrollmentStatus === "approved"
                          ? "default"
                          : row.enrollmentStatus === "pending_approval"
                          ? "secondary"
                          : "outline"
                      }
                      className="text-xs"
                    >
                      {row.enrollmentStatus}
                    </Badge>
                    <Link
                      href={`/registrar/approvals/${row.enrollmentId}/review`}
                      className="text-xs text-[#6A0000] hover:underline"
                    >
                      View
                    </Link>
                  </div>
                ) : (
                  <span className="text-xs text-neutral-500">—</span>
                )}
              </td>
              <td className="px-4 py-2 text-neutral-600">
                {row.submittedAt
                  ? new Date(row.submittedAt).toLocaleString()
                  : "—"}
              </td>
              <td className="px-4 py-2 text-right">
                {rejectingId === row.id ? (
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs">Remarks (required)</Label>
                    <Input
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Reason for rejection"
                      className="h-8 text-sm"
                    />
                    <div className="flex gap-1 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-600 text-red-600"
                        onClick={() => handleReject(row.id)}
                        disabled={isPending || !remarks.trim()}
                      >
                        Confirm reject
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setRejectingId(null)}
                        disabled={isPending}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      className="gap-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleVerify(row.id)}
                      disabled={isPending}
                    >
                      <CheckCircle className="h-3 w-3" />
                      Verify
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 border-red-600 text-red-600"
                      onClick={() => handleReject(row.id)}
                      disabled={isPending}
                    >
                      <XCircle className="h-3 w-3" />
                      Reject
                    </Button>
                  </div>
                )}
              </td>
            </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-sm text-neutral-800">
                No submissions awaiting verification.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
