import Link from "next/link";
import {
  getApprovedEnrollmentsNeedingAssessment,
  getEnrollmentsForClearance,
  getCollectionsReport,
} from "@/lib/finance/queries";
import { FileSpreadsheet, ShieldCheck, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata = { title: "Dashboard" };

export default async function FinanceDashboardPage() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const endOfMonth = new Date();
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  endOfMonth.setDate(0);
  endOfMonth.setHours(23, 59, 59, 999);

  const [needingAssessment, forClearance, collections] = await Promise.all([
    getApprovedEnrollmentsNeedingAssessment(),
    getEnrollmentsForClearance(),
    getCollectionsReport(startOfMonth, endOfMonth),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Finance Dashboard
        </h2>
        <p className="mt-1 text-sm text-neutral-800">
          Overview of assessments, payments, and clearance.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-800">
              Enrollments Needing Assessment
            </CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-[#6A0000]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#6A0000]">
              {needingAssessment.length}
            </div>
            <Link
              href="/finance/assessments"
              className="mt-2 inline-block text-xs font-medium text-[#6A0000] hover:underline"
            >
              View →
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-800">
              Ready for Clearance
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-[#6A0000]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#6A0000]">
              {forClearance.length}
            </div>
            <Link
              href="/finance/clearance"
              className="mt-2 inline-block text-xs font-medium text-[#6A0000] hover:underline"
            >
              View →
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-800">
              Collected This Month
            </CardTitle>
            <Wallet className="h-4 w-4 text-[#6A0000]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#6A0000]">
              ₱{collections.total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </div>
            <p className="mt-1 text-xs text-neutral-800">
              {collections.count} payment(s)
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
