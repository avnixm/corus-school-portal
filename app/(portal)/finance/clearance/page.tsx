import Link from "next/link";
import { getEnrollmentIdsWithActiveFinanceHold } from "@/db/queries";
import { getEnrollmentsForClearance } from "@/lib/finance/queries";
import {
  listClearanceQueue,
  listEnrollmentsBlockedByFinance,
  getExistingPromissoryNoteByEnrollmentAndPeriod,
  getEnrollmentTermIdsWithClearedFinance,
} from "@/lib/clearance/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkClearedButton } from "./MarkClearedButton";
import { FinanceBlockedRowActions } from "./FinanceBlockedRowActions";

export const dynamic = "force-dynamic";

function fullName(r: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
}) {
  return [r.firstName, r.middleName, r.lastName].filter(Boolean).join(" ");
}

export const metadata = { title: "Clearance" };

export default async function ClearancePage() {
  const [rows, holdEnrollmentIds, queueBlocked, financiallyBlocked, clearedFinanceKeys] =
    await Promise.all([
      getEnrollmentsForClearance(),
      getEnrollmentIdsWithActiveFinanceHold(),
      listClearanceQueue({ officeType: "finance", itemStatus: "blocked" }),
      listEnrollmentsBlockedByFinance(),
      getEnrollmentTermIdsWithClearedFinance(),
    ]);

  const queueEnrollmentKeys = new Set(
    queueBlocked.map((r) => `${r.enrollmentId}:${r.periodId}`)
  );
  const blockedRows = [
    ...queueBlocked,
    ...financiallyBlocked.filter(
      (r) => !queueEnrollmentKeys.has(`${r.enrollmentId}:${r.periodId}`)
    ),
  ].filter((row) => !clearedFinanceKeys.has(`${row.enrollmentId}:${row.termId}`));

  const existingPnByKey = new Map<string, { id: string; status: string }>();
  await Promise.all(
    blockedRows.map(async (row) => {
      const pn = await getExistingPromissoryNoteByEnrollmentAndPeriod(
        row.enrollmentId,
        row.periodId
      );
      if (pn) existingPnByKey.set(`${row.enrollmentId}:${row.periodId}`, pn);
    })
  );
  const approvedPnByKey = new Map<string, { id: string; refNo: string }>();
  existingPnByKey.forEach((pn, key) => {
    if (pn.status === "approved")
      approvedPnByKey.set(key, { id: pn.id, refNo: pn.id.slice(0, 8) });
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Clearance
        </h2>
        <p className="text-sm text-neutral-800">
          Ready-for-clearance enrollments and those blocked due to balance/hold. Create promissory notes or mark cleared when paid.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">
            Blocked (balance / hold) ({blockedRows.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border bg-white/80 text-neutral-900">
            <table className="min-w-full text-left text-sm text-neutral-900">
              <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2">Student</th>
                  <th className="px-4 py-2">School Year / Term</th>
                  <th className="px-4 py-2">Term</th>
                  <th className="px-4 py-2">Program</th>
                  <th className="px-4 py-2">Balance</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blockedRows.map((row) => (
                  <tr
                    key={row.itemId || `${row.enrollmentId}:${row.periodId}`}
                    className="border-b last:border-0 hover:bg-neutral-50/80"
                  >
                    <td className="px-4 py-2">
                      {row.studentCode} – {row.studentName}
                    </td>
                    <td className="px-4 py-2">
                      {row.schoolYearName} • {row.termName}
                    </td>
                    <td className="px-4 py-2">{row.termName}</td>
                    <td className="px-4 py-2">
                      {row.program ?? "—"} {row.yearLevel ?? ""}
                    </td>
                    <td className="px-4 py-2">
                      ₱{parseFloat(row.balance ?? "0").toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <FinanceBlockedRowActions
                        enrollmentId={row.enrollmentId}
                        periodId={row.periodId}
                        itemId={row.itemId || null}
                        hasHold={holdEnrollmentIds.has(row.enrollmentId)}
                        approvedPn={approvedPnByKey.get(`${row.enrollmentId}:${row.periodId}`) ?? null}
                        existingPn={existingPnByKey.get(`${row.enrollmentId}:${row.periodId}`) ?? null}
                      />
                    </td>
                  </tr>
                ))}
                {blockedRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm text-neutral-800"
                    >
                      No enrollments blocked for finance clearance.
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
          <CardTitle className="text-sm font-semibold text-neutral-900">
            Ready for Clearance ({rows.length})
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
                  <th className="px-4 py-2">Balance</th>
                  <th className="px-4 py-2">Hold</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b last:border-0 hover:bg-neutral-50/80"
                  >
                    <td className="px-4 py-2">
                      {row.studentCode} – {fullName(row)}
                    </td>
                    <td className="px-4 py-2">
                      {row.schoolYearName} • {row.termName}
                    </td>
                    <td className="px-4 py-2">
                      {row.program ?? "—"} {row.yearLevel ?? ""}
                    </td>
                    <td className="px-4 py-2">
                      ₱{parseFloat(row.balance ?? "0").toFixed(2)}
                    </td>
                    <td className="px-4 py-2">
                      {holdEnrollmentIds.has(row.id) ? (
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium uppercase text-amber-800">
                          Active hold
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <MarkClearedButton
                        enrollmentId={row.id}
                        disabled={holdEnrollmentIds.has(row.id)}
                      />
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm text-neutral-800"
                    >
                      No enrollments ready for clearance.
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
