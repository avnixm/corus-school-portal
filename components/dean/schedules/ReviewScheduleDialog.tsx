"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { approveScheduleAction, rejectScheduleAction } from "@/app/(portal)/dean/schedules/actions";

type ApprovalDetail = {
  approvalId: string;
  scheduleId: string;
  subjectCode: string;
  subjectTitle: string;
  sectionName: string;
  teacherId: string | null;
  teacherName: string | null;
  timeIn: string | null;
  timeOut: string | null;
  room: string | null;
  hasTeacherOverride: boolean;
  overrideReason: string | null;
  status: string;
  deanRemarks: string | null;
  submittedAt: Date;
  days: string[];
};

export function ReviewScheduleDialog({
  approvalId,
  onClose,
}: {
  approvalId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [details, setDetails] = useState<ApprovalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState("");
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadDetails() {
      setLoading(true);
      const res = await fetch(`/api/dean/schedules/${approvalId}`);
      if (res.ok) {
        const data = await res.json();
        setDetails(data);
      }
      setLoading(false);
    }
    loadDetails();
  }, [approvalId]);

  async function handleSubmit() {
    if (!action) return;
    
    setSubmitting(true);
    const result = action === "approve"
      ? await approveScheduleAction(approvalId, remarks.trim() || undefined)
      : await rejectScheduleAction(approvalId, remarks.trim());
    setSubmitting(false);
    
    if (result?.error) {
      alert(result.error);
    } else {
      router.refresh();
      onClose();
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#6A0000]">
            Review Schedule
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-neutral-600">Loading...</p>
        ) : details ? (
          <div className="space-y-4">
            {/* Warning Banner for Override */}
            {details.hasTeacherOverride && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900">Teacher Authorization Override</p>
                    <p className="text-sm text-amber-800 mt-1">
                      This teacher is not authorized for this subject. The Registrar provided the following reason:
                    </p>
                    <p className="text-sm text-amber-900 mt-2 font-medium italic">
                      "{details.overrideReason}"
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Schedule Details */}
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <h3 className="font-semibold text-neutral-900 mb-3">Schedule Details</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-neutral-600">Subject:</span>
                  <div className="font-medium text-[#6A0000]">
                    {details.subjectCode} - {details.subjectTitle}
                  </div>
                </div>
                <div>
                  <span className="text-neutral-600">Section:</span>
                  <div className="font-medium">{details.sectionName}</div>
                </div>
                <div>
                  <span className="text-neutral-600">Teacher:</span>
                  <div className="font-medium">{details.teacherName || "—"}</div>
                </div>
                <div>
                  <span className="text-neutral-600">Room:</span>
                  <div className="font-medium">{details.room || "—"}</div>
                </div>
                <div>
                  <span className="text-neutral-600">Time:</span>
                  <div className="font-medium">
                    {details.timeIn || "—"} - {details.timeOut || "—"}
                  </div>
                </div>
                <div>
                  <span className="text-neutral-600">Days:</span>
                  <div className="flex gap-1 mt-1">
                    {details.days.map(day => (
                      <Badge key={day} variant="outline" className="text-xs">
                        {day}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div>
              <Label htmlFor="remarks">
                Remarks {action === "reject" ? "*" : "(optional)"}
              </Label>
              <Textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={
                  action === "reject"
                    ? "Provide a reason for rejection..."
                    : "Add remarks about this approval..."
                }
                className="mt-1"
                rows={3}
                required={action === "reject"}
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-red-600">Failed to load schedule details.</p>
        )}

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50"
            onClick={() => {
              setAction("reject");
              setTimeout(() => handleSubmit(), 0);
            }}
            disabled={submitting || !details}
          >
            {submitting && action === "reject" ? "Rejecting..." : "Reject"}
          </Button>
          <Button
            type="button"
            onClick={() => {
              setAction("approve");
              setTimeout(() => handleSubmit(), 0);
            }}
            disabled={submitting || !details}
            className="bg-[#6A0000] hover:bg-[#6A0000]/90"
          >
            {submitting && action === "approve" ? "Approving..." : "Approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
