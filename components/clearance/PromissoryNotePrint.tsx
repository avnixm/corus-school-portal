import { SCHOOL } from "@/lib/school-branding";

export type PromissoryNotePrintProps = {
  studentName: string;
  studentCode: string;
  program: string | null;
  yearLevel: string | null;
  schoolYearName: string;
  termName: string;
  periodName: string;
  amountPromised: string;
  dueDate: string;
  reason: string;
  financeRemarks: string | null;
  status: string;
  submittedAt: string | null;
  deanApproved: boolean | null;
  deanAt: string | null;
  deanRemarks: string | null;
  referenceNo: string;
};

export function PromissoryNotePrint({
  studentName,
  studentCode,
  program,
  yearLevel,
  schoolYearName,
  termName,
  periodName,
  amountPromised,
  dueDate,
  reason,
  financeRemarks,
  status,
  submittedAt,
  deanApproved,
  deanAt,
  deanRemarks,
  referenceNo,
}: PromissoryNotePrintProps) {
  return (
    <div
      id="promissory-note"
      className="relative mx-auto max-w-[210mm] rounded-lg border border-black bg-white p-6 print:border print:shadow-none print:p-6"
    >
      <header className="mb-6 border-b border-neutral-300 pb-4 text-center">
        <h1 className="text-base font-bold text-[#6A0000]">{SCHOOL.name}</h1>
        <p className="mt-1 text-sm text-neutral-700">{SCHOOL.address}</p>
        <p className="mt-3 text-lg font-bold uppercase text-neutral-900">
          Promissory Note
        </p>
      </header>

      <section className="mb-4 space-y-1 text-sm">
        <p>
          <span className="font-medium text-neutral-600">Student:</span> {studentName}
        </p>
        <p>
          <span className="font-medium text-neutral-600">Student No.:</span> {studentCode}
        </p>
        <p>
          <span className="font-medium text-neutral-600">Program / Year:</span>{" "}
          {program ?? "—"} {yearLevel ?? ""}
        </p>
        <p>
          <span className="font-medium text-neutral-600">Term / School Year:</span>{" "}
          {termName} – {schoolYearName}
        </p>
        <p>
          <span className="font-medium text-neutral-600">Grading period:</span> {periodName}
        </p>
      </section>

      <section className="mb-4 border-t border-neutral-200 pt-4">
        <p className="text-sm">
          <span className="font-medium text-neutral-600">Amount promised:</span> ₱
          {parseFloat(amountPromised).toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
        <p className="text-sm">
          <span className="font-medium text-neutral-600">Due date:</span>{" "}
          {dueDate ? new Date(dueDate).toLocaleDateString("en-PH") : "—"}
        </p>
        <p className="mt-2 text-sm">
          <span className="font-medium text-neutral-600">Reason / terms:</span>
        </p>
        <p className="mt-1 whitespace-pre-wrap text-sm">{reason}</p>
        {financeRemarks && (
          <p className="mt-2 text-xs text-neutral-600">
            <span className="font-medium">Finance remarks:</span> {financeRemarks}
          </p>
        )}
      </section>

      <section className="mb-4 border-t border-neutral-200 pt-4">
        <p className="text-xs text-neutral-600">Finance (Cashier) signature:</p>
        <div className="mt-2 h-10 w-64 border-b border-neutral-400" />
      </section>

      <section className="border-t border-neutral-200 pt-4">
        <h3 className="text-xs font-semibold uppercase text-[#6A0000]">Dean approval</h3>
        <p className="mt-1 text-sm">
          Status:{" "}
          {deanApproved === true
            ? "Approved"
            : deanApproved === false
              ? "Rejected"
              : status === "submitted"
                ? "Pending"
                : status}
        </p>
        {deanAt && (
          <p className="text-sm">
            Date: {new Date(deanAt).toLocaleDateString("en-PH", { dateStyle: "medium" })}
          </p>
        )}
        {deanRemarks && (
          <p className="mt-1 text-sm text-neutral-600">Remarks: {deanRemarks}</p>
        )}
        <p className="mt-2 text-xs text-neutral-600">Dean signature:</p>
        <div className="mt-1 h-10 w-64 border-b border-neutral-400" />
      </section>

      <p className="mt-6 text-xs text-neutral-500">Ref. No.: {referenceNo}</p>
    </div>
  );
}
