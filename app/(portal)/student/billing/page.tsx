import { getBillingRowsByStudentId } from "@/db/queries";
import { getCurrentStudent } from "@/lib/auth/getCurrentStudent";

export default async function BillingPage() {
  const current = await getCurrentStudent();
  const studentId = current?.studentId;

  const rows = studentId
    ? await getBillingRowsByStudentId(studentId, 10)
    : [];

  const [summary] = rows;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">Billing</h2>
        <p className="text-sm text-neutral-700">
          Tuition and fees summary for your current enrollment.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white/80 p-4">
          <p className="text-xs uppercase text-[#6A0000]">Total fees</p>
          <p className="mt-1 text-2xl font-semibold text-[#6A0000]">
            ₱{summary?.totalFee ?? 0}
          </p>
        </div>
        <div className="rounded-xl border bg-white/80 p-4">
          <p className="text-xs uppercase text-[#6A0000]">Amount paid</p>
          <p className="mt-1 text-2xl font-semibold text-[#6A0000]">
            ₱{summary?.amountPaid ?? 0}
          </p>
        </div>
        <div className="rounded-xl border bg-white/80 p-4">
          <p className="text-xs uppercase text-[#6A0000]">Balance</p>
          <p className="mt-1 text-2xl font-semibold text-[#6A0000]">
            ₱{summary?.balance ?? 0}
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-white/80 p-4 text-sm text-neutral-700">
        Detailed transactions and online payment integration can be added here
        once payment channels are connected.
      </div>
    </div>
  );
}
