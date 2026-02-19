import Link from "next/link";
import { getStudentById } from "@/db/queries";
import {
  getApprovedEnrollmentsByStudent,
  getLedgerEntriesByStudent,
  getPaymentsByEnrollment,
} from "@/lib/finance/queries";
import { getPromissoryNotesByStudentId } from "@/lib/clearance/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatStatusForDisplay } from "@/lib/formatStatus";
import type { PromissoryNoteWithDetails } from "@/lib/clearance/queries";

export const dynamic = "force-dynamic";

function fullName(row: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
}) {
  return [row.firstName, row.middleName, row.lastName].filter(Boolean).join(" ");
}

export const metadata = { title: "Student Balance" };

export default async function StudentBalanceDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;

  const [student, enrollments, promissoryNotesList] = await Promise.all([
    getStudentById(studentId),
    getApprovedEnrollmentsByStudent(studentId),
    getPromissoryNotesByStudentId(studentId),
  ]);
  const pnByEnrollmentId = new Map<string, PromissoryNoteWithDetails>();
  for (const pn of promissoryNotesList) {
    pnByEnrollmentId.set(pn.enrollmentId, pn);
  }

  const enrollmentIdsWithPn = enrollments.filter((e) => pnByEnrollmentId.has(e.id)).map((e) => e.id);
  const paymentsByEnrollmentId = new Map<string, Awaited<ReturnType<typeof getPaymentsByEnrollment>>>();
  if (enrollmentIdsWithPn.length > 0) {
    const paymentLists = await Promise.all(
      enrollmentIdsWithPn.map((id) => getPaymentsByEnrollment(id))
    );
    enrollmentIdsWithPn.forEach((id, i) => paymentsByEnrollmentId.set(id, paymentLists[i]));
  }

  if (!student) {
    return (
      <div>
        <p className="text-red-600">Student not found.</p>
        <Link href="/finance/balances" className="text-[#6A0000] hover:underline">
          ← Back to balances
        </Link>
      </div>
    );
  }

  const ledgerEntries = await getLedgerEntriesByStudent(studentId, 100);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/finance/balances"
          className="text-sm text-[#6A0000] hover:underline"
        >
          ← Back to balances
        </Link>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#6A0000]">
          {fullName(student)}
          {student.studentCode && (
            <span className="ml-2 text-base font-normal text-neutral-700">
              ({student.studentCode})
            </span>
          )}
        </h2>
      </div>

      <section>
        <h3 className="mb-3 text-lg font-semibold text-[#6A0000]">
          Enrollments & Balances
        </h3>
        <div className="space-y-2">
          {enrollments.map((e) => {
            const promissoryNote = pnByEnrollmentId.get(e.id);
            const enrollmentPayments = paymentsByEnrollmentId.get(e.id) ?? [];
            return (
              <Card key={e.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {e.schoolYearName} • {e.termName} – {e.program ?? "—"} {e.yearLevel ?? ""}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p>
                    Balance:{" "}
                    <span className="font-semibold text-[#6A0000]">
                      ₱{parseFloat(e.balance ?? "0").toFixed(2)}
                    </span>{" "}
                    • Status: {e.financeStatus ? formatStatusForDisplay(e.financeStatus) : "—"}
                  </p>
                  {promissoryNote && (
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-3">
                      <p className="mb-2 text-xs font-medium text-[#6A0000]">Promissory note</p>
                      <p className="text-sm">
                        <span className="font-medium text-neutral-600">Total promised:</span>{" "}
                        <span className="font-semibold text-[#6A0000]">
                          ₱
                          {parseFloat(
                            promissoryNote.totalPromisedAmount ??
                              promissoryNote.amountPromised ??
                              "0"
                          ).toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        {promissoryNote.installmentMonths != null &&
                          promissoryNote.installmentMonths > 1 && (
                            <span className="text-neutral-600">
                              {" "}
                              in {promissoryNote.installmentMonths} months
                            </span>
                          )}
                      </p>
                      {promissoryNote.installmentSchedule &&
                      promissoryNote.installmentSchedule.length > 0 ? (
                        <div className="mt-2 overflow-x-auto rounded border border-neutral-200 bg-white">
                          <table className="min-w-full text-sm">
                            <thead className="bg-neutral-50">
                              <tr>
                                <th className="px-3 py-1.5 text-left font-medium text-neutral-700">
                                  Payment
                                </th>
                                <th className="px-3 py-1.5 text-left font-medium text-neutral-700">
                                  Due date
                                </th>
                                <th className="px-3 py-1.5 text-right font-medium text-neutral-700">
                                  Amount
                                </th>
                                <th className="px-3 py-1.5 text-left font-medium text-neutral-700">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {promissoryNote.installmentSchedule.map((row) => {
                                const paidAmount = enrollmentPayments
                                  .filter(
                                    (p) =>
                                      p.installmentSequence != null &&
                                      p.installmentSequence === row.sequence
                                  )
                                  .reduce(
                                    (sum, p) => sum + parseFloat(String(p.amount ?? "0")),
                                    0
                                  );
                                const dueAmount = parseFloat(row.amount);
                                const isPaid = paidAmount >= dueAmount;
                                const isPartiallyPaid =
                                  paidAmount > 0 && paidAmount < dueAmount;
                                return (
                                  <tr
                                    key={row.sequence}
                                    className="border-t border-neutral-100"
                                  >
                                    <td className="px-3 py-1.5">
                                      {row.sequence === 1
                                        ? "1st payment"
                                        : row.sequence === 2
                                          ? "2nd payment"
                                          : row.sequence === 3
                                            ? "3rd payment"
                                            : `${row.sequence}th payment`}
                                    </td>
                                    <td className="px-3 py-1.5">
                                      {new Date(
                                        row.dueDate + "Z"
                                      ).toLocaleDateString("en-PH")}
                                    </td>
                                    <td className="px-3 py-1.5 text-right font-medium text-[#6A0000]">
                                      ₱
                                      {parseFloat(row.amount).toLocaleString(
                                        "en-PH",
                                        {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        }
                                      )}
                                    </td>
                                    <td className="px-3 py-1.5">
                                      {isPaid ? (
                                        <Badge
                                          variant="secondary"
                                          className="bg-green-100 text-green-800"
                                        >
                                          Paid
                                        </Badge>
                                      ) : isPartiallyPaid ? (
                                        <Badge
                                          variant="secondary"
                                          className="bg-amber-100 text-amber-800"
                                        >
                                          Partially paid
                                        </Badge>
                                      ) : (
                                        <span className="text-neutral-500">
                                          —
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        promissoryNote.dueDate && (
                          <p className="mt-1 text-sm text-neutral-600">
                            Due:{" "}
                            {new Date(promissoryNote.dueDate).toLocaleDateString("en-PH")}
                          </p>
                        )
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {enrollments.length === 0 && (
            <p className="text-sm text-neutral-600">No approved enrollments.</p>
          )}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-lg font-semibold text-[#6A0000]">
          Ledger Timeline
        </h3>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                  <tr>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Description</th>
                    <th className="px-4 py-2 text-right">Debit</th>
                    <th className="px-4 py-2 text-right">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerEntries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b last:border-0 hover:bg-neutral-50/80"
                    >
                      <td className="px-4 py-2">
                        {entry.postedAt
                          ? new Date(entry.postedAt).toLocaleString()
                          : "—"}
                      </td>
                      <td className="px-4 py-2 capitalize">{entry.entryType}</td>
                      <td className="px-4 py-2">{entry.description}</td>
                      <td className="px-4 py-2 text-right">
                        {parseFloat(entry.debit ?? "0") > 0
                          ? `₱${parseFloat(entry.debit ?? "0").toFixed(2)}`
                          : "—"}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {parseFloat(entry.credit ?? "0") > 0
                          ? `₱${parseFloat(entry.credit ?? "0").toFixed(2)}`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                  {ledgerEntries.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-neutral-600"
                      >
                        No ledger entries.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
