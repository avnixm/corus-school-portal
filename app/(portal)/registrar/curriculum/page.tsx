import { CurriculumBuilderContent } from "./CurriculumBuilderContent";

export const dynamic = "force-dynamic";

export const metadata = { title: "Curriculum" };

export default async function RegistrarCurriculumPage({
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
    <CurriculumBuilderContent
      basePath="/registrar/curriculum"
      searchParams={searchParams}
    />
  );
}
