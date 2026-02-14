"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, AlertTriangle } from "lucide-react";
import { ReviewScheduleDialog } from "./ReviewScheduleDialog";

type ScheduleApproval = {
  approvalId: string;
  scheduleId: string;
  subjectCode: string;
  subjectTitle: string;
  sectionName: string;
  teacherName: string | null;
  timeIn: string | null;
  timeOut: string | null;
  room: string | null;
  hasTeacherOverride: boolean;
  overrideReason: string | null;
  submittedAt: Date;
};

export function ScheduleApprovalTable({ approvals }: { approvals: ScheduleApproval[] }) {
  const [selectedApproval, setSelectedApproval] = useState<string | null>(null);

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-white/80 text-neutral-900">
        <table className="min-w-full text-left text-sm text-neutral-900">
          <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
            <tr>
              <th className="px-4 py-2">Subject</th>
              <th className="px-4 py-2">Section</th>
              <th className="px-4 py-2">Teacher</th>
              <th className="px-4 py-2">Time</th>
              <th className="px-4 py-2">Room</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {approvals.map((approval) => (
              <tr
                key={approval.approvalId}
                className="border-b last:border-0 hover:bg-neutral-50/80"
              >
                <td className="px-4 py-2">
                  <div className="font-mono text-xs text-[#6A0000]">{approval.subjectCode}</div>
                  <div className="text-neutral-700">{approval.subjectTitle}</div>
                </td>
                <td className="px-4 py-2">{approval.sectionName}</td>
                <td className="px-4 py-2">{approval.teacherName || "—"}</td>
                <td className="px-4 py-2">
                  {approval.timeIn ?? "—"} – {approval.timeOut ?? "—"}
                </td>
                <td className="px-4 py-2">{approval.room || "—"}</td>
                <td className="px-4 py-2">
                  {approval.hasTeacherOverride ? (
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                        Override Required
                      </Badge>
                    </div>
                  ) : (
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Authorized
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-2 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedApproval(approval.approvalId)}
                  >
                    <Eye className="mr-1.5 h-4 w-4" />
                    Review
                  </Button>
                </td>
              </tr>
            ))}
            {approvals.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-sm text-neutral-800"
                >
                  No pending approvals.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedApproval && (
        <ReviewScheduleDialog
          approvalId={selectedApproval}
          onClose={() => setSelectedApproval(null)}
        />
      )}
    </>
  );
}
