import { getCurrentStudent } from "@/lib/auth/getCurrentStudent";
import {
  getEnrollmentForStudentActiveTerm,
  getActiveSchoolYear,
  getActiveTerm,
  getEnrollmentApprovalByEnrollmentId,
  getEnrollmentsByStudentId,
} from "@/db/queries";
import { getProgramsList, getSectionsList } from "@/db/queries";
import { getApplicableRequirements } from "@/lib/requirements/getApplicableRequirements";
import { getEnrollmentRequirementsPolicy } from "@/lib/requirements/policy";
import { ensureEnrollmentRequirementSubmissions } from "@/lib/requirements/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { redirect } from "next/navigation";
import Link from "next/link";
import { EnrollmentWizard } from "@/app/(portal)/student/(dashboard)/enrollment/EnrollmentWizard";
import { EnrollmentStatusActions } from "@/app/(portal)/student/(dashboard)/enrollment/EnrollmentStatusActions";
import { NewEnrollmentButton } from "@/app/(portal)/student/(dashboard)/enrollment/NewEnrollmentButton";

export const dynamic = "force-dynamic";

export default async function StudentEnrollmentPage() {
  const current = await getCurrentStudent();
  if (!current) redirect("/student");

  const [sy, term] = await Promise.all([getActiveSchoolYear(), getActiveTerm()]);
  if (!sy || !term) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">Enrollment</h2>
        <Card>
          <CardContent className="py-8 text-center text-neutral-600">
            <p>No active school year or term is set. Enrollment will open when the registrar activates a term.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const enrollment = await getEnrollmentForStudentActiveTerm(current.studentId);

  if (!enrollment) {
    const [programs, sections] = await Promise.all([
      getProgramsList(true),
      getSectionsList(),
    ]);
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">Enrollment</h2>
          <p className="text-sm text-neutral-700">
            Start your enrollment for the current term. You can save a draft and submit when requirements are ready.
          </p>
        </div>
        <EnrollmentWizard
          schoolYearName={sy.name}
          termName={term.name}
          programs={programs.map((p) => ({ id: p.id, code: p.code, name: p.name }))}
          sections={sections.map((s) => ({
            id: s.id,
            name: s.name,
            yearLevel: s.yearLevel ?? null,
            programId: s.programId ?? null,
            programCode: s.programCode ?? null,
          }))}
        />
      </div>
    );
  }

  await ensureEnrollmentRequirementSubmissions(enrollment.id);
  const [applicable, allEnrollments] = await Promise.all([
    getApplicableRequirements({
      studentId: current.studentId,
      enrollmentId: enrollment.id,
      appliesTo: "enrollment",
      program: enrollment.program,
      yearLevel: enrollment.yearLevel,
      schoolYearId: enrollment.schoolYearId,
      termId: enrollment.termId,
    }),
    getEnrollmentsByStudentId(current.studentId),
  ]);
  const policy = await getEnrollmentRequirementsPolicy(applicable);
  const approval = await getEnrollmentApprovalByEnrollmentId(enrollment.id);

  const status = enrollment.status;
  const isRejected = status === "rejected";
  const isPending = status === "pending_approval";
  const isDraft = status === "preregistered";
  const isApproved = status === "approved" || status === "enrolled";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">Enrollment</h2>
        <p className="text-sm text-neutral-700">
          {enrollment.schoolYearName} · {enrollment.termName}
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#6A0000]">Enrollment current</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={isApproved ? "default" : "outline"}
              className={
                isApproved
                  ? "bg-[#6A0000]"
                  : isRejected
                    ? "bg-red-100 text-red-800 border-red-200"
                    : ""
              }
            >
              {status.replace(/_/g, " ")}
            </Badge>
            <span className="text-sm text-neutral-600">
              {enrollment.program ?? "—"} · Year {enrollment.yearLevel ?? "—"}
            </span>
          </div>

          {isPending && (
            <p className="text-sm text-amber-800">
              Wait for registrar review. You will see an update here once your enrollment is processed.
              You can add or update requirement documents on the{" "}
              <Link href="/student/requirements" className="font-medium text-[#6A0000] hover:underline">
                Forms &amp; Requirements
              </Link>{" "}
              page while waiting.
            </p>
          )}
          {isRejected && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <p className="font-medium">Registrar remarks</p>
              <p className="mt-1">{approval?.remarks ?? "No reason provided. Please contact the registrar for details."}</p>
              <p className="mt-2 text-red-700">
                Fix the issues above, then start a new enrollment to resubmit.
              </p>
              <NewEnrollmentButton enrollmentId={enrollment.id} />
            </div>
          )}
          {isApproved && (
            <p className="text-sm text-green-800">
              Proceed to <Link href="/student/billing" className="font-medium text-[#6A0000] hover:underline">billing</Link> for assessment and payment.
            </p>
          )}

          {isDraft && (
            <EnrollmentStatusActions
              enrollmentId={enrollment.id}
              canSubmit={policy.canSubmit}
              policyMessage={policy.message}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#6A0000]">Enrollment history</CardTitle>
        </CardHeader>
        <CardContent>
          {allEnrollments.length === 0 ? (
            <p className="text-sm text-neutral-600">No enrollments yet.</p>
          ) : (
            <ul className="space-y-2">
              {allEnrollments.map((enc) => {
                const isCurrent = enc.id === enrollment.id;
                return (
                  <li
                    key={enc.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-neutral-50/50 px-3 py-2 text-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-neutral-900">
                        {enc.schoolYearName} · {enc.termName}
                      </span>
                      {isCurrent && (
                        <Badge variant="secondary" className="bg-[#6A0000]/10 text-[#6A0000]">
                          Current
                        </Badge>
                      )}
                      <span className="text-neutral-600">
                        {enc.program ?? "—"} · Year {enc.yearLevel ?? "—"}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        enc.status === "approved" || enc.status === "enrolled"
                          ? "border-green-300 text-green-800"
                          : enc.status === "rejected"
                            ? "border-red-200 text-red-800"
                            : ""
                      }
                    >
                      {enc.status.replace(/_/g, " ")}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
