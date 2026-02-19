import { AcademicsShell } from "../AcademicsShell";
import { CurriculumBuilderContent } from "../../curriculum/CurriculumBuilderContent";

export const dynamic = "force-dynamic";

export const metadata = { title: "Curriculum — Academics" };

export default async function AcademicsCurriculumPage({
  searchParams,
}: {
  searchParams: Promise<{
    programId?: string;
    schoolYearId?: string;
    yearLevel?: string;
    view?: string;
  }>;
}) {
  return (
    <AcademicsShell activeTab="curriculum">
      <CurriculumBuilderContent
        basePath="/registrar/academics/curriculum"
        searchParams={searchParams}
      />
    </AcademicsShell>
  );
}
