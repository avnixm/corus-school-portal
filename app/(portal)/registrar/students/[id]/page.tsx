import { notFound } from "next/navigation";
import Link from "next/link";
import { formatStatusForDisplay } from "@/lib/formatStatus";
import {
  getStudentById,
  getEnrollmentsByStudentId,
  getEnrollmentById,
  getRequirementRequestsByEnrollment,
} from "@/db/queries";
import { getApplicableRequirements } from "@/lib/requirements/getApplicableRequirements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EditStudentForm } from "../EditStudentForm";
import { DeleteStudentButton } from "../DeleteStudentButton";
import { EnrollmentReviewContent } from "@/app/(portal)/registrar/approvals/[enrollmentId]/review/EnrollmentReviewContent";

export const dynamic = "force-dynamic";

function fullName(row: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
}) {
  return [row.firstName, row.middleName, row.lastName].filter(Boolean).join(" ");
}

export const metadata = { title: "Student" };

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = await getStudentById(id);
  if (!student) notFound();

  const enrollments = await getEnrollmentsByStudentId(id);
  const latestEnrollment = enrollments.length > 0 ? await getEnrollmentById(enrollments[0].id) : null;
  const [applicable, requirementRequests] =
    latestEnrollment != null
      ? await Promise.all([
          getApplicableRequirements({
            studentId: id,
            enrollmentId: latestEnrollment.id,
            appliesTo: "enrollment",
            program: latestEnrollment.program,
            yearLevel: latestEnrollment.yearLevel,
            schoolYearId: latestEnrollment.schoolYearId,
            termId: latestEnrollment.termId,
          }),
          getRequirementRequestsByEnrollment(latestEnrollment.id),
        ])
      : [[], []];
  const pendingRequestSubmissionIds = requirementRequests
    .filter((r) => r.status === "pending")
    .map((r) => r.submissionId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/registrar/records/students"
            className="text-sm font-medium text-[#6A0000] hover:underline"
          >
            ← Back to students
          </Link>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#6A0000]">
            {fullName(student)}
          </h2>
        </div>
        <div className="flex gap-2">
          <EditStudentForm student={student} />
          <DeleteStudentButton studentId={id} studentName={fullName(student)} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-[#6A0000]">
            Student Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-neutral-900">
          <p>
            <span className="text-neutral-700">Student No:</span>{" "}
            <span className="text-neutral-900">{student.studentCode ?? "—"}</span>
          </p>
          <p>
            <span className="text-neutral-700">Name:</span>{" "}
            <span className="text-neutral-900">{fullName(student)}</span>
          </p>
          <p>
            <span className="text-neutral-700">Email:</span>{" "}
            <span className="text-neutral-900">{student.email ?? "—"}</span>
          </p>
          <p>
            <span className="text-neutral-700">Contact:</span>{" "}
            <span className="text-neutral-900">{student.contactNo ?? "—"}</span>
          </p>
          <p>
            <span className="text-neutral-700">Program:</span>{" "}
            <span className="text-neutral-900">
              {latestEnrollment?.program ?? student.program ?? "—"}
            </span>
          </p>
          <p>
            <span className="text-neutral-700">Year Level:</span>{" "}
            <span className="text-neutral-900">
              {latestEnrollment?.yearLevel ?? student.yearLevel ?? "—"}
            </span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-[#6A0000]">
            Enrollment History
          </CardTitle>
          <Link href={`/registrar/records/enrollments?studentId=${id}`}>
            <Button size="sm" variant="outline">
              Add enrollment
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border bg-white/80 text-neutral-900">
            <table className="min-w-full text-left text-sm text-neutral-900">
              <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2">School Year</th>
                  <th className="px-4 py-2">Term</th>
                  <th className="px-4 py-2">Program</th>
                  <th className="px-4 py-2">Year Level</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b last:border-0 hover:bg-neutral-50/80"
                  >
                    <td className="px-4 py-2">{row.schoolYearName}</td>
                    <td className="px-4 py-2">{row.termName}</td>
                    <td className="px-4 py-2">{row.program ?? "—"}</td>
                    <td className="px-4 py-2">{row.yearLevel ?? "—"}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs uppercase ${
                          row.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : row.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {formatStatusForDisplay(row.status)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-neutral-800">
                      {row.createdAt
                        ? new Date(row.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
                {enrollments.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm text-neutral-800"
                    >
                      No enrollments yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-[#6A0000]">
            Forms
          </CardTitle>
          {latestEnrollment && (
            <Link href={`/registrar/approvals/${latestEnrollment.id}/review`}>
              <Button size="sm" variant="outline">
                Open in enrollment review
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {latestEnrollment ? (
            <EnrollmentReviewContent
              enrollmentId={latestEnrollment.id}
              applicable={applicable}
              pendingRequestSubmissionIds={pendingRequestSubmissionIds}
            />
          ) : (
            <p className="text-sm text-neutral-600">
              Add an enrollment above to see and approve requirement forms here (same as when a student enrolls).
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
