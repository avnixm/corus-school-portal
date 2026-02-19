import { AcademicsShell } from "../AcademicsShell";
import { SubjectsTab, type AcademicsSearchParams } from "../AcademicsTabs";

export const dynamic = "force-dynamic";

export const metadata = { title: "Subjects — Academics" };

type SearchParams = Promise<AcademicsSearchParams>;

export default async function AcademicsSubjectsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  return (
    <AcademicsShell activeTab="subjects">
      <SubjectsTab params={params} basePath="/registrar/academics/subjects" />
    </AcademicsShell>
  );
}
