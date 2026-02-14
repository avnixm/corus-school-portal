import {
  getDeanTotalAssessed,
  getDeanTotalCollected,
  getDeanOutstandingBalances,
  getDeanClearanceRate,
  getDeanFinanceByProgram,
} from "@/lib/dean/queries";
import { getSchoolYearsList, getTermsBySchoolYearId, getActiveSchoolYear } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeanFinanceFilters } from "./DeanFinanceFilters";

export const dynamic = "force-dynamic";

export default async function DeanFinancePage({
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
  const filters = {
    schoolYearId: syId,
    termId,
    program: params.program ?? null,
  };

  const [assessed, collected, outstanding, clearanceRate, byProgram] = await Promise.all([
    getDeanTotalAssessed(filters),
    getDeanTotalCollected(filters),
    getDeanOutstandingBalances(filters),
    getDeanClearanceRate(filters),
    getDeanFinanceByProgram(filters),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Finance Overview
        </h2>
        <p className="mt-1 text-sm text-neutral-800">
          Assessed, collected, outstanding balances, and clearance rate.
        </p>
      </section>

      <DeanFinanceFilters
        schoolYears={schoolYears}
        terms={terms}
        current={{ schoolYearId: syId, termId, program: params.program }}
      />

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-neutral-800">
              Total Assessed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#6A0000]">
              ₱{parseFloat(assessed).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-neutral-800">
              Total Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              ₱{parseFloat(collected).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-neutral-800">
              Outstanding Balances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">
              ₱{parseFloat(outstanding).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-neutral-800">
              Clearance Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#6A0000]">
              {clearanceRate.rate.toFixed(1)}%
            </div>
            <p className="mt-1 text-xs text-neutral-600">
              {clearanceRate.cleared} / {clearanceRate.total} cleared
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">
            By Program
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border bg-white/80 text-sm">
            <table className="min-w-full">
              <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2 text-left">Program</th>
                  <th className="px-4 py-2 text-right">Total Balance</th>
                  <th className="px-4 py-2 text-right">Cleared</th>
                  <th className="px-4 py-2 text-right">Total Enrollments</th>
                </tr>
              </thead>
              <tbody>
                {byProgram.map((r) => (
                  <tr key={r.program ?? "n"} className="border-b last:border-0">
                    <td className="px-4 py-2">{r.program ?? "—"}</td>
                    <td className="px-4 py-2 text-right">
                      ₱{parseFloat(r.totalBalance ?? "0").toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-2 text-right">{r.clearedCount}</td>
                    <td className="px-4 py-2 text-right">{r.totalCount}</td>
                  </tr>
                ))}
                {byProgram.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-center text-neutral-600">
                      No data
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
