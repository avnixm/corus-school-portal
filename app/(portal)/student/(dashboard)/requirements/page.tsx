import { getCurrentStudent } from "@/lib/auth/getCurrentStudent";
import { getEnrollmentForStudentActiveTerm } from "@/db/queries";
import { getApplicableRequirements } from "@/lib/requirements/getApplicableRequirements";
import { getEnrollmentRequirementsPolicy } from "@/lib/requirements/policy";
import { ensureEnrollmentRequirementSubmissions } from "@/lib/requirements/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StudentRequirementsClient } from "./StudentRequirementsClient";

export const dynamic = "force-dynamic";

export default async function StudentRequirementsPage() {
  const current = await getCurrentStudent();
  if (!current) redirect("/student");

  const enrollment = await getEnrollmentForStudentActiveTerm(current.studentId);
  const enrollmentId = enrollment?.id ?? null;
  const program = enrollment?.program ?? null;
  const yearLevel = enrollment?.yearLevel ?? null;
  const schoolYearId = enrollment?.schoolYearId ?? null;
  const termId = enrollment?.termId ?? null;

  if (!enrollment) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">Forms & Requirements</h2>
          <p className="text-sm text-neutral-700">
            Requirements are tied to your enrollment. Start an enrollment for the current term first.
          </p>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-neutral-600">
            <p>No active enrollment for the current term.</p>
            <Link href="/student/enrollment" className="mt-2 inline-block font-medium text-[#6A0000] hover:underline">
              Go to enrollment →
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (enrollment?.id) await ensureEnrollmentRequirementSubmissions(enrollment.id);
  const applicable = await getApplicableRequirements({
    studentId: current.studentId,
    enrollmentId,
    appliesTo: "enrollment",
    program,
    yearLevel,
    schoolYearId,
    termId,
  });

  const policy = await getEnrollmentRequirementsPolicy(applicable);
  const required = applicable.filter((a) => a.rule.isRequired);
  const verifiedCount = required.filter((a) => a.submission.status === "verified").length;
  const totalRequired = required.length;
  const progress = totalRequired > 0 ? Math.round((verifiedCount / totalRequired) * 100) : 100;
  const blocking = [...policy.missingRequired, ...policy.unverifiedRequired];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Forms & Requirements
        </h2>
        <p className="text-sm text-neutral-700">
          Submit and track required documents for enrollment.
        </p>
      </div>

      <Card className="border-[#6A0000]/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#6A0000]">
            Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#6A0000]">
              {verifiedCount} / {totalRequired || 1} verified
            </span>
            <span className="text-sm text-neutral-600">{progress}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
          {blocking.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
              <p className="font-medium text-amber-800">Blocking items:</p>
              <ul className="mt-1 list-inside list-disc text-amber-700">
                {blocking.map((b) => (
                  <li key={b.submission.id}>{b.requirement.name}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <StudentRequirementsClient
        items={applicable}
        enrollmentId={enrollmentId}
      />
    </div>
  );
}
