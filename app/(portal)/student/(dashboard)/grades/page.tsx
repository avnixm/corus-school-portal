// path: app/(portal)/student/grades/page.tsx
import {
  getEnrollmentForStudentActiveTerm,
  getReleasedGradesByStudentAndEnrollment,
} from "@/db/queries";
import { getCurrentStudent } from "@/lib/auth/getCurrentStudent";
import { getEnrolledStudentMissingRequiredFormNames } from "@/lib/requirements/progress";
import { redirect } from "next/navigation";

export const metadata = { title: "Grades" };

export default async function GradesPage() {
  const current = await getCurrentStudent();
  const studentId = current?.studentId;

  if (!studentId) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">Grades</h2>
        <p className="text-sm text-neutral-700">Sign in and complete your profile to view grades.</p>
      </div>
    );
  }

  const enrollment = await getEnrollmentForStudentActiveTerm(studentId);
  if (enrollment) {
    const isApproved =
      enrollment.status === "approved" || enrollment.status === "enrolled";
    if (isApproved) {
      const missingFormNames = await getEnrolledStudentMissingRequiredFormNames(enrollment.id);
      if (missingFormNames.length > 0) {
        redirect("/student/requirements?required=1");
      }
    }
  }
  const grades = enrollment
    ? await getReleasedGradesByStudentAndEnrollment(studentId, enrollment.id)
    : [];

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">Grades</h2>
        <p className="text-sm text-neutral-700">
          Released grades for your current enrollment. Only grades approved and released by the registrar are shown.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white/80 text-neutral-900">
        <table className="min-w-full text-left text-sm text-neutral-900">
          <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
            <tr>
              <th className="px-4 py-2">Subject</th>
              <th className="px-4 py-2">Description</th>
              <th className="px-4 py-2">Period</th>
              <th className="px-4 py-2 text-right">Grade</th>
              <th className="px-4 py-2">Letter</th>
              <th className="px-4 py-2">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {grades.map((row, idx) => (
              <tr
                key={idx}
                className="border-b last:border-0 hover:bg-neutral-50/80"
              >
                <td className="px-4 py-2 font-medium text-[#6A0000]">
                  {row.subjectCode ?? "—"}
                </td>
                <td className="px-4 py-2">
                  {row.subjectDescription ?? "—"}
                </td>
                <td className="px-4 py-2 text-neutral-700">
                  {row.gradingPeriodName ?? "—"}
                </td>
                <td className="px-4 py-2 text-right font-semibold text-[#6A0000]">
                  {row.numericGrade ?? "—"}
                </td>
                <td className="px-4 py-2">{row.letterGrade ?? "—"}</td>
                <td className="px-4 py-2 text-neutral-600">{row.remarks ?? "—"}</td>
              </tr>
            ))}
            {grades.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-neutral-700"
                >
                  {!enrollment
                    ? "No active enrollment for the current term."
                    : "Grades not released yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
