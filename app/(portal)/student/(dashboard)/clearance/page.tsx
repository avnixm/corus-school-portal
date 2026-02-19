import { getCurrentStudent } from "@/lib/auth/getCurrentStudent";
import { getEnrollmentForStudentActiveTerm } from "@/db/queries";
import {
  getGradingPeriodsBySchoolYearAndTerm,
  listClearanceForStudent,
} from "@/lib/clearance/queries";
import { ClearanceTabs } from "./ClearanceTabs";

export const dynamic = "force-dynamic";
export const metadata = { title: "Clearance" };

export default async function StudentClearancePage() {
  const current = await getCurrentStudent();
  if (!current) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">Clearance</h2>
        <p className="text-sm text-neutral-700">
          Sign in and complete your profile to view clearance.
        </p>
      </div>
    );
  }

  const enrollment = await getEnrollmentForStudentActiveTerm(current.studentId);
  if (!enrollment) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">Clearance</h2>
        <p className="text-sm text-neutral-700">
          You have no active enrollment for the current term. Clearance is available after each
          grading period (Prelim, Midterm, Finals) for your enrolled term.
        </p>
      </div>
    );
  }

  const periods = await getGradingPeriodsBySchoolYearAndTerm(
    enrollment.schoolYearId,
    enrollment.termId
  );
  const clearanceList = await listClearanceForStudent(
    current.studentId,
    enrollment.schoolYearId,
    enrollment.termId
  );

  const clearanceByPeriod = new Map(clearanceList.map((r) => [r.periodId, r]));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">Clearance</h2>
        <p className="text-sm text-neutral-700">
          Secure clearance from each office after each grading period. Print the form and get
          signatures.
        </p>
      </div>

      {periods.length === 0 ? (
        <div className="rounded-xl border bg-white p-6 text-center text-sm text-neutral-600">
          No grading periods defined for this term yet.
        </div>
      ) : (
        <ClearanceTabs
          enrollmentId={enrollment.id}
          periods={periods.map((p) => ({ id: p.id, name: p.name }))}
          clearanceByPeriod={clearanceByPeriod}
          schoolYearName={enrollment.schoolYearName ?? ""}
          termName={enrollment.termName ?? ""}
        />
      )}
    </div>
  );
}
