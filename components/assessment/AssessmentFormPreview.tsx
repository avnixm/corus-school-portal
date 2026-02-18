import { SCHOOL, formatAmount } from "@/lib/school-branding";
import type { AssessmentFormData } from "@/components/pdf/AssessmentFormPDF";

export function AssessmentFormPreview({ data }: { data: AssessmentFormData }) {
  const {
    assessment,
    student,
    program,
    programName,
    yearLevel,
    schoolYearName,
    termName,
    lines,
    scheduleSubjects,
  } = data;
  const tuitionAmount = parseFloat(assessment.tuitionAmount ?? "0");
  const labTotal = parseFloat(assessment.labTotal ?? "0");
  const miscTotal = parseFloat(assessment.miscTotal ?? "0");
  const otherTotal = parseFloat(assessment.otherTotal ?? "0");
  const discounts = parseFloat(assessment.discounts ?? "0");
  const total = parseFloat(assessment.total ?? "0");
  const balance = parseFloat(assessment.efsBalance ?? String(total));
  const assessedDate = assessment.assessedAt
    ? new Date(assessment.assessedAt).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;
  const totalUnits =
    assessment.totalUnits ??
    scheduleSubjects.reduce((s, x) => s + parseFloat(x.units || "0"), 0);
  const tuitionRate =
    assessment.tuitionAmount && assessment.totalUnits
      ? (
          parseFloat(assessment.tuitionAmount) / Number(assessment.totalUnits)
        ).toFixed(2)
      : "0";
  const labSubjectCount = scheduleSubjects.filter((s) => s.withLab).length || 1;
  const miscLines = lines.filter(
    (l) => l.category === "misc" || l.category === "other"
  );

  return (
    <div
      id="assessment-form"
      className="relative mx-auto max-w-[210mm] rounded-lg border border-black bg-white p-6 print:border-0 print:shadow-none print:p-6"
    >
      {/* Watermark - only when posted */}
      {assessment.status === "posted" && (
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 -rotate-[35deg] select-none text-6xl font-bold text-red-600 opacity-[0.12]"
          aria-hidden
        >
          ENROLLED
        </div>
      )}

      <div className="relative z-10">
        {/* Header */}
        <header className="mb-6 text-center">
          <h1 className="text-base font-bold">{SCHOOL.name}</h1>
          <p className="mt-1 text-sm">{SCHOOL.address}</p>
          <p className="mt-3 text-sm font-bold">
            {(program ?? programName ?? "—").toUpperCase()}
          </p>
          <p className="mt-2 text-sm font-bold">OFFICIAL COLLEGE ENROLMENT FORM</p>
          <p className="mt-2 text-sm">{(yearLevel ?? "—").toUpperCase()}</p>
          <p className="text-sm">
            {(termName ?? "—").toUpperCase()}, ACADEMIC YEAR {schoolYearName ?? "—"}
          </p>
          {assessment.status === "posted" && assessedDate && (
            <p className="mt-2 text-xs">Posted: {assessedDate}</p>
          )}
        </header>

        {/* Student info */}
        <section className="mb-6 flex justify-between border-b border-black pb-2 text-sm">
          <span>Name: {student.fullName}</span>
          <span>Student No.: {student.studentCode ?? "—"}</span>
        </section>

        {/* PART I */}
        <section className="mb-6">
          <h2 className="border-b border-black pb-2 text-sm font-bold">
            PART I. STUDENT REGISTRATION
          </h2>
          <p className="mb-3 mt-2 text-sm font-bold">REGULAR</p>
          <table className="w-full border border-black text-xs">
            <thead>
              <tr className="font-bold">
                <th className="border-b border-r border-black px-2 py-1.5 text-left">
                  Subject
                </th>
                <th className="border-b border-r border-black px-2 py-1.5 text-center">
                  Units
                </th>
                <th className="border-b border-r border-black px-2 py-1.5 text-left">
                  Descriptive Title
                </th>
                <th className="border-b border-r border-black px-2 py-1.5 text-left">
                  Pre-Req
                </th>
                <th className="border-b border-black px-2 py-1.5 text-center">
                  with Lab
                </th>
              </tr>
            </thead>
            <tbody>
              {scheduleSubjects.map((s, i) => (
                <tr key={i}>
                  <td className="border-b border-r border-black px-2 py-1 font-bold">
                    {s.code}
                  </td>
                  <td className="border-b border-r border-black px-2 py-1 text-center">
                    {s.units}
                  </td>
                  <td className="border-b border-r border-black px-2 py-1">
                    {s.title}
                  </td>
                  <td className="border-b border-r border-black px-2 py-1">
                    {s.prereq ?? "—"}
                  </td>
                  <td className="border-b border-black px-2 py-1 text-center">
                    {s.withLab ? "*" : "—"}
                  </td>
                </tr>
              ))}
              {scheduleSubjects.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="border-b border-black px-2 py-4 text-center"
                  >
                    No subjects loaded
                  </td>
                </tr>
              )}
              <tr className="font-bold">
                <td className="border-b border-r border-black px-2 py-1">
                  Total Units:
                </td>
                <td className="border-b border-r border-black px-2 py-1 text-center">
                  {totalUnits}
                </td>
                <td
                  colSpan={3}
                  className="border-b border-black px-2 py-1"
                />
              </tr>
            </tbody>
          </table>
        </section>

        {/* PART II */}
        <section>
          <h2 className="border-b border-black pb-2 text-sm font-bold">
            PART II. ASSESSMENT OF FEES
          </h2>
          <div className="mt-4 flex gap-6">
            {/* Left column */}
            <div className="min-w-0 flex-1">
              <div className="mb-2 text-sm">
                Total No. of Units: {totalUnits} x {tuitionRate}
              </div>
              <div className="mb-4 text-sm">
                Laboratory Fee:{" "}
                {labTotal > 0 ? labTotal.toFixed(2) : "—"} x {labSubjectCount}
              </div>
              <h3 className="mb-2 border-b border-black pb-1 text-sm font-bold">
                MISCELLANEOUS & OTHER FEES
              </h3>
              <table className="w-full border border-black text-xs">
                <tbody>
                  {miscLines.map((l) => (
                    <tr key={l.id}>
                      <td className="border-b border-r border-black px-2 py-1.5">
                        {l.description}
                      </td>
                      <td className="w-[35%] border-b border-black px-2 py-1.5 text-right tabular-nums">
                        {formatAmount(parseFloat(l.lineTotal ?? "0"))}
                      </td>
                    </tr>
                  ))}
                  <tr className="font-bold">
                    <td className="border-b border-r border-black px-2 py-1.5">
                      Total
                    </td>
                    <td className="border-b border-black px-2 py-1.5 text-right tabular-nums">
                      {formatAmount(miscTotal + otherTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/* Right column - Summary */}
            <div className="w-[175px] shrink-0">
              <div className="border border-black p-3">
                <h3 className="border-b border-black border-dashed pb-2 text-sm font-bold">
                  SUMMARY
                </h3>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between gap-4">
                    <span className="min-w-0 flex-1">Total Units</span>
                    <span className="shrink-0 tabular-nums">{totalUnits}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="min-w-0 flex-1">Tuition Fee</span>
                    <span className="shrink-0 tabular-nums">
                      {formatAmount(tuitionAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="min-w-0 flex-1">Laboratory Fee</span>
                    <span className="shrink-0 tabular-nums">
                      {formatAmount(labTotal)}
                    </span>
                  </div>
                  {discounts > 0 && (
                    <div className="flex justify-between gap-4 text-green-700">
                      <span className="min-w-0 flex-1">
                        Less: Full payment discount (10%)
                      </span>
                      <span className="shrink-0 tabular-nums">
                        -{formatAmount(discounts)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between gap-4">
                    <span className="min-w-0 flex-1">
                      Miscellaneous & Other Fees
                    </span>
                    <span className="shrink-0 tabular-nums">
                      {formatAmount(miscTotal + otherTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4 border-t-2 border-black pt-3 font-bold">
                    <span className="min-w-0 flex-1">TOTAL FEES</span>
                    <span className="shrink-0 tabular-nums">
                      {formatAmount(total)}
                    </span>
                  </div>
                  {assessment.status === "posted" && balance !== total && (
                    <>
                      <div className="flex justify-between gap-4">
                        <span className="min-w-0 flex-1">Paid</span>
                        <span className="shrink-0 tabular-nums">
                          -{formatAmount(total - balance)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4 border-t-2 border-black pt-3 font-bold text-[#6A0000]">
                        <span className="min-w-0 flex-1">BALANCE DUE</span>
                        <span className="shrink-0 tabular-nums">
                          {formatAmount(balance)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Signatures */}
        <footer className="mt-10 flex gap-12">
          <div className="flex-1">
            <div className="h-10 border-b border-black" />
            <p className="mt-1 text-center text-sm">{student.fullName}</p>
            <p className="text-center text-xs font-medium">
              STUDENT&apos;S SIGNATURE
            </p>
          </div>
          <div className="flex-1">
            <div className="h-10 border-b border-black" />
            <p className="mt-1 text-center text-sm text-neutral-500">
              _______________________
            </p>
            <p className="text-center text-xs font-medium">PROGRAM HEAD</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
