// path: app/(portal)/student/(dashboard)/billing/[assessmentId]/form/page.tsx
import { getAssessmentFormData } from "@/db/queries";
import { getCurrentStudent } from "@/lib/auth/getCurrentStudent";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PrintButton } from "@/app/(portal)/finance/assessments/[assessmentId]/form/PrintButton";
import { DownloadAssessmentFormPDFButton } from "@/components/pdf/DownloadAssessmentFormPDFButton";
import { AssessmentFormPreview } from "@/components/assessment/AssessmentFormPreview";

export const dynamic = "force-dynamic";

export const metadata = { title: "Assessment Form" };

export default async function StudentAssessmentFormPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const current = await getCurrentStudent();
  if (!current) notFound();

  const { assessmentId } = await params;
  const data = await getAssessmentFormData(assessmentId);
  if (!data) notFound();

  if (data.studentId !== current.studentId) {
    notFound();
  }

  const formData = {
    assessment: data.assessment,
    student: data.student,
    program: data.program,
    programName: data.programName,
    yearLevel: data.yearLevel,
    schoolYearName: data.schoolYearName,
    termName: data.termName,
    lines: data.lines,
    scheduleSubjects: data.scheduleSubjects,
  };

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
          <DownloadAssessmentFormPDFButton data={formData} />
          <PrintButton />
        </div>
      </div>
      <div className="overflow-x-auto print:overflow-visible">
        <AssessmentFormPreview data={formData} />
      </div>
    </div>
  );
}
