import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getSystemSetting,
  getSchoolYearsList,
  getTermsList,
  getGradingPeriodsBySchoolYearTerm,
} from "@/db/queries";
import { db } from "@/lib/db";
import { enrollments, classSchedules, scheduleDays } from "@/db/schema";
import { eq, sql, isNull } from "drizzle-orm";

export const dynamic = "force-dynamic";

function getSettingValueStr(row: { value: unknown } | null): string | null {
  if (!row?.value) return null;
  if (typeof row.value === "string") return row.value;
  const v = (row.value as Record<string, unknown>)?.value;
  return v != null ? String(v) : null;
}

export default async function AdminHealthPage() {
  const [sySetting, termSetting, schoolYears, termsList] = await Promise.all([
    getSystemSetting("active_school_year_id"),
    getSystemSetting("active_term_id"),
    getSchoolYearsList(),
    getTermsList(),
  ]);

  const syId = getSettingValueStr(sySetting);
  const termId = getSettingValueStr(termSetting);

  const activeSyExists = !!syId && schoolYears.some((s) => s.id === syId);
  const activeTermExists = !!termId && termsList.some((t) => t.id === termId);

  let gradingPeriodsExist = false;
  if (syId && termId) {
    const periods = await getGradingPeriodsBySchoolYearTerm(syId, termId);
    gradingPeriodsExist = periods.length > 0;
  }

  const [enrollmentsPendingApproval] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(enrollments)
    .where(eq(enrollments.status, "pending_approval"));

  const schedulesMissingDays = await db
    .select({ id: classSchedules.id })
    .from(classSchedules)
    .leftJoin(scheduleDays, eq(scheduleDays.scheduleId, classSchedules.id))
    .where(isNull(scheduleDays.id));

  const statusOk = (ok: boolean) => (ok ? "OK" : "Warning");
  const statusClass = (ok: boolean) =>
    ok ? "text-green-700" : "text-amber-700";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          System Health
        </h2>
        <p className="text-sm text-neutral-600">
          Read-only diagnostics.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">
              Active school year set
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-lg font-semibold ${statusClass(activeSyExists)}`}>
              {statusOk(activeSyExists)}
            </p>
            <p className="mt-1 text-xs text-neutral-700">
              {syId ? (activeSyExists ? "ID exists in school_years" : "ID not found in school_years") : "Not set in Settings"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">
              Active term set
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-lg font-semibold ${statusClass(activeTermExists)}`}>
              {statusOk(activeTermExists)}
            </p>
            <p className="mt-1 text-xs text-neutral-700">
              {termId ? (activeTermExists ? "ID exists in terms" : "ID not found in terms") : "Not set in Settings"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">
              Grading periods (active term)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-lg font-semibold ${statusClass(gradingPeriodsExist)}`}>
              {statusOk(gradingPeriodsExist)}
            </p>
            <p className="mt-1 text-xs text-neutral-700">
              {syId && termId
                ? gradingPeriodsExist
                  ? "At least one period exists"
                  : "None defined"
                : "Set active SY and term first"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">
              Enrollments pending approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-neutral-900">
              {enrollmentsPendingApproval?.count ?? 0}
            </p>
            <p className="mt-1 text-xs text-neutral-700">
              Count of enrollments with status pending_approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">
              Schedules missing days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-semibold ${statusClass(schedulesMissingDays.length === 0)}`}>
              {schedulesMissingDays.length}
            </p>
            <p className="mt-1 text-xs text-neutral-700">
              Schedules with no schedule_days rows
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
