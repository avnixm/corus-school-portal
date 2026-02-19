import { AcademicsShell } from "../AcademicsShell";
import { SectionsTab, type AcademicsSearchParams } from "../AcademicsTabs";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sections — Academics" };

type SearchParams = Promise<AcademicsSearchParams>;

export default async function AcademicsSectionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  return (
    <AcademicsShell activeTab="sections">
      <SectionsTab params={params} basePath="/registrar/academics/sections" />
    </AcademicsShell>
  );
}
