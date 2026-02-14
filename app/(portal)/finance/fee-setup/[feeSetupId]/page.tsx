// path: app/(portal)/finance/fee-setup/[feeSetupId]/page.tsx
import { getFeeSetupWithDetails } from "@/db/queries";
import { getProgramsList, getSchoolYearsList, getTermsList } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { notFound } from "next/navigation";

import { computeFeeSetupTotals } from "@/lib/fees/totals";
import type { FeeSetupLine } from "@/lib/fees/types";
import { FeeSetupEditor } from "../FeeSetupEditor";

export const dynamic = "force-dynamic";

export default async function FeeSetupEditPage({
  params,
}: {
  params: Promise<{ feeSetupId: string }>;
}) {
  const { feeSetupId } = await params;
  const details = await getFeeSetupWithDetails(feeSetupId);
  if (!details) notFound();

  const [programs, schoolYears, terms] = await Promise.all([
    getProgramsList(true),
    getSchoolYearsList(),
    getTermsList(),
  ]);

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

  const totalUnits = 0; // TODO: from schedule when generating assessment
  const tuitionPerUnit = parseFloat(details.setup.tuitionPerUnit ?? "0");
  const totals = computeFeeSetupTotals(lines, totalUnits, tuitionPerUnit);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/finance/fee-setup"
            className="text-sm text-[#6A0000] hover:underline"
          >
            ← Fee Setup
          </Link>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#6A0000]">
            Fee Setup Editor
          </h2>
        </div>
        <Badge
          variant="outline"
          className={
            details.setup.status === "approved"
              ? "bg-green-100 text-green-800"
              : details.setup.status === "rejected"
                ? "bg-red-100 text-red-800"
                : ""
          }
        >
          {String(details.setup.status).replace(/_/g, " ")}
        </Badge>
      </div>

      {details.approval && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#6A0000]">
              Approval Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              Program Head: {details.approval.programHeadStatus}
              {details.approval.programHeadAt &&
                ` at ${new Date(details.approval.programHeadAt).toLocaleString()}`}
              {details.approval.programHeadRemarks && (
                <p className="mt-1 text-neutral-600">
                  {details.approval.programHeadRemarks}
                </p>
              )}
            </div>
            <div>
              Dean: {details.approval.deanStatus}
              {details.approval.deanAt &&
                ` at ${new Date(details.approval.deanAt).toLocaleString()}`}
              {details.approval.deanRemarks && (
                <p className="mt-1 text-neutral-600">
                  {details.approval.deanRemarks}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <FeeSetupEditor
        feeSetupId={feeSetupId}
        setup={details.setup}
        lines={details.lines}
        approval={details.approval}
        programs={programs.map((p) => ({ id: p.id, code: p.code, name: p.name }))}
        schoolYears={schoolYears.map((s) => ({ id: s.id, name: s.name }))}
        terms={terms.map((t) => ({ id: t.id, name: t.name }))}
        totals={totals}
        totalUnits={totalUnits}
      />
    </div>
  );
}
