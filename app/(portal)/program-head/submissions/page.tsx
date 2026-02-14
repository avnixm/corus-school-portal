import Link from "next/link";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { getProgramHeadScopePrograms } from "@/lib/programHead/scope";
import { listGradeSubmissionsProgramHead } from "@/lib/programHead/queries";
import { getSchoolYearsList, getTermsBySchoolYearId, getActiveSchoolYear, getGradingPeriodsBySchoolYearTerm } from "@/db/queries";
import { db } from "@/lib/db";
import { subjects } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmissionsFilters } from "./SubmissionsFilters";


export const dynamic = "force-dynamic";

async function getSubjectsList() {
  try {
    return await db.select({ id: subjects.id, code: subjects.code }).from(subjects).orderBy(subjects.code);
  } catch {
    return [];
  }
}

function statusClass(s: string) {
  const map: Record<string, string> = {
    draft: "bg-neutral-200 text-neutral-800",
    submitted: "bg-amber-100 text-amber-800",
    returned: "bg-red-100 text-red-800",
    approved: "bg-blue-100 text-blue-800",
    released: "bg-green-100 text-green-800",
  };
  return map[s] ?? "bg-neutral-100 text-neutral-800";
}

export default async function ProgramHeadSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    schoolYearId?: string;
    termId?: string;
    gradingPeriodId?: string;
    subjectId?: string;
    sectionId?: string;
    status?: string;
  }>;
}) {
  const user = await getCurrentUserWithRole();
  if (!user) return null;
  const scope = await getProgramHeadScopePrograms(user.userId);
  const params = await searchParams;
  const schoolYears = await getSchoolYearsList();
  const activeSy = await getActiveSchoolYear();
  const terms = params.schoolYearId
    ? await getTermsBySchoolYearId(params.schoolYearId)
    : activeSy
    ? await getTermsBySchoolYearId(activeSy.id)
    : [];
  const syId = params.schoolYearId ?? activeSy?.id;
  const termId = params.termId;
  const gradingPeriods =
    syId && termId ? await getGradingPeriodsBySchoolYearTerm(syId, termId) : [];
  const subjectsList = await getSubjectsList();

  if (scope === null || scope.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Grade Submissions
        </h2>
        <p className="text-neutral-800">
          Set your program scope in{" "}
          <Link href="/program-head/settings" className="font-medium text-[#6A0000] underline">
            Settings
          </Link>{" "}
          first.
        </p>
      </div>
    );
  }

  const rows = await listGradeSubmissionsProgramHead(scope, {
    schoolYearId: syId ?? undefined,
    termId: termId ?? undefined,
    gradingPeriodId: params.gradingPeriodId,
    subjectId: params.subjectId,
    sectionId: params.sectionId,
    status: params.status,
  });

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Grade Submissions
        </h2>
        <p className="mt-1 text-sm text-neutral-800">
          Monitor teacher completion status. Read-only; approve in Registrar.
        </p>
      </section>

      <SubmissionsFilters
        schoolYears={schoolYears}
        terms={terms}
        gradingPeriods={gradingPeriods}
        subjects={subjectsList}
        current={{
          schoolYearId: syId,
          termId,
          gradingPeriodId: params.gradingPeriodId,
          subjectId: params.subjectId,
          sectionId: params.sectionId,
          status: params.status,
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">
            Submissions ({rows.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border bg-white/80 text-sm">
            <table className="min-w-full">
              <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2 text-left">Subject</th>
                  <th className="px-4 py-2 text-left">Section</th>
                  <th className="px-4 py-2 text-left">Period</th>
                  <th className="px-4 py-2 text-left">Teacher</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-right">Submitted</th>
                  <th className="px-4 py-2 text-right">Updated</th>
                  <th className="px-4 py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="px-4 py-2">{s.subjectCode}</td>
                    <td className="px-4 py-2">{s.sectionName}</td>
                    <td className="px-4 py-2">{s.gradingPeriodName}</td>
                    <td className="px-4 py-2">
                      {s.teacherFirstName} {s.teacherLastName}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`rounded px-2 py-0.5 text-xs ${statusClass(s.status)}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-neutral-600">
                      {s.submittedAt
                        ? new Date(s.submittedAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-right text-neutral-600">
                      {s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/registrar/grades/${s.id}`}
                        className="text-xs font-medium text-[#6A0000] hover:underline"
                      >
                        View (Registrar)
                      </Link>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-neutral-600">
                      No submissions found.
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
