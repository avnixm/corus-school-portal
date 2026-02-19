"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatStatusForDisplay } from "@/lib/formatStatus";

function statusClass(s: string) {
  const map: Record<string, string> = {
    draft: "bg-neutral-200 text-neutral-800",
    submitted: "bg-amber-100 text-amber-800",
    returned: "bg-red-100 text-red-800",
    approved: "bg-blue-100 text-blue-800",
    released: "bg-green-100 text-green-800",
  };
  return map[s] ?? "bg-neutral-100 text-neutral-800";
}

type SubmissionRow = {
  id: string;
  subjectCode: string;
  sectionName: string;
  gradingPeriodName: string;
  teacherFirstName: string | null;
  teacherLastName: string | null;
  status: string;
  submittedAt: Date | null;
  updatedAt: Date | null;
};

type AnalyticsData = {
  passFail: { pass: number; fail: number };
  distribution: { label: string; count: number }[];
  avgBySubject: { subjectId: string; subjectCode: string; subjectDescription: string | null; avg: string | null; count: number }[];
  top10: { studentId: string; studentCode: string | null; firstName: string; lastName: string; avg: string | null }[];
  bottom10: { studentId: string; studentCode: string | null; firstName: string; lastName: string; avg: string | null }[];
};

export function GradesPageContent({
  view,
  analytics,
  submissions,
}: {
  view: "analytics" | "submissions";
  analytics: AnalyticsData;
  submissions: SubmissionRow[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setView(newView: "analytics" | "submissions") {
    const next = new URLSearchParams(searchParams);
    next.set("view", newView);
    router.push(`/program-head/grades?${next.toString()}`);
  }

  const { passFail, distribution, avgBySubject, top10, bottom10 } = analytics;

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-neutral-200">
        <button
          type="button"
          onClick={() => setView("analytics")}
          className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
            view === "analytics"
              ? "border-[#6A0000] text-[#6A0000]"
              : "border-transparent text-neutral-600 hover:text-neutral-900"
          }`}
        >
          Analytics
        </button>
        <button
          type="button"
          onClick={() => setView("submissions")}
          className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
            view === "submissions"
              ? "border-[#6A0000] text-[#6A0000]"
              : "border-transparent text-neutral-600 hover:text-neutral-900"
          }`}
        >
          Submissions
        </button>
      </div>

      {view === "analytics" && (
        <>
          <section className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-neutral-900">
                  Pass / Fail
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-6">
                  <div>
                    <span className="text-2xl font-bold text-green-700">{passFail.pass}</span>
                    <span className="ml-2 text-sm text-neutral-600">Pass (≥75)</span>
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-red-700">{passFail.fail}</span>
                    <span className="ml-2 text-sm text-neutral-600">Fail (&lt;75)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-neutral-900">
                  Grade Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  {distribution.map((d) => (
                    <div key={d.label} className="flex items-center gap-2">
                      <span className="w-16">{d.label}</span>
                      <div className="h-4 flex-1 max-w-[120px] overflow-hidden rounded bg-neutral-200">
                        <div
                          className="h-full bg-[#6A0000]"
                          style={{
                            width: `${Math.min(100, (d.count / Math.max(1, distribution.reduce((a, x) => a + x.count, 0))) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-neutral-600">{d.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-neutral-900">
                Average Grade by Subject
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl border bg-white/80 text-sm">
                <table className="min-w-full">
                  <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                    <tr>
                      <th className="px-4 py-2 text-left">Code</th>
                      <th className="px-4 py-2 text-left">Description</th>
                      <th className="px-4 py-2 text-right">Avg</th>
                      <th className="px-4 py-2 text-right">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {avgBySubject.map((s) => (
                      <tr key={s.subjectId} className="border-b last:border-0">
                        <td className="px-4 py-2">{s.subjectCode}</td>
                        <td className="px-4 py-2">{s.subjectDescription}</td>
                        <td className="px-4 py-2 text-right">{s.avg ?? "—"}</td>
                        <td className="px-4 py-2 text-right">{s.count}</td>
                      </tr>
                    ))}
                    {avgBySubject.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-4 text-center text-neutral-600">
                          No data
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <section className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-neutral-900">
                  Top 10 by Average
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-xl border bg-white/80 text-sm">
                  <table className="min-w-full">
                    <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                      <tr>
                        <th className="px-4 py-2 text-left">Student</th>
                        <th className="px-4 py-2 text-right">Avg</th>
                      </tr>
                    </thead>
                    <tbody>
                      {top10.map((s) => (
                        <tr key={s.studentId} className="border-b last:border-0">
                          <td className="px-4 py-2">
                            {s.studentCode ?? s.firstName} {s.lastName}
                          </td>
                          <td className="px-4 py-2 text-right">{s.avg ?? "—"}</td>
                        </tr>
                      ))}
                      {top10.length === 0 && (
                        <tr>
                          <td colSpan={2} className="px-4 py-4 text-center text-neutral-600">
                            No data
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-neutral-900">
                  Bottom 10 by Average
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-xl border bg-white/80 text-sm">
                  <table className="min-w-full">
                    <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                      <tr>
                        <th className="px-4 py-2 text-left">Student</th>
                        <th className="px-4 py-2 text-right">Avg</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bottom10.map((s) => (
                        <tr key={s.studentId} className="border-b last:border-0">
                          <td className="px-4 py-2">
                            {s.studentCode ?? s.firstName} {s.lastName}
                          </td>
                          <td className="px-4 py-2 text-right">{s.avg ?? "—"}</td>
                        </tr>
                      ))}
                      {bottom10.length === 0 && (
                        <tr>
                          <td colSpan={2} className="px-4 py-4 text-center text-neutral-600">
                            No data
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </section>
        </>
      )}

      {view === "submissions" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-neutral-900">
              Submissions ({submissions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-xl border bg-white/80 text-sm">
              <table className="min-w-full">
                <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                  <tr>
                    <th className="px-4 py-2 text-left">Subject</th>
                    <th className="px-4 py-2 text-left">Section</th>
                    <th className="px-4 py-2 text-left">Period</th>
                    <th className="px-4 py-2 text-left">Teacher</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-right">Submitted</th>
                    <th className="px-4 py-2 text-right">Updated</th>
                    <th className="px-4 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="px-4 py-2">{s.subjectCode}</td>
                      <td className="px-4 py-2">{s.sectionName}</td>
                      <td className="px-4 py-2">{s.gradingPeriodName}</td>
                      <td className="px-4 py-2">
                        {s.teacherFirstName} {s.teacherLastName}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`rounded px-2 py-0.5 text-xs uppercase ${statusClass(s.status)}`}>
                          {formatStatusForDisplay(s.status)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right text-neutral-600">
                        {s.submittedAt
                          ? new Date(s.submittedAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-2 text-right text-neutral-600">
                        {s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-2">
                        <Link
                          href={`/registrar/grades/${s.id}`}
                          className="text-xs font-medium text-[#6A0000] hover:underline"
                        >
                          View (Registrar)
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {submissions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-neutral-600">
                        No submissions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
