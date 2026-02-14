// path: app/(portal)/dean/fees/[feeSetupId]/page.tsx
import { getFeeSetupWithDetails } from "@/db/queries";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FeeSetupDetailView } from "@/app/(portal)/program-head/fees/FeeSetupDetailView";
import { DeanFeeApprovalActions } from "../DeanFeeApprovalActions";
import { computeFeeSetupTotals } from "@/lib/fees/totals";
import type { FeeSetupLine } from "@/lib/fees/types";

export const dynamic = "force-dynamic";

export default async function DeanFeeSetupDetailPage({
  params,
}: {
  params: Promise<{ feeSetupId: string }>;
}) {
  const { feeSetupId } = await params;
  const details = await getFeeSetupWithDetails(feeSetupId);
  if (!details) notFound();
  if (details.setup.status !== "pending_dean") {
    return (
      <div className="space-y-4">
        <Link href="/dean/fees" className="text-sm text-[#6A0000] hover:underline">
          ← Fee Approvals
        </Link>
        <p className="text-neutral-600">This fee setup is not pending your approval.</p>
      </div>
    );
  }

  const lines: FeeSetupLine[] = details.lines.map((l) => ({
    id: l.id,
    feeSetupId: l.feeSetupId,
    lineType: l.lineType,
    label: l.label,
    amount: l.amount ?? "0",
    qty: l.qty ?? 1,
    perUnit: l.perUnit ?? false,
    sortOrder: l.sortOrder ?? 0,
  }));
  const totalUnits = 0;
  const tuitionPerUnit = parseFloat(details.setup.tuitionPerUnit ?? "0");
  const totals = computeFeeSetupTotals(lines, totalUnits, tuitionPerUnit);

  return (
    <div className="space-y-6">
      <Link href="/dean/fees" className="text-sm text-[#6A0000] hover:underline">
        ← Fee Approvals
      </Link>
      <FeeSetupDetailView
        setup={details.setup}
        lines={details.lines}
        totals={totals}
        totalUnits={totalUnits}
        approveSlot={<DeanFeeApprovalActions feeSetupId={feeSetupId} />}
      />
    </div>
  );
}
