import { Suspense } from "react";
import Link from "next/link";
import { getPendingEnrollmentApprovalsList } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnrollmentApprovalActions } from "./EnrollmentApprovalActions";
import { EnrollmentApprovalsSearch } from "./EnrollmentApprovalsSearch";

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
          <div className="overflow-hidden rounded-xl border bg-white/80">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2">Student</th>
                  <th className="px-4 py-2">School Year / Term</th>
                  <th className="px-4 py-2">Program</th>
                  <th className="px-4 py-2">Year Level</th>
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
                    <td className="px-4 py-2">{row.program ?? "—"}</td>
                    <td className="px-4 py-2">{row.yearLevel ?? "—"}</td>
                    <td className="px-4 py-2 text-neutral-800">
                      {row.createdAt
                        ? new Date(row.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <EnrollmentApprovalActions enrollmentId={row.id} />
                    </td>
                  </tr>
                ))}
                {enrollments.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
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
