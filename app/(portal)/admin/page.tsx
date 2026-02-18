import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getUsersList,
  getAuditLogCountLast24h,
  getRecentRoleChanges,
  getSystemSetting,
  getSchoolYearsList,
  getTermsList,
  getGradingPeriodsBySchoolYearTerm,
} from "@/db/queries";
import { roleLabel } from "@/lib/roles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const [users, last24h, roleChanges, syIdSetting, termIdSetting, schoolYears, termsList] =
    await Promise.all([
      getUsersList(),
      getAuditLogCountLast24h(),
      getRecentRoleChanges(10),
      getSystemSetting("active_school_year_id"),
      getSystemSetting("active_term_id"),
      getSchoolYearsList(),
      getTermsList(),
    ]);

  const syId =
    syIdSetting?.value != null
      ? (typeof syIdSetting.value === "string"
          ? syIdSetting.value
          : String((syIdSetting.value as Record<string, unknown>)?.value ?? ""))
      : null;
  const termId =
    termIdSetting?.value != null
      ? (typeof termIdSetting.value === "string"
          ? termIdSetting.value
          : String((termIdSetting.value as Record<string, unknown>)?.value ?? ""))
      : null;
  const syIdStr = syId && syId !== "undefined" ? syId : null;
  const termIdStr = termId && termId !== "undefined" ? termId : null;

  const activeSyName =
    syIdStr && schoolYears.length
      ? schoolYears.find((s) => s.id === syIdStr)?.name ?? (syIdStr ? "Unknown" : null)
      : null;
  const activeTermName =
    termIdStr && termsList.length
      ? termsList.find((t) => t.id === termIdStr)?.name ?? (termIdStr ? "Unknown" : null)
      : null;

  let gradingPeriodsCount = 0;
  if (syIdStr && termIdStr) {
    const periods = await getGradingPeriodsBySchoolYearTerm(syIdStr, termIdStr);
    gradingPeriodsCount = periods.length;
  }

  const byRole = users.reduce<Record<string, number>>(
    (acc, u) => {
      acc[u.role] = (acc[u.role] ?? 0) + 1;
      return acc;
    },
    {}
  );

  const warnings: string[] = [];
  if (!syIdStr || !activeSyName) warnings.push("No active school year set in Settings.");
  if (syIdStr && termIdStr && gradingPeriodsCount === 0)
    warnings.push("No grading periods defined for the active term.");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Admin Dashboard
        </h2>
        <p className="text-sm text-neutral-700">
          System overview and recent activity.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-[#6A0000]">{users.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">
              Last 24h Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-[#6A0000]">{last24h}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">
              Active School Year
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-neutral-900">
              {activeSyName ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">
              Active Term
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-neutral-900">
              {activeTermName ?? "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Users by Role</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="overflow-x-auto rounded-lg border bg-white text-sm text-neutral-900">
              <table className="min-w-full">
                <thead className="bg-neutral-50 text-xs font-medium text-[#6A0000]">
                  <tr>
                    <th className="px-4 py-2 text-left">Role</th>
                    <th className="px-4 py-2 text-right">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(byRole)
                    .sort((a, b) => b[1] - a[1])
                    .map(([role, count]) => (
                      <tr key={role} className="border-t">
                        <td className="px-4 py-2 text-neutral-900">{roleLabel(role)}</td>
                        <td className="px-4 py-2 text-right text-neutral-900">{count}</td>
                      </tr>
                    ))}
                  {Object.keys(byRole).length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-4 py-4 text-center text-neutral-600">
                        No users
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Role Changes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {roleChanges.map((r) => {
                const displayName =
                  (r as { entityName?: string | null; entityEmail?: string | null }).entityName ??
                  (r as { entityName?: string | null; entityEmail?: string | null }).entityEmail ??
                  (r.entityId ? `User ${String(r.entityId).slice(0, 8)}…` : "Unknown user");
                const afterRole =
                  r.after && typeof r.after === "object" && "role" in r.after
                    ? roleLabel(String((r.after as { role?: string }).role ?? ""))
                    : "—";
                const beforeRole =
                  r.before && typeof r.before === "object" && "role" in r.before
                    ? roleLabel(String((r.before as { role?: string }).role ?? ""))
                    : null;
                const roleText = beforeRole ? `${beforeRole} → ${afterRole}` : `Role: ${afterRole}`;
                return (
                  <li key={r.id} className="flex items-center justify-between text-sm text-neutral-900">
                    <span className="text-neutral-800">
                      <span className="font-medium">{displayName}</span>
                      {" · "}
                      {roleText}
                    </span>
                    <Link
                      href={`/admin/audit?entityId=${r.entityId ?? ""}&action=ROLE_CHANGE`}
                      className="text-[#6A0000] hover:underline"
                    >
                      View
                    </Link>
                  </li>
                );
              })}
              {roleChanges.length === 0 && (
                <li className="text-sm text-neutral-600">No recent role changes</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      {warnings.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="text-base text-amber-800">System Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1 text-sm text-amber-800">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
            <Link
              href="/admin/settings"
              className="mt-3 inline-block text-sm font-medium text-[#6A0000] hover:underline"
            >
              Open Settings →
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
