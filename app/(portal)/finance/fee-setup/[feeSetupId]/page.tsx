// path: app/(portal)/finance/fee-setup/[feeSetupId]/page.tsx
import { getFeeSetupWithDetails } from "@/db/queries";
import { getProgramsList, getSchoolYearsList, getTermsBySchoolYearId } from "@/db/queries";
import { getCurriculumSubjectsAndTotalUnitsForEnrollment } from "@/lib/curriculum/queries";
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
    details.setup.schoolYearId
      ? getTermsBySchoolYearId(details.setup.schoolYearId)
      : Promise.resolve([]),
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

  let totalUnits = 0;
  let totalUnitsFromCurriculum = false;
  let labSubjectCount: number | undefined;
  if (
    details.setup.programId &&
    details.setup.schoolYearId &&
    details.setup.termId &&
    details.setup.yearLevel
  ) {
    const curriculum = await getCurriculumSubjectsAndTotalUnitsForEnrollment({
      programId: details.setup.programId,
      schoolYearId: details.setup.schoolYearId,
      termId: details.setup.termId,
      yearLevel: details.setup.yearLevel,
    });
    if (curriculum) {
      totalUnits = curriculum.totalUnits;
      totalUnitsFromCurriculum = true;
      labSubjectCount = curriculum.subjects.filter((s) => s.withLab).length;
    }
  }
  const tuitionPerUnit = parseFloat(details.setup.tuitionPerUnit ?? "0");
  const totals = computeFeeSetupTotals(lines, totalUnits, tuitionPerUnit, labSubjectCount);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/finance/fee-setup"
            className="text-sm font-medium text-[#6A0000] hover:underline"
          >
            ← Fee Setup
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#6A0000]">
            Fee Setup Editor
          </h1>
          <p className="mt-0.5 text-sm text-neutral-600">
            Set tuition per unit and fee lines. Units come from published curriculum when program, year, and term match.
          </p>
        </div>
        <Badge
          variant="outline"
          className={
            details.setup.status === "approved"
              ? "border-green-300 bg-green-50 text-green-800"
              : details.setup.status === "rejected"
                ? "border-red-300 bg-red-50 text-red-800"
                : details.setup.status === "draft"
                  ? "border-[#6A0000]/40 bg-[#6A0000]/5 text-[#6A0000]"
                  : "border-amber-300 bg-amber-50 text-amber-800"
          }
        >
          {String(details.setup.status).replace(/_/g, " ")}
        </Badge>
      </header>

      {details.approval && (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="border-b border-neutral-100 bg-neutral-50/80 px-4 py-3">
            <h2 className="text-sm font-semibold text-[#6A0000]">Approval status</h2>
          </div>
          <div className="space-y-4 p-4 text-sm">
            <div className="rounded-lg border border-neutral-100 bg-neutral-50/50 p-3">
              <span className="font-medium text-neutral-900">Program Head</span>
              <p className="mt-0.5 text-neutral-700">
                {details.approval.programHeadStatus}
                {details.approval.programHeadAt &&
                  ` · ${new Date(details.approval.programHeadAt).toLocaleString()}`}
              </p>
              {details.approval.programHeadRemarks && (
                <p className="mt-1 text-neutral-600">{details.approval.programHeadRemarks}</p>
              )}
            </div>
            <div className="rounded-lg border border-neutral-100 bg-neutral-50/50 p-3">
              <span className="font-medium text-neutral-900">Dean</span>
              <p className="mt-0.5 text-neutral-700">
                {details.approval.deanStatus}
                {details.approval.deanAt &&
                  ` · ${new Date(details.approval.deanAt).toLocaleString()}`}
              </p>
              {details.approval.deanRemarks && (
                <p className="mt-1 text-neutral-600">{details.approval.deanRemarks}</p>
              )}
            </div>
          </div>
        </div>
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
        totalUnitsFromCurriculum={totalUnitsFromCurriculum}
      />
    </div>
  );
}
