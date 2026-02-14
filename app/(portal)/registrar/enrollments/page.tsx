import Link from "next/link";
import {
  getEnrollmentsListWithFinanceStatus,
  getSchoolYearsList,
  getTermsList,
  getStudentsList,
  getProgramsList,
  getSectionsList,
} from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateEnrollmentForm } from "./CreateEnrollmentForm";
import { EnrollmentFilters } from "./EnrollmentFilters";

export const dynamic = "force-dynamic";

function fullName(row: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
}) {
  return [row.firstName, row.middleName, row.lastName].filter(Boolean).join(" ");
}

export default async function EnrollmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    studentId?: string;
    schoolYearId?: string;
    termId?: string;
    programId?: string;
  }>;
}) {
  const params = await searchParams;
  const [enrollmentsList, schoolYears, terms, students, programs, sections] =
    await Promise.all([
      getEnrollmentsListWithFinanceStatus(params),
      getSchoolYearsList(),
      getTermsList(),
      getStudentsList(),
      getProgramsList(),
      getSectionsList(),
    ]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Enrollment Records
        </h2>
        <p className="text-sm text-neutral-800">
          Create and manage student enrollments.
        </p>
      </div>

      <EnrollmentFilters programs={programs} />

      <CreateEnrollmentForm
        schoolYears={schoolYears}
        terms={terms}
        students={students}
        programs={programs}
        sections={sections}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">
            All enrollments ({enrollmentsList.length})
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
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Finance Status</th>
                  <th className="px-4 py-2">Balance</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrollmentsList.map((row) => (
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
                    <td className="px-4 py-2 font-mono text-[#6A0000]">
                      {row.programCode ?? row.program ?? "—"}
                    </td>
                    <td className="px-4 py-2">{row.yearLevel ?? "—"}</td>
                    <td className="px-4 py-2">
                      {row.sectionId
                        ? sections.find((s) => s.id === row.sectionId)?.name ?? "—"
                        : "—"}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          row.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : row.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          row.financeStatus === "cleared"
                            ? "bg-green-100 text-green-800"
                            : row.financeStatus === "paid"
                            ? "bg-green-100 text-green-800"
                            : row.financeStatus === "partially_paid"
                            ? "bg-amber-100 text-amber-800"
                            : row.financeStatus === "assessed"
                            ? "bg-blue-100 text-blue-800"
                            : row.financeStatus === "hold"
                            ? "bg-red-100 text-red-800"
                            : "bg-neutral-200 text-neutral-800"
                        }`}
                      >
                        {row.financeStatus ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {row.financeBalance != null
                        ? `₱${parseFloat(row.financeBalance).toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-neutral-800">
                      {row.createdAt
                        ? new Date(row.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {row.status === "pending_approval" && (
                        <Link href="/registrar/approvals">
                          <span className="text-xs font-medium text-[#6A0000] hover:underline">
                            Review
                          </span>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
                {enrollmentsList.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-8 text-center text-sm text-neutral-800"
                    >
                      No enrollments found.
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
