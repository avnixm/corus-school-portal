import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SchedulesRedirect({
  searchParams,
}: {
  searchParams: Promise<{
    schoolYearId?: string;
    termId?: string;
    sectionId?: string;
    programId?: string;
    yearLevel?: string;
  }>;
}) {
  const params = await searchParams;
  const q = new URLSearchParams();
  q.set("view", "schedules");
  if (params.schoolYearId) q.set("schoolYearId", params.schoolYearId);
  if (params.termId) q.set("termId", params.termId);
  if (params.sectionId) q.set("sectionId", params.sectionId);
  if (params.programId) q.set("programId", params.programId);
  if (params.yearLevel) q.set("yearLevel", params.yearLevel);
  redirect(`/program-head/scheduling?${q.toString()}`);
}
