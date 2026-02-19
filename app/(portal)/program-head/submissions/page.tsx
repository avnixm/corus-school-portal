import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function GradeSubmissionsRedirect({
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
  const params = await searchParams;
  const q = new URLSearchParams();
  q.set("view", "submissions");
  if (params.schoolYearId) q.set("schoolYearId", params.schoolYearId);
  if (params.termId) q.set("termId", params.termId);
  if (params.gradingPeriodId) q.set("gradingPeriodId", params.gradingPeriodId);
  if (params.subjectId) q.set("subjectId", params.subjectId);
  if (params.sectionId) q.set("sectionId", params.sectionId);
  if (params.status) q.set("status", params.status);
  redirect(`/program-head/grades?${q.toString()}`);
}
