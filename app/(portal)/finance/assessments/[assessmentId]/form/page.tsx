// path: app/(portal)/finance/assessments/[assessmentId]/form/page.tsx
import { getAssessmentFormData } from "@/db/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";

export const metadata = { title: "Assessment Form" };

export default async function AssessmentFormPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;
  const data = await getAssessmentFormData(assessmentId);
  if (!data) notFound();

  const { assessment, student, program, programName, yearLevel, schoolYearName, termName, lines, scheduleSubjects } = data;
  const tuitionAmount = parseFloat(assessment.tuitionAmount ?? "0");
  const labTotal = parseFloat(assessment.labTotal ?? "0");
  const miscTotal = parseFloat(assessment.miscTotal ?? "0");
  const otherTotal = parseFloat(assessment.otherTotal ?? "0");
  const total = parseFloat(assessment.total ?? "0");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link
          href="/finance/assessments"
          className="text-sm text-[#6A0000] hover:underline"
        >
          ← Assessments
        </Link>
        <PrintButton />
      </div>

      <div id="assessment-form" className="rounded-lg border bg-white p-8 print:border-0 print:shadow-none">
        <header className="mb-8 text-center">
          <h1 className="text-xl font-bold text-[#6A0000]">CORUS</h1>
          <p className="text-sm text-neutral-600">Official Enrollment / Assessment Form</p>
        </header>

        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-[#6A0000]">Student Information</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <p>
              <span className="font-medium">Name:</span> {student.fullName}
            </p>
            <p>
              <span className="font-medium">Student No:</span> {student.studentCode ?? "—"}
            </p>
            <p>
              <span className="font-medium">Program:</span> {program ?? programName ?? "—"}
            </p>
            <p>
              <span className="font-medium">Year Level:</span> {yearLevel ?? "—"}
            </p>
            <p>
              <span className="font-medium">School Year:</span> {schoolYearName ?? "—"}
            </p>
            <p>
              <span className="font-medium">Term:</span> {termName ?? "—"}
            </p>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-[#6A0000]">Part I – Student Registration (Subjects)</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-neutral-50">
                <th className="px-2 py-1 text-left">Subject</th>
                <th className="px-2 py-1 text-center">Units</th>
                <th className="px-2 py-1 text-left">Descriptive Title</th>
                <th className="px-2 py-1 text-left">Pre-Req</th>
                <th className="px-2 py-1 text-center">With Lab</th>
              </tr>
            </thead>
            <tbody>
              {scheduleSubjects.map((s, i) => (
                <tr key={i} className="border-b">
                  <td className="px-2 py-1">{s.code}</td>
                  <td className="px-2 py-1 text-center">{s.units}</td>
                  <td className="px-2 py-1">{s.title}</td>
                  <td className="px-2 py-1">{s.prereq ?? "—"}</td>
                  <td className="px-2 py-1 text-center">{s.withLab ? "Yes" : "—"}</td>
                </tr>
              ))}
              {scheduleSubjects.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-2 py-4 text-center text-neutral-500">
                    No subjects loaded
                  </td>
                </tr>
              )}
              <tr className="border-b-2 font-medium">
                <td colSpan={1} className="px-2 py-1">
                  Total Units
                </td>
                <td className="px-2 py-1 text-center">
                  {assessment.totalUnits ?? scheduleSubjects.reduce((s, x) => s + parseFloat(x.units || "0"), 0)}
                </td>
                <td colSpan={3} className="px-2 py-1" />
              </tr>
            </tbody>
          </table>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-[#6A0000]">Part II – Assessment of Fees</h2>
          <div className="flex flex-wrap gap-8">
            <div className="min-w-[280px] flex-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-neutral-50">
                    <th className="px-2 py-1 text-left">Description</th>
                    <th className="px-2 py-1 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.id} className="border-b">
                      <td className="px-2 py-1">{l.description}</td>
                      <td className="px-2 py-1 text-right">
                        ₱{parseFloat(l.lineTotal ?? "0").toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="w-64 shrink-0">
              <div className="rounded-lg border bg-neutral-50 p-4">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Tuition Fee</span>
                    <span>₱{tuitionAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Laboratory Fee</span>
                    <span>₱{labTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Misc & Other</span>
                    <span>₱{(miscTotal + otherTotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-bold">
                    <span>TOTAL FEES</span>
                    <span>₱{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-12 flex flex-wrap gap-12 pt-8">
          <div>
            <div className="border-b border-black pb-1 pr-16 font-medium">
              Student Signature
            </div>
            <p className="mt-1 text-xs text-neutral-500">{student.fullName}</p>
          </div>
          <div>
            <div className="border-b border-black pb-1 pr-16 font-medium">
              Program Head
            </div>
            <p className="mt-1 text-xs text-neutral-500">_______________________</p>
          </div>
          <div>
            <div className="border-b border-black pb-1 pr-16 font-medium">
              Dean (Optional)
            </div>
            <p className="mt-1 text-xs text-neutral-500">_______________________</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
