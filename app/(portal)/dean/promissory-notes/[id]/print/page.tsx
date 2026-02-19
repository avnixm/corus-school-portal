import { notFound } from "next/navigation";
import Link from "next/link";
import { getPromissoryNote } from "@/lib/clearance/queries";
import { requireRole } from "@/lib/rbac";
import { PromissoryNotePrint } from "@/components/clearance/PromissoryNotePrint";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Promissory Note (Print)" };

export default async function DeanPromissoryNotePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const auth = await requireRole(["dean", "admin"]);
  if ("error" in auth) notFound();

  const note = await getPromissoryNote(id);
  if (!note) notFound();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link
          href="/dean/promissory-notes"
          className="text-sm font-medium text-[#6A0000] hover:underline"
        >
          ← Promissory notes
        </Link>
        <PrintButton />
      </div>
      <div className="overflow-x-auto print:overflow-visible">
        <PromissoryNotePrint
          studentName={note.studentName}
          studentCode={note.studentCode}
          program={note.program}
          yearLevel={note.yearLevel}
          schoolYearName={note.schoolYearName}
          termName={note.termName}
          periodName={note.periodName}
          amountPromised={note.amountPromised}
          dueDate={note.dueDate}
          reason={note.reason}
          financeRemarks={note.financeRemarks}
          status={note.status}
          submittedAt={note.submittedAt?.toISOString() ?? null}
          deanApproved={note.status === "approved" ? true : note.status === "rejected" ? false : null}
          deanAt={note.deanAt?.toISOString() ?? null}
          deanRemarks={note.deanRemarks}
          referenceNo={note.id.slice(0, 8)}
        />
      </div>
    </div>
  );
}
