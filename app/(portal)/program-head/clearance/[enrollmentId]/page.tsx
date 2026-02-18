import Link from "next/link";
import { getEnrollmentById, getStudentById } from "@/db/queries";
import { getLedgerEntriesByEnrollment, getStudentBalance } from "@/lib/finance/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatStatusForDisplay } from "@/lib/formatStatus";

export const dynamic = "force-dynamic";

export const metadata = { title: "Clearance" };

export default async function ProgramHeadClearanceEnrollmentPage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const { enrollmentId } = await params;
  const enrollment = await getEnrollmentById(enrollmentId);

  if (!enrollment) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Enrollment not found
        </h2>
        <Link href="/program-head/clearance" className="text-[#6A0000] underline">
          ← Back to Clearance
        </Link>
      </div>
    );
  }

  const [student, balance, ledgerEntries] = await Promise.all([
    getStudentById(enrollment.studentId),
    getStudentBalance(enrollmentId),
    getLedgerEntriesByEnrollment(enrollmentId),
  ]);

  const studentName = student
    ? [student.firstName, student.middleName, student.lastName].filter(Boolean).join(" ")
    : "—";

  return (
    <div className="space-y-8">
      <section>
        <Link
          href="/program-head/clearance"
          className="text-sm font-medium text-[#6A0000] hover:underline"
        >
          ← Back to Clearance
        </Link>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#6A0000]">
          Ledger summary
        </h2>
        <p className="mt-1 text-sm text-neutral-800">
          {student?.studentCode ?? "—"} – {studentName} · Read-only
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">
            Enrollment & balance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-neutral-600">Program / Year:</span>{" "}
            {enrollment.program ?? "—"} {enrollment.yearLevel ?? ""}
          </p>
          <p>
            <span className="text-neutral-600">Status (finance):</span>{" "}
            {balance?.status ? formatStatusForDisplay(balance.status) : "—"}
          </p>
          <p>
            <span className="text-neutral-600">Balance:</span>{" "}
            ₱{parseFloat(balance?.balance ?? "0").toFixed(2)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">
            Ledger entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border bg-white/80 text-sm">
            <table className="min-w-full">
              <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Description</th>
                  <th className="px-4 py-2 text-right">Debit</th>
                  <th className="px-4 py-2 text-right">Credit</th>
                </tr>
              </thead>
              <tbody>
                {ledgerEntries.map((entry) => (
                  <tr key={entry.id} className="border-b last:border-0">
                    <td className="px-4 py-2 text-neutral-600">
                      {entry.postedAt ? new Date(entry.postedAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-2">{entry.entryType}</td>
                    <td className="px-4 py-2">{entry.description}</td>
                    <td className="px-4 py-2 text-right">
                      {parseFloat(entry.debit ?? "0") > 0 ? `₱${parseFloat(entry.debit ?? "0").toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {parseFloat(entry.credit ?? "0") > 0 ? `₱${parseFloat(entry.credit ?? "0").toFixed(2)}` : "—"}
                    </td>
                  </tr>
                ))}
                {ledgerEntries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-neutral-600">
                      No ledger entries.
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
