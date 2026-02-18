import Link from "next/link";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { getProgramHeadScopePrograms } from "@/lib/programHead/scope";
import { getClearanceOverview } from "@/lib/programHead/queries";
import { getSchoolYearsList, getTermsBySchoolYearId, getActiveSchoolYear } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClearanceFilters } from "./ClearanceFilters";
import { formatStatusForDisplay } from "@/lib/formatStatus";

export const dynamic = "force-dynamic";

export const metadata = { title: "Clearance" };

function fullName(r: { firstName: string; middleName?: string | null; lastName: string }) {
  return [r.firstName, r.middleName, r.lastName].filter(Boolean).join(" ");
}

export default async function ProgramHeadClearancePage({
  searchParams,
}: {
  searchParams: Promise<{
    schoolYearId?: string;
    termId?: string;
    yearLevel?: string;
    status?: string;
  }>;
}) {
  const user = await getCurrentUserWithRole();
  if (!user) return null;
  const scope = await getProgramHeadScopePrograms(user.userId);
  const params = await searchParams;
  const schoolYears = await getSchoolYearsList();
  const activeSy = await getActiveSchoolYear();
  const terms = params.schoolYearId
    ? await getTermsBySchoolYearId(params.schoolYearId)
    : activeSy
    ? await getTermsBySchoolYearId(activeSy.id)
    : [];
  const syId = params.schoolYearId ?? activeSy?.id;
  const termId = params.termId;

  if (scope === null || scope.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Finance Clearance
        </h2>
        <p className="text-neutral-800">
          Set your program scope in{" "}
          <Link href="/program-head/settings" className="font-medium text-[#6A0000] underline">
            Settings
          </Link>{" "}
          first.
        </p>
      </div>
    );
  }

  const rows = await getClearanceOverview(scope, {
    schoolYearId: syId ?? undefined,
    termId: termId ?? undefined,
    yearLevel: params.yearLevel,
    status: params.status,
  });

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Finance Clearance
        </h2>
        <p className="mt-1 text-sm text-neutral-800">
          Read-only overview. Clearance actions are done in Finance.
        </p>
      </section>

      <ClearanceFilters
        schoolYears={schoolYears}
        terms={terms}
        current={{ schoolYearId: syId, termId, yearLevel: params.yearLevel, status: params.status }}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">
            Enrollments by clearance status ({rows.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border bg-white/80 text-sm">
            <table className="min-w-full">
              <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2 text-left">Student</th>
                  <th className="px-4 py-2 text-left">SY / Term</th>
                  <th className="px-4 py-2 text-left">Program</th>
                  <th className="px-4 py-2 text-left">Balance</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-right">Updated</th>
                  <th className="px-4 py-2 text-left">Ledger</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.enrollmentId} className="border-b last:border-0">
                    <td className="px-4 py-2">
                      {r.studentCode} – {fullName(r)}
                    </td>
                    <td className="px-4 py-2">
                      {r.schoolYearName} • {r.termName}
                    </td>
                    <td className="px-4 py-2">
                      {r.program ?? "—"} {r.yearLevel ?? ""}
                    </td>
                    <td className="px-4 py-2">
                      ₱{parseFloat(r.balance ?? "0").toFixed(2)}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          r.financeStatus === "cleared"
                            ? "bg-green-100 text-green-800"
                            : r.financeStatus === "hold"
                            ? "bg-red-100 text-red-800"
                            : "bg-neutral-200 text-neutral-800"
                        }`}
                      >
                        {r.financeStatus ? formatStatusForDisplay(r.financeStatus) : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-neutral-600">
                      {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/program-head/clearance/${r.enrollmentId}`}
                        className="text-xs font-medium text-[#6A0000] hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-neutral-600">
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
