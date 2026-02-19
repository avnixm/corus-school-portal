import { notFound } from "next/navigation";
import Link from "next/link";
import { getEnrollmentById } from "@/db/queries";
import {
  getGradingPeriodsBySchoolYearAndTerm,
  getOrCreateClearanceRequest,
} from "@/lib/clearance/queries";
import { getStudentById } from "@/db/queries";
import { requireRole } from "@/lib/rbac";
import { CreatePromissoryNoteForm } from "./CreatePromissoryNoteForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Create Promissory Note" };

export default async function NewPromissoryNotePage({
  params,
  searchParams,
}: {
  params: Promise<{ enrollmentId: string }>;
  searchParams: Promise<{ periodId?: string }>;
}) {
  const { enrollmentId } = await params;
  const { periodId: queryPeriodId } = await searchParams;

  const auth = await requireRole(["finance", "admin"]);
  if ("error" in auth) notFound();

  const enrollment = await getEnrollmentById(enrollmentId);
  if (!enrollment) notFound();

  const [student, periods] = await Promise.all([
    getStudentById(enrollment.studentId),
    getGradingPeriodsBySchoolYearAndTerm(enrollment.schoolYearId, enrollment.termId),
  ]);
  if (!student) notFound();

  const defaultPeriodId = queryPeriodId ?? periods[0]?.id ?? "";
  if (defaultPeriodId) {
    await getOrCreateClearanceRequest(enrollmentId, defaultPeriodId);
  }
  const studentName = [student.firstName, student.middleName, student.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/finance/clearance"
          className="text-sm font-medium text-[#6A0000] hover:underline"
        >
          ← Clearance
        </Link>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#6A0000]">
          Create Promissory Note
        </h2>
        <p className="mt-1 text-sm text-neutral-800">
          {student.studentCode} – {studentName} · {enrollment.program ?? "—"} {enrollment.yearLevel ?? ""}
        </p>
      </div>

      <CreatePromissoryNoteForm
        enrollmentId={enrollmentId}
        studentId={enrollment.studentId}
        periods={periods.map((p) => ({ id: p.id, name: p.name }))}
        defaultPeriodId={defaultPeriodId}
      />
    </div>
  );
}
