import {
  getApprovedEnrollmentsNeedingAssessment,
  getAssessmentsList,
} from "@/lib/finance/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateAssessmentForm } from "./CreateAssessmentForm";
import { PostAssessmentButton } from "./PostAssessmentButton";

export const dynamic = "force-dynamic";

function fullName(r: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
}) {
  return [r.firstName, r.middleName, r.lastName].filter(Boolean).join(" ");
}

export default async function AssessmentsPage() {
  const [enrollmentsNeedingAssessment, assessments] = await Promise.all([
    getApprovedEnrollmentsNeedingAssessment(),
    getAssessmentsList(),
  ]);

  const enrollmentOptions = enrollmentsNeedingAssessment.map((e) => ({
    id: e.id,
    studentCode: e.studentCode,
    firstName: e.firstName,
    middleName: e.middleName,
    lastName: e.lastName,
    schoolYearName: e.schoolYearName,
    termName: e.termName,
    program: e.program,
    yearLevel: e.yearLevel,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Assessments
        </h2>
        <p className="text-sm text-neutral-800">
          Create and post assessments for approved enrollments.
        </p>
      </div>

      <CreateAssessmentForm enrollments={enrollmentOptions} />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">
            Assessments ({assessments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border bg-white/80 text-neutral-900">
            <table className="min-w-full text-left text-sm text-neutral-900">
              <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2">Student</th>
                  <th className="px-4 py-2">SY / Term</th>
                  <th className="px-4 py-2">Program</th>
                  <th className="px-4 py-2">Total</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b last:border-0 hover:bg-neutral-50/80"
                  >
                    <td className="px-4 py-2">
                      {row.studentCode} – {fullName(row)}
                    </td>
                    <td className="px-4 py-2">
                      {row.schoolYearName} / {row.termName}
                    </td>
                    <td className="px-4 py-2">
                      {row.program ?? "—"} {row.yearLevel ?? ""}
                    </td>
                    <td className="px-4 py-2">
                      ₱{parseFloat(row.total).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          row.status === "posted"
                            ? "bg-green-100 text-green-800"
                            : row.status === "draft"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-neutral-200 text-neutral-800"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      {row.status === "draft" && (
                        <PostAssessmentButton assessmentId={row.id} />
                      )}
                    </td>
                  </tr>
                ))}
                {assessments.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm text-neutral-800"
                    >
                      No assessments yet.
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
