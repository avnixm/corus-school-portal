import Link from "next/link";
import { listSubmittedPromissoryNotes } from "@/lib/clearance/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";
export const metadata = { title: "Promissory Notes" };

export default async function DeanPromissoryNotesPage() {
  const rows = await listSubmittedPromissoryNotes();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Promissory Notes
        </h2>
        <p className="text-sm text-neutral-800">
          Review and approve or reject promissory notes submitted by Finance.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">
            Submitted ({rows.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border bg-white/80 text-neutral-900">
            <table className="min-w-full text-left text-sm text-neutral-900">
              <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2">Student</th>
                  <th className="px-4 py-2">Period</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Due date</th>
                  <th className="px-4 py-2">Submitted</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b last:border-0 hover:bg-neutral-50/80"
                  >
                    <td className="px-4 py-2">
                      {row.studentCode} – {row.studentName}
                    </td>
                    <td className="px-4 py-2">{row.periodName}</td>
                    <td className="px-4 py-2">
                      ₱{parseFloat(row.amountPromised ?? "0").toFixed(2)}
                    </td>
                    <td className="px-4 py-2">
                      {row.dueDate
                        ? new Date(row.dueDate).toLocaleDateString("en-PH")
                        : "—"}
                    </td>
                    <td className="px-4 py-2">
                      {row.submittedAt
                        ? new Date(row.submittedAt).toLocaleDateString("en-PH", {
                            dateStyle: "short",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        href={`/dean/promissory-notes/${row.id}`}
                        className="font-medium text-[#6A0000] hover:underline"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm text-neutral-800"
                    >
                      No promissory notes awaiting review.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
