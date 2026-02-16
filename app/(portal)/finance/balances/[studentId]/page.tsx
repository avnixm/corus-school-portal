import Link from "next/link";
import { getStudentById } from "@/db/queries";
import {
  getApprovedEnrollmentsByStudent,
  getLedgerEntriesByStudent,
} from "@/lib/finance/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  const [student, enrollments] = await Promise.all([
    getStudentById(studentId),
    getApprovedEnrollmentsByStudent(studentId),
  ]);

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
          {enrollments.map((e) => (
            <Card key={e.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {e.schoolYearName} • {e.termName} – {e.program ?? "—"} {e.yearLevel ?? ""}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>
                  Balance:{" "}
                  <span className="font-semibold text-[#6A0000]">
                    ₱{parseFloat(e.balance ?? "0").toFixed(2)}
                  </span>{" "}
                  • Status: {e.financeStatus ?? "—"}
                </p>
              </CardContent>
            </Card>
          ))}
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
