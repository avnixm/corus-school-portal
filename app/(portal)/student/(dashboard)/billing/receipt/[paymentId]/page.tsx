import { getPaymentWithDetails } from "@/lib/finance/queries";
import { SCHOOL } from "@/lib/school-branding";
import { getCurrentStudent } from "@/lib/auth/getCurrentStudent";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PrintButton } from "@/app/(portal)/finance/assessments/[assessmentId]/form/PrintButton";
import { DownloadReceiptPDFButton } from "@/components/pdf/DownloadReceiptPDFButton";

export const dynamic = "force-dynamic";

export const metadata = { title: "Payment Receipt" };

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  gcash: "GCash",
  bank: "Bank Transfer",
  card: "Card",
  other: "Other",
};

export default async function StudentReceiptPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const current = await getCurrentStudent();
  if (!current) notFound();

  const { paymentId } = await params;
  const data = await getPaymentWithDetails(paymentId);
  if (!data) notFound();

  if (data.studentId !== current.studentId) {
    notFound();
  }

  const amount = parseFloat(data.amount ?? "0");
  const receivedDate = data.receivedAt
    ? new Date(data.receivedAt).toLocaleString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
  const receiptNo = data.referenceNo ?? data.id.slice(0, 8).toUpperCase();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link
          href="/student/billing"
          className="text-sm text-[#6A0000] hover:underline"
        >
          ← Billing
        </Link>
        <div className="flex gap-2">
          <DownloadReceiptPDFButton data={data} />
          <PrintButton />
        </div>
      </div>

      <div
        id="receipt"
        className="rounded-lg border bg-white p-8 print:border-0 print:shadow-none"
      >
        <header className="mb-8 text-center">
          <h1 className="text-lg font-bold text-[#6A0000]">{SCHOOL.name}</h1>
          <p className="mt-1 text-xs text-neutral-600">{SCHOOL.address}</p>
          <p className="text-xs text-neutral-600">Tel No. {SCHOOL.tel}</p>
          <p className="mt-4 text-sm font-semibold">OFFICIAL RECEIPT</p>
          <p className="mt-1 text-xs text-neutral-600">
            Receipt No: {receiptNo} · {receivedDate}
          </p>
        </header>

        <section className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <p>
              <span className="font-medium text-neutral-600">Student:</span>{" "}
              {data.fullName}
            </p>
            <p>
              <span className="font-medium text-neutral-600">Student No:</span>{" "}
              {data.studentCode ?? "—"}
            </p>
            <p>
              <span className="font-medium text-neutral-600">Program:</span>{" "}
              {data.program ?? "—"} {data.yearLevel ?? ""}
            </p>
            <p>
              <span className="font-medium text-neutral-600">Term:</span>{" "}
              {data.schoolYearName ?? "—"} / {data.termName ?? "—"}
            </p>
          </div>

          <div className="border-t pt-4">
            {data.discountAmount != null && data.originalAmount != null ? (
              <>
                <div className="flex justify-between py-1 text-sm">
                  <span>{data.remarks ?? "Payment"}</span>
                  <span>
                    ₱{parseFloat(data.originalAmount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-sm text-green-700">
                  <span>Less: Full payment discount (10%)</span>
                  <span>
                    -₱{parseFloat(data.discountAmount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between border-t py-2 text-lg font-bold">
                  <span>Amount Paid</span>
                  <span className="text-[#6A0000]">
                    ₱{amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex justify-between py-2 text-lg font-bold">
                <span>Amount Paid</span>
                <span className="text-[#6A0000]">
                  ₱{amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm text-neutral-600">
              <span>Method:</span>
              <span>{METHOD_LABELS[data.method ?? "other"] ?? data.method}</span>
            </div>
            {data.balanceAfter != null && (
              <div className="mt-2 flex justify-between border-t pt-2 text-sm">
                <span>Current Balance:</span>
                <span>
                  ₱
                  {parseFloat(data.balanceAfter).toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            )}
          </div>

          {data.remarks && (
            <p className="text-xs text-neutral-500">Payment for: {data.remarks}</p>
          )}
        </section>

        <footer className="mt-12 pt-6 text-center text-xs text-neutral-500">
          This is a computer-generated receipt. Thank you for your payment.
        </footer>
      </div>
    </div>
  );
}
