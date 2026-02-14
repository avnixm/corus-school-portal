// path: app/(portal)/teacher/classes/[scheduleId]/page.tsx
import { getClassDetailData } from "../../actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NotebookPen } from "lucide-react";

export const dynamic = "force-dynamic";

function statusBadge(status: string) {
  const map: Record<string, { class: string; label: string }> = {
    draft: { class: "border-neutral-400 text-neutral-600", label: "Draft" },
    submitted: { class: "border-amber-500 text-amber-700", label: "Submitted" },
    returned: { class: "border-red-500 text-red-700", label: "Returned" },
    approved: { class: "border-blue-500 text-blue-700", label: "Approved" },
    released: { class: "border-green-500 text-green-700", label: "Released" },
    none: { class: "border-neutral-300 text-neutral-500", label: "No submission" },
  };
  const s = map[status] ?? { class: "", label: status };
  return <Badge variant="outline" className={s.class}>{s.label}</Badge>;
}

export default async function TeacherClassDetailPage({
  params,
}: {
  params: Promise<{ scheduleId: string }>;
}) {
  const { scheduleId } = await params;
  const data = await getClassDetailData(scheduleId);
  if (!data) notFound();
  const { schedule, periods, roster, submissionsByPeriod } = data;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          {schedule.subjectCode} — {schedule.subjectDescription}
        </h2>
        <p className="mt-1 text-sm text-neutral-800">
          Section {schedule.sectionName} • {schedule.timeIn ?? "—"}–{schedule.timeOut ?? "—"}
          {schedule.room ? ` • ${schedule.room}` : ""}
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-[#6A0000]">
            Grading periods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {submissionsByPeriod.map((sp) => (
              <div
                key={sp.periodId}
                className="flex items-center gap-2 rounded-lg border px-3 py-2"
              >
                <span className="font-medium">{sp.periodName}</span>
                {statusBadge(sp.status)}
                <Link href={`/teacher/gradebook/${scheduleId}/${sp.periodId}`}>
                  <Button size="sm" variant="outline" className="border-[#6A0000]/40 text-[#6A0000]">
                    <NotebookPen className="mr-1 h-3 w-3" />
                    Open Gradebook
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          {periods.length === 0 && (
            <p className="text-sm text-neutral-600">No grading periods set for this term.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-[#6A0000]">
            Roster ({roster.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-md border">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs font-medium text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2">Student</th>
                  <th className="px-4 py-2">Code</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((r) => (
                  <tr key={r.studentId} className="border-t">
                    <td className="px-4 py-2">
                      {[r.firstName, r.middleName, r.lastName].filter(Boolean).join(" ")}
                    </td>
                    <td className="px-4 py-2 text-neutral-600">{r.studentCode ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {roster.length === 0 && (
            <p className="py-4 text-center text-sm text-neutral-600">
              No enrolled students in this section yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
