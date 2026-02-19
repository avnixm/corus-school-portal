import { Suspense } from "react";
import Link from "next/link";
import { formatStatusForDisplay } from "@/lib/formatStatus";
import {
  getPendingEnrollmentApprovalsList,
  getProgramsList,
  getQueueSubmissions,
  getSchoolYearsList,
  getTermsList,
  getRequirementsList,
  getRequirementRulesList,
} from "@/db/queries";
import { getEnrollmentRequirementsSummariesBatch } from "@/lib/requirements/enrollmentSummary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EnrollmentApprovalActions } from "./EnrollmentApprovalActions";
import { EnrollmentApprovalsFilters } from "./EnrollmentApprovalsFilters";
import { RequirementsBadge } from "./RequirementsBadge";
import { getAgeBadgeProps } from "@/lib/ui/age";
import { QueueFilters } from "../requirements/queue/QueueFilters";
import { QueueTable } from "../requirements/queue/QueueTable";
import { RequirementsMasterTab } from "../requirements/RequirementsMasterTab";
import { RequirementsRulesTab } from "../requirements/RequirementsRulesTab";

export type ApprovalsSearchParams = {
  tab?: string;
  search?: string;
  program?: string;
  yearLevel?: string;
  reqsStatus?: string;
  schoolYearId?: string;
  termId?: string;
  enrollmentStatus?: string;
};

function fullName(row: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
}) {
  return [row.firstName, row.middleName, row.lastName].filter(Boolean).join(" ");
}

export async function EnrollmentsTab({
  params,
  programs,
}: {
  params: ApprovalsSearchParams;
  programs: Awaited<ReturnType<typeof getProgramsList>>;
}) {
  const allEnrollments = await getPendingEnrollmentApprovalsList(params.search);
  let enrollments = allEnrollments;
  if (params.program) {
    enrollments = enrollments.filter(
      (e) => e.programCode === params.program || e.program === params.program
    );
  }
  if (params.yearLevel) {
    enrollments = enrollments.filter((e) => e.yearLevel === params.yearLevel);
  }

  const summaryByEnrollmentId = await getEnrollmentRequirementsSummariesBatch(
    enrollments.map((row) => ({
      enrollmentId: row.id,
      studentId: row.studentId,
      program: row.programCode ?? row.program ?? null,
      yearLevel: row.yearLevel ?? null,
      schoolYearId: row.schoolYearId,
      termId: row.termId,
    }))
  );

  if (params.reqsStatus === "complete") {
    enrollments = enrollments.filter((e) => {
      const summary = summaryByEnrollmentId.get(e.id);
      return (
        (summary && summary.required === 0) ||
        (summary && summary.verified >= summary.required)
      );
    });
  } else if (params.reqsStatus === "incomplete") {
    enrollments = enrollments.filter((e) => {
      const summary = summaryByEnrollmentId.get(e.id);
      return summary && summary.required > 0 && summary.verified < summary.required;
    });
  }

  return (
    <>
      <Suspense fallback={<div className="h-10" />}>
        <EnrollmentApprovalsFilters programs={programs} current={params} />
      </Suspense>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">
            Pending approvals ({enrollments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border bg-white/80 text-neutral-900">
            <table className="min-w-full text-left text-sm text-neutral-900">
              <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2">Age</th>
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
                {enrollments.map((row) => {
                  const ageProps = getAgeBadgeProps(row.createdAt);
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
                          className={`rounded px-2 py-0.5 text-xs uppercase ${
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
                          {row.financeStatus ? formatStatusForDisplay(row.financeStatus) : "—"}
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
                  );
                })}
                {enrollments.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
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
    </>
  );
}

export async function QueueTab({
  params,
  programs,
  basePath = "/registrar/approvals",
  tabValue,
}: {
  params: ApprovalsSearchParams;
  programs: Awaited<ReturnType<typeof getProgramsList>>;
  /** When on canonical queue route use "/registrar/approvals/queue"; on main page with ?tab=queue use "/registrar/approvals" and tabValue="queue". */
  basePath?: string;
  tabValue?: string;
}) {
  const [rows, schoolYears, terms] = await Promise.all([
    getQueueSubmissions({
      schoolYearId: params.schoolYearId,
      termId: params.termId,
      program: params.program,
      search: params.search,
      enrollmentStatus: params.enrollmentStatus,
    }),
    getSchoolYearsList(),
    getTermsList(),
  ]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/registrar/approvals/requirements"
          className="text-sm text-[#6A0000] hover:underline"
        >
          ← Requirements setup
        </Link>
      </div>
      <QueueFilters
        schoolYears={schoolYears}
        terms={terms}
        programs={programs}
        current={params}
        basePath={basePath}
        tabValue={tabValue}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-[#6A0000]">
            Submissions ({rows.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <QueueTable rows={rows} />
        </CardContent>
      </Card>
    </>
  );
}

export async function RequirementsTab() {
  const [schoolYears, terms] = await Promise.all([
    getSchoolYearsList(),
    getTermsList(),
  ]);
  let requirements: Awaited<ReturnType<typeof getRequirementsList>> = [];
  let rules: Awaited<ReturnType<typeof getRequirementRulesList>> = [];
  try {
    [requirements, rules] = await Promise.all([
      getRequirementsList(false),
      getRequirementRulesList(),
    ]);
  } catch {
    // tables may not exist yet
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/registrar/approvals/queue"
          className="rounded-lg border border-[#6A0000]/30 bg-[#6A0000]/10 px-4 py-2 text-sm font-medium text-[#6A0000] hover:bg-[#6A0000]/20"
        >
          Verification queue
        </Link>
      </div>
      <Tabs defaultValue="master" className="w-full">
        <TabsList>
          <TabsTrigger value="master">Master requirements</TabsTrigger>
          <TabsTrigger value="rules">Rules / applicability</TabsTrigger>
        </TabsList>
        <TabsContent value="master">
          <RequirementsMasterTab requirements={requirements} />
        </TabsContent>
        <TabsContent value="rules">
          <RequirementsRulesTab
            rules={rules}
            requirements={requirements}
            schoolYears={schoolYears}
            terms={terms}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
