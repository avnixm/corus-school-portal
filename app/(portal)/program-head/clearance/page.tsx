import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ClearanceRedirect({
  searchParams,
}: {
  searchParams: Promise<{
    schoolYearId?: string;
    termId?: string;
    yearLevel?: string;
    status?: string;
  }>;
}) {
  const params = await searchParams;
  const q = new URLSearchParams();
  q.set("view", "clearance");
  if (params.schoolYearId) q.set("schoolYearId", params.schoolYearId);
  if (params.termId) q.set("termId", params.termId);
  if (params.yearLevel) q.set("yearLevel", params.yearLevel);
  if (params.status) q.set("status", params.status);
  redirect(`/program-head/finance?${q.toString()}`);
}
