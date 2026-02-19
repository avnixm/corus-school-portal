"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatStatusForDisplay } from "@/lib/formatStatus";
import { FeeApprovalRow } from "@/app/(portal)/program-head/fees/FeeApprovalRow";

function fullName(r: { firstName: string; middleName?: string | null; lastName: string }) {
  return [r.firstName, r.middleName, r.lastName].filter(Boolean).join(" ");
}

type ClearanceRow = {
  enrollmentId: string;
  studentCode: string | null;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  schoolYearName: string;
  termName: string;
  program: string | null;
  yearLevel: string | null;
  balance: string | null;
  financeStatus: string | null;
  updatedAt: Date | null;
};

type FeeSetup = {
  id: string;
  programCode: string | null;
  programName: string | null;
  yearLevel: string | null;
  schoolYearName: string | null;
  termName: string | null;
  tuitionPerUnit: string | null;
};

export function FinancePageContent({
  view,
  clearanceRows,
  feeSetups,
}: {
  view: "clearance" | "fees";
  clearanceRows: ClearanceRow[];
  feeSetups: FeeSetup[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setView(newView: "clearance" | "fees") {
    const next = new URLSearchParams(searchParams);
    next.set("view", newView);
    router.push(`/program-head/finance?${next.toString()}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-neutral-200">
        <button
          type="button"
          onClick={() => setView("clearance")}
          className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
            view === "clearance"
              ? "border-[#6A0000] text-[#6A0000]"
              : "border-transparent text-neutral-600 hover:text-neutral-900"
          }`}
        >
          Clearance
        </button>
        <button
          type="button"
          onClick={() => setView("fees")}
          className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
            view === "fees"
              ? "border-[#6A0000] text-[#6A0000]"
              : "border-transparent text-neutral-600 hover:text-neutral-900"
          }`}
        >
          Fee Approvals
        </button>
      </div>

      {view === "clearance" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-neutral-900">
              Enrollments by clearance status ({clearanceRows.length})
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
                  {clearanceRows.map((r) => (
                    <tr key={r.enrollmentId} className="border-b last:border-0">
                      <td className="px-4 py-2">
                        {r.studentCode ?? "—"} – {fullName(r)}
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
                          className={`rounded px-2 py-0.5 text-xs uppercase ${
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
                  {clearanceRows.length === 0 && (
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
      )}

      {view === "fees" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#6A0000]">
              Pending your approval ({feeSetups.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {feeSetups.length === 0 ? (
              <p className="py-8 text-center text-sm text-neutral-600">
                No fee setups pending your approval.
              </p>
            ) : (
              <div className="space-y-4">
                {feeSetups.map((s) => (
                  <FeeApprovalRow
                    key={s.id}
                    feeSetupId={s.id}
                    programCode={s.programCode ?? ""}
                    programName={s.programName ?? ""}
                    yearLevel={s.yearLevel}
                    schoolYearName={s.schoolYearName}
                    termName={s.termName}
                    tuitionPerUnit={s.tuitionPerUnit ?? "0"}
                    variant="program_head"
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
