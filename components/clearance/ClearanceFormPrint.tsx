import { SCHOOL } from "@/lib/school-branding";

export type ClearanceFormPrintSubject = {
  code: string;
  title: string;
  units: string | number;
  teacher?: string | null;
};

export type ClearanceFormPrintItem = {
  officeType: string;
  officeLabel: string;
  status: string;
};

export type ClearanceFormPrintProps = {
  studentName: string;
  studentCode: string;
  program: string | null;
  yearLevel: string | null;
  sectionName: string | null;
  termName: string;
  schoolYearName: string;
  periodName: string;
  subjects: ClearanceFormPrintSubject[];
  items: ClearanceFormPrintItem[];
  referenceNo?: string | null;
};

const OFFICE_LABELS: Record<string, string> = {
  finance: "Finance (Cashier/Accounting)",
  registrar: "Registrar",
  program_head: "Program Head / Department",
  library: "Library",
  lab: "Computer Lab",
};

export function ClearanceFormPrint({
  studentName,
  studentCode,
  program,
  yearLevel,
  sectionName,
  termName,
  schoolYearName,
  periodName,
  subjects,
  items,
  referenceNo,
}: ClearanceFormPrintProps) {
  return (
    <div
      id="clearance-form"
      className="relative mx-auto max-w-[210mm] rounded-lg border border-black bg-white p-6 print:border print:shadow-none print:p-6"
    >
      <header className="mb-6 border-b border-neutral-300 pb-4 text-center">
        <h1 className="text-base font-bold text-[#6A0000]">{SCHOOL.name}</h1>
        <p className="mt-1 text-sm text-neutral-700">{SCHOOL.address}</p>
        <p className="mt-3 text-sm font-bold uppercase text-neutral-900">
          Student Clearance Form
        </p>
      </header>

      <section className="mb-4 text-sm">
        <p>
          <span className="font-medium text-neutral-600">Student Name:</span>{" "}
          {studentName}
        </p>
        <p>
          <span className="font-medium text-neutral-600">Student No.:</span>{" "}
          {studentCode}
        </p>
        <p>
          <span className="font-medium text-neutral-600">Program:</span>{" "}
          {program ?? "—"} {yearLevel ?? ""}
        </p>
        <p>
          <span className="font-medium text-neutral-600">Section:</span>{" "}
          {sectionName ?? "—"}
        </p>
        <p>
          <span className="font-medium text-neutral-600">Term / School Year:</span>{" "}
          {termName} – {schoolYearName}
        </p>
        <p>
          <span className="font-medium text-neutral-600">Grading Period:</span>{" "}
          {periodName}
        </p>
      </section>

      <section className="mb-4">
        <h2 className="mb-2 text-xs font-semibold uppercase text-[#6A0000]">
          Enrolled Subjects
        </h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-300 bg-neutral-50 text-left text-xs font-medium text-[#6A0000]">
              <th className="p-2">Code</th>
              <th className="p-2">Description</th>
              <th className="w-16 p-2 text-right">Units</th>
              <th className="p-2">Teacher</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s, i) => (
              <tr key={i} className="border-b border-neutral-100">
                <td className="p-2">{s.code}</td>
                <td className="p-2">{s.title}</td>
                <td className="p-2 text-right">{String(s.units)}</td>
                <td className="p-2">{s.teacher ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mb-4">
        <h2 className="mb-2 text-xs font-semibold uppercase text-[#6A0000]">
          Clearance (Signature)
        </h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-300 bg-neutral-50 text-left text-xs font-medium text-[#6A0000]">
              <th className="p-2">Office</th>
              <th className="w-48 p-2">Signature / Date</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b border-neutral-100">
                <td className="p-2">{item.officeLabel}</td>
                <td className="p-2">
                  <span className="inline-block min-h-[1.5em] w-full border-b border-neutral-400" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {referenceNo && (
        <p className="mt-4 text-xs text-neutral-500">Ref. No.: {referenceNo}</p>
      )}
    </div>
  );
}
