import { Suspense } from "react";
import Link from "next/link";
import { getPendingEnrollmentApprovalsList } from "@/db/queries";
import { getEnrollmentRequirementsSummary } from "@/lib/requirements/enrollmentSummary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnrollmentApprovalActions } from "./EnrollmentApprovalActions";
import { EnrollmentApprovalsSearch } from "./EnrollmentApprovalsSearch";
import { RequirementsBadge } from "./RequirementsBadge";

export const dynamic = "force-dynamic";

function fullName(row: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
}) {
  return [row.firstName, row.middleName, row.lastName].filter(Boolean).join(" ");
}

export default async function EnrollmentApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const enrollments = await getPendingEnrollmentApprovalsList(search);
  const summaries = await Promise.all(
    enrollments.map((row) =>
      getEnrollmentRequirementsSummary({
        studentId: row.studentId,
        enrollmentId: row.id,
        program: row.programCode ?? row.program ?? null,
        yearLevel: row.yearLevel ?? null,
        schoolYearId: row.schoolYearId,
        termId: row.termId,
      })
    )
  );
  const summaryByEnrollmentId = new Map(enrollments.map((r, i) => [r.id, summaries[i]]));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Enrollment Approvals
        </h2>
        <p className="text-sm text-neutral-800">
          Review and approve or reject enrollment requests.
        </p>
      </div>

      <Suspense fallback={<div className="h-10" />}>
        <EnrollmentApprovalsSearch />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">
            Pending approvals ({enrollments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border bg-white/80 text-neutral-900">
            <table className="min-w-full text-left text-sm text-neutral-900">
              <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2">Student</th>
                  <th className="px-4 py-2">School Year / Term</th>
                  <th className="px-4 py-2">Program</th>
                  <th className="px-4 py-2">Year Level</th>
                  <th className="px-4 py-2">Section</th>
                  <th className="px-4 py-2">Requirements</th>
                  <th className="px-4 py-2">Finance</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b last:border-0 hover:bg-neutral-50/80"
                  >
                    <td className="px-4 py-2">
                      <Link
                        href={`/registrar/students/${row.studentId}`}
                        className="font-medium text-[#6A0000] hover:underline"
                      >
                        {fullName(row)}
                      </Link>
                      {row.studentCode && (
                        <span className="ml-1 text-xs text-neutral-700">
                          ({row.studentCode})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {row.schoolYearName} • {row.termName}
                    </td>
                    <td className="px-4 py-2">
                      <span className="rounded bg-[#6A0000]/10 px-2 py-0.5 font-mono text-xs text-[#6A0000]">
                        {row.programCode ?? row.program ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2">{row.yearLevel ?? "—"}</td>
                    <td className="px-4 py-2">{row.sectionName ?? "—"}</td>
                    <td className="px-4 py-2">
                      <div className="flex flex-col gap-1">
                        <RequirementsBadge summary={summaryByEnrollmentId.get(row.id)} />
                        <Link
                          href={`/registrar/approvals/${row.id}/review`}
                          className="text-xs text-[#6A0000] hover:underline"
                        >
                          Review files
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          row.financeStatus === "cleared"
                            ? "bg-green-100 text-green-800"
                            : row.financeStatus === "paid"
                            ? "bg-green-100 text-green-800"
                            : row.financeStatus === "assessed"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-neutral-100 text-neutral-700"
                        }`}
                        title="Read-only"
                      >
                        {row.financeStatus ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-neutral-800">
                      {row.createdAt
                        ? new Date(row.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <EnrollmentApprovalActions
                        enrollmentId={row.id}
                        requirementsSummary={summaryByEnrollmentId.get(row.id)}
                      />
                    </td>
                  </tr>
                ))}
                {enrollments.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-8 text-center text-sm text-neutral-800"
                    >
                      No pending enrollment approvals.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
