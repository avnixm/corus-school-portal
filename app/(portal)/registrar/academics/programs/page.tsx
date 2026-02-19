import { AcademicsShell } from "../AcademicsShell";
import { ProgramsTab, type AcademicsSearchParams } from "../AcademicsTabs";

export const dynamic = "force-dynamic";

export const metadata = { title: "Programs — Academics" };

type SearchParams = Promise<AcademicsSearchParams>;

export default async function AcademicsProgramsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  return (
    <AcademicsShell activeTab="programs">
      <ProgramsTab params={params} />
    </AcademicsShell>
  );
}
