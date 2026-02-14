import { listPendingScheduleApprovalsForDean, getSchoolYearsList, getTermsList } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScheduleApprovalTable } from "@/components/dean/schedules/ScheduleApprovalTable";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function DeanScheduleApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{
    schoolYearId?: string;
    termId?: string;
  }>;
}) {
  const params = await searchParams;
  const [approvals, schoolYears, terms] = await Promise.all([
    listPendingScheduleApprovalsForDean(params.schoolYearId, params.termId),
    getSchoolYearsList(),
    getTermsList(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Schedule Approvals
        </h2>
        <p className="text-sm text-neutral-800">
          Review and approve schedule submissions from the Registrar.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-neutral-700">School Year</label>
              <select
                value={params.schoolYearId || ""}
                onChange={(e) => {
                  const url = new URL(window.location.href);
                  if (e.target.value) {
                    url.searchParams.set("schoolYearId", e.target.value);
                  } else {
                    url.searchParams.delete("schoolYearId");
                  }
                  window.location.href = url.toString();
                }}
                className="mt-1 flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">All</option>
                {schoolYears.map((sy) => (
                  <option key={sy.id} value={sy.id}>{sy.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-neutral-700">Term</label>
              <select
                value={params.termId || ""}
                onChange={(e) => {
                  const url = new URL(window.location.href);
                  if (e.target.value) {
                    url.searchParams.set("termId", e.target.value);
                  } else {
                    url.searchParams.delete("termId");
                  }
                  window.location.href = url.toString();
                }}
                className="mt-1 flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">All</option>
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-neutral-900">
              Pending Approvals ({approvals.length})
            </CardTitle>
            {approvals.some(a => a.hasTeacherOverride) && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                Some schedules require override approval
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ScheduleApprovalTable approvals={approvals} />
        </CardContent>
      </Card>
    </div>
  );
}
