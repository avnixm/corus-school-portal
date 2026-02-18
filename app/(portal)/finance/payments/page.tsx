import { getRecentPayments } from "@/lib/finance/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Printer } from "lucide-react";
import { PostPaymentForm } from "./PostPaymentForm";
import { VoidPaymentButton } from "./VoidPaymentButton";

export const dynamic = "force-dynamic";

export const metadata = { title: "Payments" };

function fullName(r: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
}) {
  return [r.firstName, r.middleName, r.lastName].filter(Boolean).join(" ");
}

export default async function PaymentsPage() {
  const recentPayments = await getRecentPayments(20);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Payments
        </h2>
        <p className="text-sm text-neutral-800">
          Search student, select enrollment, and post payment.
        </p>
      </div>

      <PostPaymentForm />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-[#6A0000]">
            Recent Payments
          </CardTitle>
          <p className="text-xs text-neutral-600">
            Last 20 posted payments. Void reverses the payment and restores balance.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-neutral-50 text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Student</th>
                  <th className="px-4 py-2 font-medium">Term</th>
                  <th className="px-4 py-2 font-medium">Method</th>
                  <th className="px-4 py-2 font-medium text-right">Amount</th>
                  <th className="px-4 py-2 font-medium">Reference</th>
                  <th className="px-4 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-neutral-600">
                      No payments yet.
                    </td>
                  </tr>
                ) : (
                  recentPayments.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="px-4 py-2">
                        {p.receivedAt
                          ? new Date(p.receivedAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-2">
                        {p.studentCode ?? ""} – {fullName(p)}
                      </td>
                      <td className="px-4 py-2">
                        {p.schoolYearName ?? "—"} / {p.termName ?? "—"}
                      </td>
                      <td className="px-4 py-2 capitalize">{p.method}</td>
                      <td className="px-4 py-2 text-right font-medium">
                        ₱{Number(p.amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-neutral-600">
                        {p.referenceNo ?? "—"}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/finance/payments/${p.id}/receipt`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm font-medium text-[#6A0000] hover:underline"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            Print
                          </Link>
                          <VoidPaymentButton
                            paymentId={p.id}
                            amount={p.amount ?? "0"}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
