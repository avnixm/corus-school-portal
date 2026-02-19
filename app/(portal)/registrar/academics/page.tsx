import { redirect } from "next/navigation";
import { AcademicsShell } from "./AcademicsShell";
import {
  ProgramsTab,
  SubjectsTab,
  SectionsTab,
  type AcademicsSearchParams,
} from "./AcademicsTabs";

export const dynamic = "force-dynamic";

export const metadata = { title: "Academics" };

type SearchParams = Promise<AcademicsSearchParams>;

export default async function AcademicsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  if (params.tab === "curriculum") {
    redirect("/registrar/academics/curriculum");
  }
  const tab =
    params.tab === "programs"
      ? "programs"
      : params.tab === "subjects"
        ? "subjects"
        : params.tab === "sections"
          ? "sections"
          : "programs";

  return (
    <AcademicsShell activeTab={tab}>
      {tab === "programs" && <ProgramsTab params={params} />}
      {tab === "subjects" && (
        <SubjectsTab params={params} basePath="/registrar/academics" tabValue="subjects" />
      )}
      {tab === "sections" && (
        <SectionsTab params={params} basePath="/registrar/academics" tabValue="sections" />
      )}
    </AcademicsShell>
  );
}
