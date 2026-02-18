import Link from "next/link";
import {
  getPendingEnrollmentApprovalsList,
  getQueueSubmissions,
  listGradeSubmissionsForRegistrar,
  getPendingEnrollmentApprovalsCount,
  getRequirementVerificationsAwaitingCount,
  getGradeSubmissionsAwaitingReviewCount,
} from "@/db/queries";
import { getEnrollmentRequirementsSummary } from "@/lib/requirements/enrollmentSummary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, FileCheck, Send } from "lucide-react";
import { getAgeBadgeProps } from "@/lib/ui/age";

export const dynamic = "force-dynamic";

export const metadata = { title: "Workbench" };

function fullName(row: {
  firstName: string | null;
  middleName?: string | null;
  lastName: string | null;
}) {
  return [row.firstName, row.middleName, row.lastName].filter(Boolean).join(" ");
}

export default async function RegistrarWorkbenchPage() {
  // Fetch counts for summary cards
  const [
    enrollmentCount,
    requirementCount,
    gradeCount,
  ] = await Promise.all([
    getPendingEnrollmentApprovalsCount(),
    getRequirementVerificationsAwaitingCount(),
    getGradeSubmissionsAwaitingReviewCount(),
  ]);

  // Fetch top 25 items from each queue
  const [enrollments, requirements, grades] = await Promise.all([
    getPendingEnrollmentApprovalsList().then((rows) => rows.slice(0, 25)),
    getQueueSubmissions({}).then((rows) => rows.slice(0, 25)),
    listGradeSubmissionsForRegistrar({ status: "submitted" }).then((rows) => rows.slice(0, 25)),
  ]);

  // Compute requirements summaries for enrollments
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
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Registrar Workbench
        </h2>
        <p className="mt-1 text-sm text-neutral-800">
          Process enrollments, verify requirements, and release grades faster.
        </p>
      </section>

      {/* Summary Cards */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-800">
              Enrollment Approvals
            </CardTitle>
            <BadgeCheck className="h-4 w-4 text-[#6A0000]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#6A0000]">
              {enrollmentCount}
            </div>
            <Link
              href="/registrar/approvals"
              className="mt-2 inline-block text-xs font-medium text-[#6A0000] hover:underline"
            >
              View all →
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-800">
              Requirements to Verify
            </CardTitle>
            <FileCheck className="h-4 w-4 text-[#6A0000]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#6A0000]">
              {requirementCount}
            </div>
            <Link
              href="/registrar/requirements/queue"
              className="mt-2 inline-block text-xs font-medium text-[#6A0000] hover:underline"
            >
              View queue →
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-800">
              Grade Submissions
            </CardTitle>
            <Send className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {gradeCount}
            </div>
            <Link
              href="/registrar/grades"
              className="mt-2 inline-block text-xs font-medium text-[#6A0000] hover:underline"
            >
              View all →
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Tabbed Queues */}
      <Tabs defaultValue="enrollments" className="w-full">
        <TabsList className="bg-neutral-100">
          <TabsTrigger value="enrollments">
            Enrollments ({enrollments.length})
          </TabsTrigger>
          <TabsTrigger value="requirements">
            Requirements ({requirements.length})
          </TabsTrigger>
          <TabsTrigger value="grades">
            Grades ({grades.length})
          </TabsTrigger>
        </TabsList>

        {/* Enrollments Tab */}
        <TabsContent value="enrollments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-[#6A0000]">
                Recent Enrollment Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl border bg-white/80 text-neutral-900">
                <table className="min-w-full text-left text-sm text-neutral-900">
                  <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                    <tr>
                      <th className="px-4 py-2">Age</th>
                      <th className="px-4 py-2">Student</th>
                      <th className="px-4 py-2">Program</th>
                      <th className="px-4 py-2">Year Level</th>
                      <th className="px-4 py-2">Requirements</th>
                      <th className="px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((row) => {
                      const ageProps = getAgeBadgeProps(row.createdAt);
                      const summary = summaryByEnrollmentId.get(row.id);
                      return (
                        <tr
                          key={row.id}
                          className="border-b last:border-0 hover:bg-neutral-50/80"
                        >
                          <td className="px-4 py-2">
                            <Badge variant={ageProps.variant} className="text-xs">
                              {ageProps.label}
                            </Badge>
                          </td>
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
                            <span className="rounded bg-[#6A0000]/10 px-2 py-0.5 font-mono text-xs text-[#6A0000]">
                              {row.programCode ?? row.program ?? "—"}
                            </span>
                          </td>
                          <td className="px-4 py-2">{row.yearLevel ?? "—"}</td>
                          <td className="px-4 py-2">
                            {summary && (
                              <span className="text-xs text-neutral-600">
                                {summary.verified}/{summary.required} verified
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <Link
                              href={`/registrar/approvals/${row.id}/review`}
                              className="text-xs font-medium text-[#6A0000] hover:underline"
                            >
                              Review →
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
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
              {enrollments.length > 0 && (
                <div className="mt-4 text-center">
                  <Link
                    href="/registrar/approvals"
                    className="text-sm font-medium text-[#6A0000] hover:underline"
                  >
                    View all {enrollmentCount} enrollments →
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requirements Tab */}
        <TabsContent value="requirements" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-[#6A0000]">
                Recent Requirement Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl border bg-white/80 text-neutral-900">
                <table className="min-w-full text-left text-sm text-neutral-900">
                  <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                    <tr>
                      <th className="px-4 py-2">Age</th>
                      <th className="px-4 py-2">Student</th>
                      <th className="px-4 py-2">Requirement</th>
                      <th className="px-4 py-2">Program / Year</th>
                      <th className="px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requirements.map((row) => {
                      const ageProps = getAgeBadgeProps(row.submittedAt);
                      return (
                        <tr
                          key={row.id}
                          className="border-b last:border-0 hover:bg-neutral-50/80"
                        >
                          <td className="px-4 py-2">
                            <Badge variant={ageProps.variant} className="text-xs">
                              {ageProps.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-2">
                            <Link
                              href={`/registrar/students/${row.studentId}`}
                              className="font-medium text-[#6A0000] hover:underline"
                            >
                              {fullName(row)}
                            </Link>
                            {row.studentCode && (
                              <span className="ml-1 text-xs text-neutral-600">
                                ({row.studentCode})
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <span className="font-mono text-xs">{row.requirementCode}</span>
                            {" – "}
                            {row.requirementName}
                          </td>
                          <td className="px-4 py-2">
                            {row.program ?? "—"} / {row.yearLevel ?? "—"}
                          </td>
                          <td className="px-4 py-2">
                            <Link
                              href="/registrar/requirements/queue"
                              className="text-xs font-medium text-[#6A0000] hover:underline"
                            >
                              Verify →
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                    {requirements.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-8 text-center text-sm text-neutral-800"
                        >
                          No submissions awaiting verification.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {requirements.length > 0 && (
                <div className="mt-4 text-center">
                  <Link
                    href="/registrar/requirements/queue"
                    className="text-sm font-medium text-[#6A0000] hover:underline"
                  >
                    View all {requirementCount} requirements →
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grades Tab */}
        <TabsContent value="grades" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-[#6A0000]">
                Recent Grade Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl border bg-white/80 text-neutral-900">
                <table className="min-w-full text-left text-sm text-neutral-900">
                  <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                    <tr>
                      <th className="px-4 py-2">Age</th>
                      <th className="px-4 py-2">Subject</th>
                      <th className="px-4 py-2">Section</th>
                      <th className="px-4 py-2">Period</th>
                      <th className="px-4 py-2">Teacher</th>
                      <th className="px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((row) => {
                      const ageProps = getAgeBadgeProps(row.submittedAt);
                      return (
                        <tr
                          key={row.id}
                          className="border-b last:border-0 hover:bg-neutral-50/80"
                        >
                          <td className="px-4 py-2">
                            <Badge variant={ageProps.variant} className="text-xs">
                              {ageProps.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 font-medium text-[#6A0000]">
                            {row.subjectCode}
                          </td>
                          <td className="px-4 py-2">{row.sectionName}</td>
                          <td className="px-4 py-2">{row.gradingPeriodName}</td>
                          <td className="px-4 py-2 text-xs text-neutral-600">
                            {row.teacherFirstName} {row.teacherLastName}
                          </td>
                          <td className="px-4 py-2">
                            <Link
                              href={`/registrar/grades/${row.id}`}
                              className="text-xs font-medium text-[#6A0000] hover:underline"
                            >
                              Review →
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                    {grades.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-sm text-neutral-800"
                        >
                          No submissions awaiting review.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {grades.length > 0 && (
                <div className="mt-4 text-center">
                  <Link
                    href="/registrar/grades"
                    className="text-sm font-medium text-[#6A0000] hover:underline"
                  >
                    View all {gradeCount} grade submissions →
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
