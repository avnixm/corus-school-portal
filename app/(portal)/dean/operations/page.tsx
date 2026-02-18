import Link from "next/link";
import {
  getDeanPendingEnrollmentApprovals,
  getDeanUnreleasedSubmissions,
  getDeanRequirementVerificationsSubmitted,
  getDeanClearanceHolds,
} from "@/lib/dean/queries";
import { getSchoolYearsList, getTermsBySchoolYearId, getActiveSchoolYear } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeanOperationsFilters } from "./DeanOperationsFilters";
import { formatStatusForDisplay } from "@/lib/formatStatus";

export const dynamic = "force-dynamic";

export const metadata = { title: "Operations" };

export default async function DeanOperationsPage({
  searchParams,
}: {
  searchParams: Promise<{ schoolYearId?: string; termId?: string; program?: string }>;
}) {
  const params = await searchParams;
  const schoolYears = await getSchoolYearsList();
  const activeSy = await getActiveSchoolYear();
  const terms = params.schoolYearId
    ? await getTermsBySchoolYearId(params.schoolYearId)
    : activeSy
      ? await getTermsBySchoolYearId(activeSy.id)
      : [];
  const syId = params.schoolYearId ?? activeSy?.id ?? null;
  const termId = params.termId ?? null;
  const filters = { schoolYearId: syId, termId, program: params.program ?? null };

  const [approvals, submissions, requirements, clearanceHolds] = await Promise.all([
    getDeanPendingEnrollmentApprovals(),
    getDeanUnreleasedSubmissions(filters),
    getDeanRequirementVerificationsSubmitted(),
    getDeanClearanceHolds(filters),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Operations Monitor
        </h2>
        <p className="mt-1 text-sm text-neutral-800">
          Bottleneck overview. Read-only; use Registrar/Finance for actions.
        </p>
      </section>

      <DeanOperationsFilters
        schoolYears={schoolYears}
        terms={terms}
        current={{ schoolYearId: syId, termId, program: params.program }}
      />

      <Tabs defaultValue="approvals" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="approvals">
            Enrollment Approvals ({approvals.length})
          </TabsTrigger>
          <TabsTrigger value="grades">
            Grade Submissions ({submissions.length})
          </TabsTrigger>
          <TabsTrigger value="requirements">
            Requirements ({requirements.length})
          </TabsTrigger>
          <TabsTrigger value="clearance">
            Clearance Holds ({clearanceHolds.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Pending Enrollment Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl border bg-white/80 text-sm">
                <table className="min-w-full">
                  <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                    <tr>
                      <th className="px-4 py-2 text-left">Enrollment ID</th>
                      <th className="px-4 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvals.map((a) => (
                      <tr key={a.id} className="border-b last:border-0">
                        <td className="px-4 py-2">{a.enrollmentId}</td>
                        <td className="px-4 py-2 text-right">
                          <Link
                            href="/registrar/approvals"
                            className="text-xs font-medium text-[#6A0000] hover:underline"
                          >
                            Review (Registrar)
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {approvals.length === 0 && (
                      <tr>
                        <td colSpan={2} className="px-4 py-4 text-center text-neutral-600">
                          None
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="grades">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Unreleased Grade Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl border bg-white/80 text-sm">
                <table className="min-w-full">
                  <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                    <tr>
                      <th className="px-4 py-2 text-left">Subject · Section</th>
                      <th className="px-4 py-2 text-left">Period</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-right">Updated</th>
                      <th className="px-4 py-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((s) => (
                      <tr key={s.id} className="border-b last:border-0">
                        <td className="px-4 py-2">
                          {s.subjectCode} — {s.sectionName}
                        </td>
                        <td className="px-4 py-2">{s.gradingPeriodName}</td>
                        <td className="px-4 py-2">{formatStatusForDisplay(s.status)}</td>
                        <td className="px-4 py-2 text-right">
                          {s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-2">
                          <Link
                            href={`/registrar/grades/${s.id}`}
                            className="text-xs font-medium text-[#6A0000] hover:underline"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {submissions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 text-center text-neutral-600">
                          None
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="requirements">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Requirements Verification (submitted)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl border bg-white/80 text-sm">
                <table className="min-w-full">
                  <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                    <tr>
                      <th className="px-4 py-2 text-left">ID</th>
                      <th className="px-4 py-2 text-left">Student ID</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-right">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requirements.map((r) => (
                      <tr key={r.id} className="border-b last:border-0">
                        <td className="px-4 py-2">{r.id.slice(0, 8)}…</td>
                        <td className="px-4 py-2">{r.studentId.slice(0, 8)}…</td>
                        <td className="px-4 py-2">{formatStatusForDisplay(r.status)}</td>
                        <td className="px-4 py-2 text-right">
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))}
                    {requirements.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-4 text-center text-neutral-600">
                          None
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="clearance">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Finance Clearance Holds / Uncleared</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl border bg-white/80 text-sm">
                <table className="min-w-full">
                  <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                    <tr>
                      <th className="px-4 py-2 text-left">Student</th>
                      <th className="px-4 py-2 text-left">Program</th>
                      <th className="px-4 py-2 text-right">Balance</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clearanceHolds.map((r) => (
                      <tr key={r.enrollmentId} className="border-b last:border-0">
                        <td className="px-4 py-2">
                          {r.studentCode} — {r.firstName} {r.lastName}
                        </td>
                        <td className="px-4 py-2">{r.program ?? "—"}</td>
                        <td className="px-4 py-2 text-right">
                          ₱{parseFloat(r.balance ?? "0").toFixed(2)}
                        </td>
                        <td className="px-4 py-2">{r.financeStatus ? formatStatusForDisplay(r.financeStatus) : "—"}</td>
                        <td className="px-4 py-2">
                          <Link
                            href="/finance/clearance"
                            className="text-xs font-medium text-[#6A0000] hover:underline"
                          >
                            Finance Clearance
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {clearanceHolds.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 text-center text-neutral-600">
                          None
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
