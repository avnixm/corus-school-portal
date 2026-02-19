import { notFound } from "next/navigation";
import Link from "next/link";
import { getPromissoryNote } from "@/lib/clearance/queries";
import { requireRole } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeanPromissoryNoteActions } from "./DeanPromissoryNoteActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Promissory Note" };

export default async function DeanPromissoryNoteReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const auth = await requireRole(["dean", "admin"]);
  if ("error" in auth) notFound();

  const note = await getPromissoryNote(id);
  if (!note) notFound();

  const canReview = note.status === "submitted";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dean/promissory-notes"
          className="text-sm font-medium text-[#6A0000] hover:underline"
        >
          ← Promissory notes
        </Link>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#6A0000]">
          Promissory note
        </h2>
        <p className="mt-1 text-sm text-neutral-800">
          Ref. {note.id.slice(0, 8)} · Status: {note.status}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">
            Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-neutral-600">Student:</span> {note.studentName} (
            {note.studentCode})
          </p>
          <p>
            <span className="text-neutral-600">Program / Year:</span>{" "}
            {note.program ?? "—"} {note.yearLevel ?? ""}
          </p>
          <p>
            <span className="text-neutral-600">Term / SY:</span> {note.termName} –{" "}
            {note.schoolYearName}
          </p>
          <p>
            <span className="text-neutral-600">Period:</span> {note.periodName}
          </p>
          {note.totalOutstandingAmount != null && note.totalPromisedAmount != null && (
            <>
              <p>
                <span className="text-neutral-600">Total outstanding:</span> ₱
                {parseFloat(note.totalOutstandingAmount).toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p>
                <span className="text-neutral-600">Total amount promised:</span> ₱
                {parseFloat(note.totalPromisedAmount).toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              {note.installmentMonths != null && (
                <p>
                  <span className="text-neutral-600">Payment term:</span>{" "}
                  {note.installmentMonths} month{note.installmentMonths > 1 ? "s" : ""}
                </p>
              )}
              {note.startDate && (
                <p>
                  <span className="text-neutral-600">Start date:</span>{" "}
                  {new Date(note.startDate).toLocaleDateString("en-PH")}
                </p>
              )}
              {note.finalDueDate && (
                <p>
                  <span className="text-neutral-600">Final due date:</span>{" "}
                  {new Date(note.finalDueDate).toLocaleDateString("en-PH")}
                </p>
              )}
            </>
          )}
          {(note.totalPromisedAmount == null || note.totalOutstandingAmount == null) && (
            <>
              <p>
                <span className="text-neutral-600">Amount promised:</span> ₱
                {parseFloat(note.amountPromised).toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                })}
              </p>
              <p>
                <span className="text-neutral-600">Due date:</span>{" "}
                {note.dueDate ? new Date(note.dueDate).toLocaleDateString("en-PH") : "—"}
              </p>
            </>
          )}
          {note.installmentSchedule && note.installmentSchedule.length > 0 && (
            <div className="mt-3">
              <p className="mb-2 font-medium text-neutral-700">Installment schedule</p>
              <div className="overflow-x-auto rounded border border-neutral-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-3 py-1.5 text-left font-medium text-neutral-600">
                        Payment
                      </th>
                      <th className="px-3 py-1.5 text-left font-medium text-neutral-600">
                        Due date
                      </th>
                      <th className="px-3 py-1.5 text-right font-medium text-neutral-600">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {note.installmentSchedule.map((row) => (
                      <tr key={row.sequence} className="border-t border-neutral-100">
                        <td className="px-3 py-1.5">
                          {row.sequence === 1
                            ? "1st payment"
                            : row.sequence === 2
                              ? "2nd payment"
                              : row.sequence === 3
                                ? "3rd payment"
                                : `${row.sequence}th payment`}
                        </td>
                        <td className="px-3 py-1.5">
                          {new Date(row.dueDate + "Z").toLocaleDateString("en-PH")}
                        </td>
                        <td className="px-3 py-1.5 text-right font-medium">
                          ₱
                          {parseFloat(row.amount).toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <p>
            <span className="text-neutral-600">Reason:</span> {note.reason}
          </p>
          {note.financeRemarks && (
            <p>
              <span className="text-neutral-600">Finance remarks:</span>{" "}
              {note.financeRemarks}
            </p>
          )}
          {note.submittedAt && (
            <p>
              <span className="text-neutral-600">Submitted:</span>{" "}
              {new Date(note.submittedAt).toLocaleString("en-PH")}
            </p>
          )}
        </CardContent>
      </Card>

      {canReview && (
        <DeanPromissoryNoteActions noteId={id} />
      )}

      {note.status === "approved" && (
        <div className="rounded-xl border border-[#6A0000]/30 bg-white p-4">
          <p className="mb-2 text-sm font-medium text-[#6A0000]">
            Print for signature
          </p>
          <Link
            href={`/dean/promissory-notes/${id}/print`}
            className="inline-flex items-center rounded-md bg-[#6A0000] px-4 py-2 text-sm font-medium text-white hover:bg-[#4A0000]"
          >
            Print promissory note
          </Link>
        </div>
      )}
      {note.status === "rejected" && (
        <p className="text-sm">
          <Link
            href={`/dean/promissory-notes/${id}/print`}
            className="font-medium text-[#6A0000] hover:underline"
          >
            Print promissory note
          </Link>
        </p>
      )}
    </div>
  );
}
