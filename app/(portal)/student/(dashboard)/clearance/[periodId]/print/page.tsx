import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentStudent } from "@/lib/auth/getCurrentStudent";
import { getEnrollmentForStudentActiveTerm } from "@/db/queries";
import { getClearancePrintData, getOrCreateClearanceRequest } from "@/lib/clearance/queries";
import { ClearanceFormPrint } from "@/components/clearance/ClearanceFormPrint";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Clearance Form (Print)" };

export default async function StudentClearancePrintPage({
  params,
}: {
  params: Promise<{ periodId: string }>;
}) {
  const { periodId } = await params;
  const current = await getCurrentStudent();
  if (!current) notFound();

  const enrollment = await getEnrollmentForStudentActiveTerm(current.studentId);
  if (!enrollment || enrollment.studentId !== current.studentId) notFound();

  let printData = await getClearancePrintData(enrollment.id, periodId);
  if (!printData) {
    const created = await getOrCreateClearanceRequest(
      enrollment.id,
      periodId,
      current.profile.userId ?? undefined
    );
    if (!created) notFound();
    printData = await getClearancePrintData(enrollment.id, periodId);
  }
  if (!printData) notFound();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link
          href="/student/clearance"
          className="text-sm font-medium text-[#6A0000] hover:underline"
        >
          ← Clearance
        </Link>
        <PrintButton />
      </div>
      <div className="overflow-x-auto print:overflow-visible">
        <ClearanceFormPrint
          studentName={printData.studentName}
          studentCode={printData.studentCode ?? "—"}
          program={printData.program}
          yearLevel={printData.yearLevel}
          sectionName={printData.sectionName}
          termName={printData.termName}
          schoolYearName={printData.schoolYearName}
          periodName={printData.periodName}
          subjects={printData.subjects}
          items={printData.items}
          referenceNo={printData.requestId.slice(0, 8)}
        />
      </div>
    </div>
  );
}
