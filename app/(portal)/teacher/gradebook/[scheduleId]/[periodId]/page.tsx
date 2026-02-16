// path: app/(portal)/teacher/gradebook/[scheduleId]/[periodId]/page.tsx
import { getGradebookData } from "../../../actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GradebookForm } from "./GradebookForm";


export const dynamic = "force-dynamic";

function statusBadge(status: string) {
  const map: Record<string, { class: string; label: string }> = {
    draft: { class: "border-neutral-400 text-neutral-600", label: "Draft" },
    submitted: { class: "border-amber-500 text-amber-700", label: "Submitted" },
    returned: { class: "border-red-500 text-red-700", label: "Returned" },
    approved: { class: "border-blue-500 text-blue-700", label: "Approved" },
    released: { class: "border-green-500 text-green-700", label: "Released" },
  };
  const s = map[status] ?? { class: "", label: status };
  return <Badge variant="outline" className={s.class}>{s.label}</Badge>;
}

export const metadata = { title: "Gradebook" };

export default async function TeacherGradebookPage({
  params,
}: {
  params: Promise<{ scheduleId: string; periodId: string }>;
}) {
  const { scheduleId, periodId } = await params;
  const result = await getGradebookData(scheduleId, periodId);
  if (result.error || !result.submission || !result.schedule) {
    if (result.error === "You are not assigned to this class" || result.error === "Schedule not found") notFound();
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">Gradebook</h2>
        <p className="text-sm text-red-600">{result.error ?? "Failed to load gradebook."}</p>
      </div>
    );
  }
  const { submission, entries, schedule, periodName } = result;
  const canEdit = submission.status === "draft" || submission.status === "returned";
  const registrarRemarks =
    submission.status === "returned" && submission.registrarRemarks
      ? submission.registrarRemarks
      : null;

  return (
    <div className="space-y-6">
      <section className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
            {schedule.subjectCode} — {schedule.sectionName} • {periodName}
          </h2>
          <p className="mt-1 text-sm text-neutral-800">
            <Link href={`/teacher/classes/${scheduleId}`} className="text-[#6A0000] hover:underline">
              ← Back to class
            </Link>
          </p>
        </div>
        {statusBadge(submission.status)}
      </section>

      {registrarRemarks && (
        <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-900">Registrar remarks (action needed)</p>
          <p className="mt-1 text-sm text-red-800 whitespace-pre-wrap">{registrarRemarks}</p>
          <p className="mt-2 text-xs text-red-700">Edit grades below and resubmit for approval.</p>
        </div>
      )}

      {!canEdit && submission.status === "approved" && (
        <p className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800">
          Approved by registrar. Grades are read-only.
        </p>
      )}
      {!canEdit && submission.status === "released" && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
          Released to students. Grades are read-only.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-[#6A0000]">
            Grades
          </CardTitle>
          {!canEdit && submission.status !== "returned" && (
            <p className="text-xs text-amber-700">
              Editing is locked. This submission has been {submission.status}.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <GradebookForm
            submissionId={submission.id}
            entries={entries}
            canEdit={canEdit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
