import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ClassManagementRedirect({
  searchParams,
}: {
  searchParams: Promise<{ schoolYearId?: string; termId?: string }>;
}) {
  const params = await searchParams;
  const q = new URLSearchParams();
  if (params.schoolYearId) q.set("schoolYearId", params.schoolYearId);
  if (params.termId) q.set("termId", params.termId);
  redirect(`/program-head/sections${q.toString() ? `?${q.toString()}` : ""}`);
}
