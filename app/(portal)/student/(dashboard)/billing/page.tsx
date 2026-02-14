import { getCurrentStudent } from "@/lib/auth/getCurrentStudent";
import { getEnrollmentForStudentActiveTerm } from "@/db/queries";
import { hasActiveFinanceHoldForEnrollment } from "@/db/queries";
import {
  getStudentBalance,
  getAssessmentsByEnrollment,
  getPaymentsByEnrollment,
} from "@/lib/finance/queries";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StudentBillingPage() {
  const current = await getCurrentStudent();
  if (!current) redirect("/student");

  const enrollment = await getEnrollmentForStudentActiveTerm(current.studentId);

  if (!enrollment) {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">Billing</h2>
          <p className="text-sm text-neutral-700">
            You don&apos;t have an enrollment for the current term. Complete enrollment and approval to see billing.
          </p>
        </div>
      </div>
    );
  }

  const [efs, assessments, payments, hasHold] = await Promise.all([
    getStudentBalance(enrollment.id),
    getAssessmentsByEnrollment(enrollment.id),
    getPaymentsByEnrollment(enrollment.id),
    hasActiveFinanceHoldForEnrollment(enrollment.id),
  ]);

  const postedAssessment = assessments.find((a) => a.status === "posted");
  const totalAssessed = postedAssessment ? Number(postedAssessment.total) : 0;
  const balance = efs ? Number(efs.balance) : 0;
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const status = efs?.status ?? "unassessed";

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">Billing</h2>
        <p className="text-sm text-neutral-700">
          Tuition and fees for {enrollment.schoolYearName} · {enrollment.termName}. Read-only; payments are posted by Finance.
        </p>
      </div>

      {hasHold && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
          <p className="font-semibold">Account hold</p>
          <p className="mt-1 text-sm">
            There is an active hold on your account. Please contact the Finance office for instructions.
          </p>
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#6A0000]">Finance status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Badge
            variant="outline"
            className={
              status === "cleared"
                ? "bg-green-100 text-green-800"
                : status === "hold"
                  ? "bg-amber-100 text-amber-800"
                  : ""
            }
          >
            {status.replace(/_/g, " ")}
          </Badge>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#6A0000]">Total assessed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-[#6A0000]">
              ₱{postedAssessment ? totalAssessed.toLocaleString() : "—"}
            </p>
            {postedAssessment && (
              <Link
                href={`/student/billing/${postedAssessment.id}/form`}
                className="mt-2 inline-block text-sm font-medium text-[#6A0000] hover:underline"
              >
                View assessment form →
              </Link>
            )}
            {!postedAssessment && (
              <p className="mt-1 text-xs text-neutral-600">Awaiting assessment from Finance</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#6A0000]">Total paid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-[#6A0000]">
              ₱{totalPaid.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#6A0000]">Balance due</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-[#6A0000]">
              ₱{balance.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-[#6A0000]">Payment history</CardTitle>
          <p className="text-xs text-neutral-600">Posted payments only. You cannot post payments here.</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-neutral-50 text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Method</th>
                  <th className="px-4 py-2 font-medium text-right">Amount</th>
                  <th className="px-4 py-2 font-medium">Reference</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-neutral-600">
                      No payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="px-4 py-2">
                        {p.receivedAt ? new Date(p.receivedAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-2 capitalize">{p.method}</td>
                      <td className="px-4 py-2 text-right font-medium">
                        ₱{Number(p.amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-neutral-600">{p.referenceNo ?? "—"}</td>
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
