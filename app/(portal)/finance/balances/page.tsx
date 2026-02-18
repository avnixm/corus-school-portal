import Link from "next/link";
import { getStudentsWithBalances } from "@/lib/finance/queries";
import { getSchoolYearsList, getTermsList } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BalanceFilters } from "./BalanceFilters";
import { formatStatusForDisplay } from "@/lib/formatStatus";

export const dynamic = "force-dynamic";

export const metadata = { title: "Balances" };

function fullName(row: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
}) {
  return [row.firstName, row.middleName, row.lastName].filter(Boolean).join(" ");
}

export default async function BalancesPage({
  searchParams,
}: {
  searchParams: Promise<{ schoolYearId?: string; termId?: string }>;
}) {
  const params = await searchParams;
  const [rows, schoolYears, terms] = await Promise.all([
    getStudentsWithBalances({
      schoolYearId: params.schoolYearId || undefined,
      termId: params.termId || undefined,
    }),
    getSchoolYearsList(),
    getTermsList(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Student Balances
        </h2>
        <p className="text-sm text-neutral-800">
          View students with outstanding balances.
        </p>
      </div>

      <BalanceFilters schoolYears={schoolYears} terms={terms} />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">
            Students with balance ({rows.length})
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
                  <th className="px-4 py-2">Balance</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={`${row.id}-${row.enrollmentId}`}
                    className="border-b last:border-0 hover:bg-neutral-50/80"
                  >
                    <td className="px-4 py-2">
                      <Link
                        href={`/finance/balances/${row.id}`}
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
                    <td className="px-4 py-2">{row.program ?? "—"}</td>
                    <td className="px-4 py-2">{row.yearLevel ?? "—"}</td>
                    <td className="px-4 py-2 font-medium">
                      ₱{parseFloat(row.balance ?? "0").toFixed(2)}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs uppercase ${
                          row.financeStatus === "paid"
                            ? "bg-green-100 text-green-800"
                            : row.financeStatus === "partially_paid"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-neutral-200 text-neutral-800"
                        }`}
                      >
                        {row.financeStatus ? formatStatusForDisplay(row.financeStatus) : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        href={`/finance/balances/${row.id}`}
                        className="text-xs font-medium text-[#6A0000] hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-sm text-neutral-800"
                    >
                      No students with balance found.
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
