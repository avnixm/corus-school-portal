import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PostPaymentForm } from "./PostPaymentForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Payments" };

export default async function PaymentsPage() {
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
    </div>
  );
}
