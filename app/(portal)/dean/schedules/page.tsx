import { listPendingScheduleApprovalsForDean, getSchoolYearsList, getTermsList } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScheduleApprovalTable } from "@/components/dean/schedules/ScheduleApprovalTable";
import { ScheduleFilters } from "@/components/dean/schedules/ScheduleFilters";
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
          <ScheduleFilters schoolYears={schoolYears} terms={terms} />
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
