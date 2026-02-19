import Link from "next/link";
import { Suspense } from "react";
import { getStudentsList } from "@/db/queries";
import {
  getEnrollmentsListWithFinanceStatus,
  getSchoolYearsList,
  getTermsList,
  getStudentsList as getStudentsListForEnrollments,
  getProgramsList,
  getSectionsList,
  getEnrollmentClassSummaries,
} from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatStatusForDisplay } from "@/lib/formatStatus";
import { StudentsSearch } from "../students/StudentsSearch";
import { CreateStudentForm } from "../students/CreateStudentForm";
import { CreateEnrollmentForm } from "../enrollments/CreateEnrollmentForm";
import { EnrollmentFilters } from "../enrollments/EnrollmentFilters";
import { RegistrarAssignSectionCell } from "../enrollments/RegistrarAssignSectionCell";

export type RecordsSearchParams = {
  tab?: string;
  search?: string;
  studentId?: string;
  schoolYearId?: string;
  termId?: string;
  programId?: string;
};

function fullName(row: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
}) {
  return [row.firstName, row.middleName, row.lastName].filter(Boolean).join(" ");
}

export async function StudentsTab({
  params,
  basePath = "/registrar/records",
  tabValue,
}: {
  params: RecordsSearchParams;
  basePath?: string;
  tabValue?: string;
}) {
  const studentsList = await getStudentsList(params.search);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CreateStudentForm />
      </div>
      <Suspense fallback={<div className="h-10" />}>
        <StudentsSearch basePath={basePath} tabValue={tabValue} />
      </Suspense>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">
            All students ({studentsList.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border bg-white/80 text-neutral-900">
            <table className="min-w-full text-left text-sm text-neutral-900">
              <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2">Student No</th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Contact</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {studentsList.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b last:border-0 hover:bg-neutral-50/80"
                  >
                    <td className="px-4 py-2 font-mono text-xs">
                      {row.studentCode ?? "—"}
                    </td>
                    <td className="px-4 py-2 font-medium">
                      <Link
                        href={`/registrar/students/${row.id}`}
                        className="text-[#6A0000] hover:underline"
                      >
                        {fullName(row)}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{row.email ?? "—"}</td>
                    <td className="px-4 py-2">{row.contactNo ?? "—"}</td>
                    <td className="px-4 py-2 text-right">
                      <Link href={`/registrar/students/${row.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
                {studentsList.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-neutral-800"
                    >
                      No students found.
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

export async function EnrollmentsTab({
  params,
  basePath = "/registrar/records",
  tabValue,
}: {
  params: RecordsSearchParams;
  basePath?: string;
  tabValue?: string;
}) {
  const [
    enrollmentsList,
    schoolYears,
    terms,
    students,
    programs,
    sections,
  ] = await Promise.all([
    getEnrollmentsListWithFinanceStatus({
      studentId: params.studentId,
      schoolYearId: params.schoolYearId,
      termId: params.termId,
      programId: params.programId,
    }),
    getSchoolYearsList(),
    getTermsList(),
    getStudentsListForEnrollments(),
    getProgramsList(),
    getSectionsList(),
  ]);

  const approvedIds = enrollmentsList
    .filter((r) => r.status === "approved")
    .map((r) => r.id);
  const classSummaries = await getEnrollmentClassSummaries(approvedIds);

  return (
    <div className="space-y-4">
      <EnrollmentFilters
        programs={programs}
        basePath={basePath}
        tabValue={tabValue}
      />
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
          <div className="overflow-x-auto rounded-xl border bg-white/80 text-neutral-900">
            <table className="min-w-full text-left text-sm text-neutral-900">
              <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2">Student</th>
                  <th className="px-4 py-2">School Year / Term</th>
                  <th className="px-4 py-2">Program</th>
                  <th className="px-4 py-2">Year Level</th>
                  <th className="px-4 py-2">Section</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Classes</th>
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
                      {row.sectionId ? (
                        sections.find((s) => s.id === row.sectionId)?.name ?? "—"
                      ) : (row.status === "approved" || row.status === "enrolled") ? (
                        <RegistrarAssignSectionCell
                          enrollmentId={row.id}
                          sections={sections.map((s) => ({
                            id: s.id,
                            name: s.name,
                            yearLevel: s.yearLevel ?? null,
                            programId: s.programId ?? null,
                          }))}
                          enrollmentProgramId={row.programId ?? null}
                          enrollmentYearLevel={row.yearLevel}
                        />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs uppercase ${
                          row.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : row.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {formatStatusForDisplay(row.status)}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {row.status === "approved" ? (
                        (() => {
                          const summary = classSummaries.get(row.id);
                          return summary ? (
                            <span className="flex flex-col gap-0.5">
                              <span className="text-neutral-800">
                                Classes: {summary.classesAssigned}
                              </span>
                              {summary.schedulePending && (
                                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs uppercase text-amber-800">
                                  Schedule pending
                                </span>
                              )}
                            </span>
                          ) : (
                            "—"
                          );
                        })()
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs uppercase ${
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
                        {row.financeStatus
                          ? formatStatusForDisplay(row.financeStatus)
                          : "—"}
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
                      <Link
                        href={`/registrar/approvals/${row.id}/review`}
                        className="inline-flex items-center rounded-md border border-[#6A0000]/30 px-2 py-1 text-xs font-medium text-[#6A0000] hover:bg-[#6A0000]/5 hover:underline"
                      >
                        {row.status === "pending_approval" ? "Review" : "View"}
                      </Link>
                    </td>
                  </tr>
                ))}
                {enrollmentsList.length === 0 && (
                  <tr>
                    <td
                      colSpan={11}
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
