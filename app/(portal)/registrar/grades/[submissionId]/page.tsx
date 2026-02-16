// path: app/(portal)/registrar/grades/[submissionId]/page.tsx
import { getGradeSubmissionWithDetails, getGradeEntriesBySubmissionId, getAuditLogPage } from "@/db/queries";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubmissionActions } from "./SubmissionActions";
import { Clock } from "lucide-react";

export const dynamic = "force-dynamic";

function statusBadge(status: string) {
  const map: Record<string, string> = {
    draft: "border-neutral-400 text-neutral-600",
    submitted: "border-amber-500 text-amber-700",
    returned: "border-red-500 text-red-700",
    approved: "border-blue-500 text-blue-700",
    released: "border-green-500 text-green-700",
  };
  return map[status] ?? "";
}

export const metadata = { title: "Submission Review" };

export default async function RegistrarSubmissionReviewPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const user = await getCurrentUserWithRole();
  if (!user || (user.role !== "registrar" && user.role !== "admin")) redirect("/not-authorized");
  const { submissionId } = await params;
  const [details, entries, auditLogs] = await Promise.all([
    getGradeSubmissionWithDetails(submissionId),
    getGradeEntriesBySubmissionId(submissionId),
    getAuditLogPage({
      entityType: "grade_submission",
      entityId: submissionId,
      limit: 10,
    }),
  ]);
  if (!details) notFound();

  return (
    <div className="space-y-6">
      <section className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
            {details.subjectCode} — {details.sectionName} • {details.gradingPeriodName}
          </h2>
          <p className="mt-1 text-sm text-neutral-800">
            Teacher: {details.teacherFirstName} {details.teacherLastName}
            {details.submittedAt && (
              <> • Submitted {new Date(details.submittedAt).toLocaleString()}</>
            )}
          </p>
          <Link
            href="/registrar/grades"
            className="mt-2 inline-block text-sm text-[#6A0000] hover:underline"
          >
            ← Back to grade releases
          </Link>
        </div>
        <Badge variant="outline" className={statusBadge(details.status)}>
          {details.status}
        </Badge>
      </section>

      <SubmissionActions
        submissionId={submissionId}
        status={details.status}
      />

      {details.registrarRemarks && details.status === "returned" && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="text-sm text-red-800">Return remarks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-800">{details.registrarRemarks}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-[#6A0000]">
            Roster grades (read-only)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs font-medium text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2">Student</th>
                  <th className="px-4 py-2">Code</th>
                  <th className="px-4 py-2 text-right">Numeric</th>
                  <th className="px-4 py-2">Letter</th>
                  <th className="px-4 py-2">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-t">
                    <td className="px-4 py-2">
                      {[e.firstName, e.middleName, e.lastName].filter(Boolean).join(" ")}
                    </td>
                    <td className="px-4 py-2 text-neutral-600">{e.studentCode ?? "—"}</td>
                    <td className="px-4 py-2 text-right">{e.numericGrade ?? "—"}</td>
                    <td className="px-4 py-2">{e.letterGrade ?? "—"}</td>
                    <td className="px-4 py-2 text-neutral-600">{e.remarks ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {entries.length === 0 && (
            <p className="py-4 text-center text-sm text-neutral-600">No grade entries.</p>
          )}
        </CardContent>
      </Card>

      {auditLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#6A0000]">
              <Clock className="h-4 w-4" />
              History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {auditLogs.map((log) => {
                const after = log.after as { remarks?: unknown } | null;
                const remarks =
                  after && typeof after.remarks === "string" ? after.remarks : null;
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 rounded-md border bg-neutral-50/50 px-3 py-2 text-sm"
                  >
                    <div className="flex-1">
                      <span className="font-medium text-[#6A0000]">{log.action}</span>
                      <span className="ml-2 text-xs text-neutral-600">
                        {log.createdAt
                          ? new Date(log.createdAt).toLocaleString()
                          : "—"}
                      </span>
                    </div>
                    {remarks && (
                      <span className="text-xs text-neutral-600">{remarks}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
