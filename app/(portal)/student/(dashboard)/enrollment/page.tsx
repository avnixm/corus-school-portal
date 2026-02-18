import { getCurrentStudent } from "@/lib/auth/getCurrentStudent";
import {
  getEnrollmentForStudentActiveTerm,
  getActiveSchoolYear,
  getActiveTerm,
  getEnrollmentApprovalByEnrollmentId,
  getEnrollmentsByStudentId,
} from "@/db/queries";
import { getProgramsList } from "@/db/queries";
import { getApplicableRequirements } from "@/lib/requirements/getApplicableRequirements";
import { getEnrollmentRequirementsPolicy } from "@/lib/requirements/policy";
import { ensureEnrollmentRequirementSubmissions } from "@/lib/requirements/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import Link from "next/link";
import { EnrollmentWizard } from "@/app/(portal)/student/(dashboard)/enrollment/EnrollmentWizard";
import { EnrollmentStatusActions } from "@/app/(portal)/student/(dashboard)/enrollment/EnrollmentStatusActions";
import { NewEnrollmentButton } from "@/app/(portal)/student/(dashboard)/enrollment/NewEnrollmentButton";
import { formatStatusForDisplay } from "@/lib/formatStatus";

export const dynamic = "force-dynamic";

export const metadata = { title: "Enrollment" };

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
    const programs = await getProgramsList(true);
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
                  ? "bg-[#6A0000] text-white uppercase"
                  : isRejected
                    ? "bg-red-100 text-red-800 border-red-200 uppercase"
                    : "uppercase"
              }
            >
              {status.replace(/_/g, " ")}
            </Badge>
            <span className="text-sm text-neutral-600">
              {enrollment.program ?? "—"} · {enrollment.schoolYearName ?? "—"} · {enrollment.yearLevel ?? "—"}
            </span>
          </div>

          {isPending && (
            <div className="space-y-3">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                <p className="font-medium">Enrollment submitted for review</p>
                <p className="mt-1 text-blue-800">
                  Your enrollment is being reviewed by the Registrar&apos;s Office. This usually takes 1–3 business days.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/student/requirements">
                  <Button size="sm" variant="outline" className="border-[#6A0000] text-[#6A0000] hover:bg-[#6A0000]/5">
                    Update documents →
                  </Button>
                </Link>
                <p className="text-xs text-neutral-600">
                  You can add or verify required forms while waiting
                </p>
              </div>
            </div>
          )}
          {isRejected && (
            <div className="space-y-3">
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <p className="font-semibold text-red-900">Your enrollment was not approved</p>
                <p className="mt-2 font-medium">Registrar&apos;s feedback:</p>
                <p className="mt-1 text-red-900">{approval?.remarks ?? "No specific reason provided. Please contact the Registrar's Office for details."}</p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <p className="font-medium">Next steps:</p>
                <ol className="mt-2 list-inside list-decimal space-y-1 text-amber-800">
                  <li>Review the feedback above</li>
                  <li>Fix any missing or incorrect requirements on the <Link href="/student/requirements" className="font-medium text-[#6A0000] hover:underline">Forms &amp; Requirements</Link> page</li>
                  <li>Click the button below to start a new enrollment and resubmit</li>
                </ol>
              </div>
              <NewEnrollmentButton enrollmentId={enrollment.id} />
            </div>
          )}
          {isApproved && (
            <p className="text-sm text-green-800">
              Proceed to <Link href="/student/billing" className="font-medium text-[#6A0000] hover:underline">billing</Link> for assessment and payment.
            </p>
          )}

          {isDraft && (
            <div className="space-y-3">
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm">
                <p className="font-medium text-neutral-900">Requirements status</p>
                <p className="mt-1 text-neutral-700">
                  {applicable.filter(r => r.submission.status === "verified").length} of{" "}
                  {applicable.filter(r => r.rule.isRequired).length} required forms verified
                </p>
                {!policy.canSubmit && (
                  <p className="mt-2 text-sm text-amber-800">
                    {policy.message}
                  </p>
                )}
              </div>
              <EnrollmentStatusActions
                enrollmentId={enrollment.id}
                canSubmit={policy.canSubmit}
                policyMessage={policy.canSubmit ? undefined : "Complete required forms before submitting"}
              />
            </div>
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
                        <Badge variant="secondary" className="bg-[#6A0000]/10 text-[#6A0000] uppercase">
                          Current
                        </Badge>
                      )}
                      <span className="text-neutral-600">
                        {enc.program ?? "—"} · {enc.schoolYearName ?? "—"} · {enc.yearLevel ?? "—"}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        enc.status === "approved" || enc.status === "enrolled"
                          ? "border-green-300 text-green-800 uppercase"
                          : enc.status === "rejected"
                            ? "border-red-200 text-red-800 uppercase"
                            : "uppercase"
                      }
                    >
                      {formatStatusForDisplay(enc.status)}
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
