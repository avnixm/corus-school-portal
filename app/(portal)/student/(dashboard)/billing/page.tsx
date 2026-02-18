import { getCurrentStudent } from "@/lib/auth/getCurrentStudent";
import { getEnrollmentForStudentActiveTerm, getAssessmentFormData } from "@/db/queries";
import { hasActiveFinanceHoldForEnrollment } from "@/db/queries";
import {
  getStudentBalance,
  getAssessmentsByEnrollment,
  getPaymentsByEnrollment,
  getPaymentWithDetails,
} from "@/lib/finance/queries";
import { getEnrolledStudentMissingRequiredFormNames } from "@/lib/requirements/progress";
import Link from "next/link";
import { Printer, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { DownloadReceiptPDFButton } from "@/components/pdf/DownloadReceiptPDFButton";
import { DownloadAssessmentFormPDFButton } from "@/components/pdf/DownloadAssessmentFormPDFButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = { title: "Billing" };

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

  const isApproved =
    enrollment.status === "approved" || enrollment.status === "enrolled";
  let missingFormNames: string[] = [];
  if (isApproved) {
    missingFormNames = await getEnrolledStudentMissingRequiredFormNames(enrollment.id);
  }

  const [efs, assessments, payments, hasHold] = await Promise.all([
    getStudentBalance(enrollment.id),
    getAssessmentsByEnrollment(enrollment.id),
    getPaymentsByEnrollment(enrollment.id),
    hasActiveFinanceHoldForEnrollment(enrollment.id),
  ]);

  const postedAssessment = assessments.find((a) => a.status === "posted");
  const [receiptDetails, assessmentFormData] = await Promise.all([
    Promise.all(payments.map((p) => getPaymentWithDetails(p.id))),
    postedAssessment
      ? getAssessmentFormData(postedAssessment.id)
      : Promise.resolve(null),
  ]);
  const totalAssessed = postedAssessment ? Number(postedAssessment.total) : 0;
  const balance = efs ? Number(efs.balance) : 0;
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const status = efs?.status ?? "unassessed";

  const statusLabel =
    status === "partially_paid"
      ? "Partially paid"
      : status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">Billing</h2>
        <p className="text-sm text-neutral-700">
          Tuition and fees for {enrollment.schoolYearName} · {enrollment.termName}. Read-only; payments are posted by Finance.
        </p>
      </div>

      {missingFormNames.length > 0 && (
        <div className="rounded-lg border border-blue-300 bg-blue-50 p-4 text-blue-900">
          <p className="font-semibold">Complete required documents</p>
          <p className="mt-1 text-sm">
            You need to submit these forms before accessing full billing: {missingFormNames.join(", ")}.{" "}
            <Link href="/student/requirements?required=1" className="font-medium underline">
              Upload documents →
            </Link>
          </p>
        </div>
      )}

      {hasHold && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
          <p className="font-semibold">Account hold</p>
          <p className="mt-1 text-sm">
            There is an active hold on your account. Please contact the Finance office for instructions.
          </p>
        </div>
      )}

      <Card className="relative">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-sm font-semibold text-[#6A0000]">Finance status</CardTitle>
            {status === "paid" && (
              <div className="flex items-center gap-2 text-blue-700">
                <CheckCircle className="h-5 w-5 shrink-0" />
                <span className="text-sm font-medium">Paid</span>
              </div>
            )}
            {status === "cleared" && (
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5 shrink-0" />
                <span className="text-sm font-medium">Cleared</span>
              </div>
            )}
            {status === "partially_paid" && (
              <div className="flex items-center gap-2 text-amber-700">
                <Clock className="h-5 w-5 shrink-0" />
                <span className="text-sm font-medium">Partially paid</span>
              </div>
            )}
            {status === "hold" && (
              <div className="flex items-center gap-2 text-amber-700">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span className="text-sm font-medium">On hold</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <Badge
            variant="outline"
            className={
              status === "cleared"
                ? "bg-green-100 text-green-800"
                : status === "paid"
                  ? "bg-blue-100 text-blue-800"
                  : status === "partially_paid"
                    ? "bg-amber-100 text-amber-800"
                    : status === "hold"
                      ? "bg-amber-100 text-amber-800"
                      : ""
            }
          >
            {statusLabel}
          </Badge>
          <div className="mt-2 text-sm text-neutral-700">
            {status === "unassessed" && (
              <p>Finance is preparing your assessment (usually 1–3 business days).</p>
            )}
            {status === "assessed" && balance > 0 && (
              <p>
                <span className="font-semibold text-[#6A0000]">Balance due: ₱{balance.toLocaleString()}</span>
                <br />
                Pay via cashier or authorized payment centers.
              </p>
            )}
            {status === "partially_paid" && balance > 0 && (
              <p className="flex items-start gap-2">
                <Clock className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  <span className="font-semibold text-[#6A0000]">Remaining: ₱{balance.toLocaleString()}</span>
                  <br />
                  Pay the remaining balance via cashier.
                </span>
              </p>
            )}
            {status === "paid" && (
              <p className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0 text-blue-600" />
                Fully paid — Awaiting clearance from Finance.
              </p>
            )}
            {status === "cleared" && (
              <p className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0 text-green-600" />
                Cleared — You may proceed to view your class schedule.
              </p>
            )}
            {status === "hold" && (
              <p className="flex items-center gap-2 text-amber-800">
                <AlertCircle className="h-4 w-4 shrink-0" />
                On hold — contact Finance office for assistance.
              </p>
            )}
          </div>
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
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Link
                  href={`/student/billing/${postedAssessment.id}/form`}
                  className="text-sm font-medium text-[#6A0000] hover:underline"
                >
                  View assessment form →
                </Link>
                {assessmentFormData && (
                  <DownloadAssessmentFormPDFButton data={assessmentFormData} size="sm" />
                )}
              </div>
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
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-neutral-50 text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Method</th>
                  <th className="px-4 py-2 font-medium text-right">Amount</th>
                  <th className="px-4 py-2 font-medium">Reference</th>
                  <th className="px-4 py-2 font-medium text-right">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-neutral-600">
                      No payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((p, i) => {
                    const details = receiptDetails[i];
                    return (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="px-4 py-2">
                          {p.receivedAt ? new Date(p.receivedAt).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-2 capitalize">{p.method}</td>
                        <td className="px-4 py-2 text-right font-medium">
                          ₱{Number(p.amount).toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-neutral-600">{p.referenceNo ?? "—"}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/student/billing/receipt/${p.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm font-medium text-[#6A0000] hover:underline"
                            >
                              <Printer className="h-3.5 w-3.5" />
                              Print
                            </Link>
                            {details && (
                              <DownloadReceiptPDFButton data={details} size="sm" />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
