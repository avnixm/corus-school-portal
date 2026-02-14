// path: app/(portal)/teacher/gradebook/[scheduleId]/[periodId]/GradebookForm.tsx
"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { upsertGradeEntriesAction, submitGradesAction } from "../../../actions";
import { Send, Lock } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

type Row = {
  studentId: string;
  enrollmentId: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  studentCode: string | null;
  numericGrade: string | null;
  letterGrade: string | null;
  remarks: string | null;
  entryId?: string;
};

function GradebookForm({
  submissionId,
  entries,
  canEdit,
}: {
  submissionId: string;
  entries: Row[];
  canEdit: boolean;
}) {
  const [rows, setRows] = useState(entries);
  const [saving, setSaving] = useState(false);
  const [submitPending, setSubmitPending] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const handleSave = async () => {
    setMessage(null);
    setSaving(true);
    const result = await upsertGradeEntriesAction(
      submissionId,
      rows.map((r) => ({
        studentId: r.studentId,
        enrollmentId: r.enrollmentId,
        numericGrade: r.numericGrade ?? null,
        letterGrade: r.letterGrade ?? null,
        remarks: r.remarks ?? null,
      }))
    );
    setSaving(false);
    if (result.error) setMessage({ type: "error", text: result.error });
    else setMessage({ type: "success", text: "Grades saved." });
  };

  const validateForSubmit = (): string | null => {
    for (const r of rows) {
      const val = r.numericGrade != null && r.numericGrade !== "" ? r.numericGrade : null;
      if (val !== null) {
        const n = Number.parseFloat(val);
        if (!Number.isFinite(n) || n < 0 || n > 100)
          return `Grade must be between 0 and 100 (invalid: ${val})`;
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    setMessage(null);
    const err = validateForSubmit();
    if (err) {
      setMessage({ type: "error", text: err });
      return;
    }
    setSubmitPending(true);
    const result = await submitGradesAction(submissionId);
    setSubmitPending(false);
    if (result.error) setMessage({ type: "error", text: result.error });
    else {
      setMessage({ type: "success", text: "Submitted for registrar approval." });
      window.location.reload();
    }
  };

  const updateRow = (studentId: string, field: "numericGrade" | "letterGrade" | "remarks", value: string | null) => {
    setRows((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, [field]: value || null } : r))
    );
  };

  return (
    <div className="space-y-4">
      {message && (
        <p
          className={`rounded-md px-3 py-2 text-sm ${
            message.type === "error" ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"
          }`}
        >
          {message.text}
        </p>
      )}
      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs font-medium text-[#6A0000]">
            <tr>
              <th className="px-4 py-2">Student</th>
              <th className="px-4 py-2 w-24">Code</th>
              <th className="px-4 py-2 w-28">Numeric</th>
              <th className="px-4 py-2 w-24">Letter</th>
              <th className="px-4 py-2 min-w-[160px]">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.studentId} className="border-t">
                <td className="px-4 py-2">
                  {[r.firstName, r.middleName, r.lastName].filter(Boolean).join(" ")}
                </td>
                <td className="px-4 py-2 text-neutral-600">{r.studentCode ?? "—"}</td>
                <td className="px-4 py-2">
                  {canEdit ? (
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      className="h-8 w-24"
                      value={r.numericGrade ?? ""}
                      onChange={(e) => updateRow(r.studentId, "numericGrade", e.target.value || null)}
                    />
                  ) : (
                    <span>{r.numericGrade ?? "—"}</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {canEdit ? (
                    <Input
                      type="text"
                      placeholder="—"
                      className="h-8 w-20"
                      value={r.letterGrade ?? ""}
                      onChange={(e) => updateRow(r.studentId, "letterGrade", e.target.value || null)}
                    />
                  ) : (
                    <span>{r.letterGrade ?? "—"}</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {canEdit ? (
                    <Textarea
                      placeholder="Remarks"
                      className="min-h-8 resize-y text-xs"
                      value={r.remarks ?? ""}
                      onChange={(e) => updateRow(r.studentId, "remarks", e.target.value || null)}
                      rows={1}
                    />
                  ) : (
                    <span className="text-neutral-600">{r.remarks ?? "—"}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <p className="py-4 text-center text-sm text-neutral-600">No students in roster.</p>
      )}
      {canEdit && rows.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            variant="outline"
            className="border-[#6A0000]/40 text-[#6A0000]"
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitPending}
            className="bg-[#6A0000] text-white hover:bg-[#6A0000]/90"
          >
            <Send className="mr-1 h-4 w-4" />
            {submitPending ? "Submitting…" : "Submit for approval"}
          </Button>
        </div>
      )}
      {!canEdit && (
        <p className="flex items-center gap-1 text-xs text-neutral-600">
          <Lock className="h-3 w-3" />
          Grades are locked. Contact registrar if you need to edit.
        </p>
      )}
    </div>
  );
}

export { GradebookForm };
