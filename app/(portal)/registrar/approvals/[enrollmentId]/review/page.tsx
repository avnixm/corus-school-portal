import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getEnrollmentById,
  getStudentById,
  getUserProfileByUserId,
  getSchoolYearsList,
  getTermsList,
  getRequirementRequestsByEnrollment,
} from "@/db/queries";
import { getApplicableRequirements } from "@/lib/requirements/getApplicableRequirements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth/server";
import { EnrollmentReviewContent } from "./EnrollmentReviewContent";


export const dynamic = "force-dynamic";

function fullName(row: { firstName: string; middleName?: string | null; lastName: string }) {
  return [row.firstName, row.middleName, row.lastName].filter(Boolean).join(" ");
}

export const metadata = { title: "Enrollment Review" };

export default async function EnrollmentReviewPage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) notFound();
  const profile = await getUserProfileByUserId(session.user.id);
  if (!profile || (profile.role !== "registrar" && profile.role !== "admin")) notFound();

  const { enrollmentId } = await params;
  const enrollment = await getEnrollmentById(enrollmentId);
  if (!enrollment || enrollment.status !== "pending_approval") notFound();

  const [student, schoolYears, terms] = await Promise.all([
    getStudentById(enrollment.studentId),
    getSchoolYearsList(),
    getTermsList(),
  ]);
  if (!student) notFound();

  const schoolYearName = schoolYears.find((sy) => sy.id === enrollment.schoolYearId)?.name ?? "—";
  const termName = terms.find((t) => t.id === enrollment.termId)?.name ?? "—";

  const [applicable, requests] = await Promise.all([
    getApplicableRequirements({
      studentId: enrollment.studentId,
      enrollmentId: enrollment.id,
      appliesTo: "enrollment",
      program: enrollment.program,
      yearLevel: enrollment.yearLevel,
      schoolYearId: enrollment.schoolYearId,
      termId: enrollment.termId,
    }),
    getRequirementRequestsByEnrollment(enrollment.id),
  ]);

  const pendingRequestSubmissionIds = new Set(
    requests.filter((r) => r.status === "pending").map((r) => r.submissionId)
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/registrar/approvals"
          className="text-sm text-[#6A0000] hover:underline"
        >
          ← Back to enrollment approvals
        </Link>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#6A0000]">
          Review requirements
        </h2>
        <p className="text-sm text-neutral-800">
          <Link
            href={`/registrar/students/${student.id}`}
            className="font-medium text-[#6A0000] hover:underline"
          >
            {fullName(student)}
          </Link>
          {student.studentCode && (
            <span className="ml-1 text-neutral-600">({student.studentCode})</span>
          )}
          {" · "}
          {schoolYearName} • {termName} · {enrollment.program ?? "—"} Year {enrollment.yearLevel ?? "—"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-[#6A0000]">
            Requirement documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EnrollmentReviewContent
            enrollmentId={enrollmentId}
            applicable={applicable}
            pendingRequestSubmissionIds={Array.from(pendingRequestSubmissionIds)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
