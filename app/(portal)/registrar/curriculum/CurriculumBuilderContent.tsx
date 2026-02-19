// Shared curriculum builder UI. Use with CurriculumRouteProvider so links stay in context (standalone or under Academics).
import { redirect } from "next/navigation";
import {
  getCurriculumVersionsList,
  getCurriculumVersionById,
  getCurriculumBlocksByVersionId,
  getCurriculumBlockSubjectsByBlockId,
  getProgramsList,
  getSchoolYearsList,
  getTermsBySchoolYearId,
} from "@/db/queries";
import { CurriculumRouteProvider } from "@/lib/registrar/curriculum/CurriculumRouteContext";
import { CurriculumPageHeader } from "@/components/registrar/curriculum/CurriculumPageHeader";
import { CurriculumContextBar } from "@/components/registrar/curriculum/CurriculumContextBar";
import { CurriculumBuilder } from "@/components/registrar/curriculum/CurriculumBuilder";
import { CreateCurriculumPrompt } from "@/components/registrar/curriculum/CreateCurriculumPrompt";
import { CurriculumContentContainer } from "@/components/registrar/curriculum/CurriculumContentContainer";
import { CurriculumViewChooser } from "@/components/registrar/curriculum/CurriculumViewChooser";

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

export type CurriculumSearchParams = {
  programId?: string;
  schoolYearId?: string;
  yearLevel?: string;
  view?: string;
};

export async function CurriculumBuilderContent({
  basePath,
  searchParams,
}: {
  basePath: string;
  searchParams: Promise<CurriculumSearchParams>;
}) {
  const params = await searchParams;
  const selectedProgramId = params.programId ?? null;
  const selectedSchoolYearId = params.schoolYearId ?? null;
  const selectedYearLevel =
    params.yearLevel && YEAR_LEVELS.includes(params.yearLevel)
      ? params.yearLevel
      : "1st Year";
  const viewParam = params.view === "published" ? "published" : params.view === "draft" ? "draft" : null;

  const [programs, schoolYears, drafts, publishedList] = await Promise.all([
    getProgramsList(true),
    getSchoolYearsList(),
    selectedProgramId && selectedSchoolYearId
      ? getCurriculumVersionsList({
          programId: selectedProgramId,
          schoolYearId: selectedSchoolYearId,
          status: "draft",
        })
      : Promise.resolve([]),
    selectedProgramId && selectedSchoolYearId
      ? getCurriculumVersionsList({
          programId: selectedProgramId,
          schoolYearId: selectedSchoolYearId,
          status: "published",
        })
      : Promise.resolve([]),
  ]);

  if (!selectedProgramId && programs.length > 0) {
    redirect(`${basePath}?programId=${programs[0].id}`);
  }

  if (!selectedSchoolYearId && schoolYears.length > 0) {
    redirect(
      `${basePath}?programId=${selectedProgramId ?? programs[0]?.id}&schoolYearId=${schoolYears[0].id}`
    );
  }

  const draftVersion = drafts?.[0] ?? null;
  const publishedVersion = publishedList?.[0] ?? null;
  const hasBoth = draftVersion && publishedVersion;

  let version: Awaited<ReturnType<typeof getCurriculumVersionById>> | null = null;
  if (hasBoth) {
    if (viewParam === "draft") {
      version = await getCurriculumVersionById(draftVersion.id);
    } else if (viewParam === "published") {
      version = await getCurriculumVersionById(publishedVersion.id);
    }
  } else if (draftVersion) {
    version = await getCurriculumVersionById(draftVersion.id);
  } else if (publishedVersion) {
    version = await getCurriculumVersionById(publishedVersion.id);
  }
  const isDraft = version?.status === "draft";

  if (!version && selectedProgramId && selectedSchoolYearId) {
    const program = programs.find((p) => p.id === selectedProgramId);
    const schoolYear = schoolYears.find((sy) => sy.id === selectedSchoolYearId);

    if (hasBoth) {
      return (
        <CurriculumRouteProvider basePath={basePath}>
          <div className="mx-auto max-w-6xl space-y-6">
            <CurriculumPageHeader
              version={null}
              program={program ?? null}
              schoolYear={schoolYear ?? null}
              programs={programs}
              schoolYears={schoolYears}
              selectedYearLevel={selectedYearLevel}
              allBlocks={[]}
            />
            <CurriculumContextBar
              programs={programs}
              selectedProgramId={selectedProgramId}
              schoolYears={schoolYears}
              selectedSchoolYearId={selectedSchoolYearId}
              selectedYearLevel={selectedYearLevel}
            >
              <CurriculumViewChooser
                programCode={program?.code ?? ""}
                schoolYearName={schoolYear?.name ?? ""}
                programId={selectedProgramId}
                schoolYearId={selectedSchoolYearId}
                yearLevel={selectedYearLevel}
              />
            </CurriculumContextBar>
          </div>
        </CurriculumRouteProvider>
      );
    }

    return (
      <CurriculumRouteProvider basePath={basePath}>
        <div className="mx-auto max-w-6xl space-y-6">
          <CurriculumPageHeader
            version={null}
            program={program ?? null}
            schoolYear={schoolYear ?? null}
            programs={programs}
            schoolYears={schoolYears}
            selectedYearLevel={selectedYearLevel}
            allBlocks={[]}
          />
          <CurriculumContextBar
            programs={programs}
            selectedProgramId={selectedProgramId}
            schoolYears={schoolYears}
            selectedSchoolYearId={selectedSchoolYearId}
            selectedYearLevel={selectedYearLevel}
          >
            <CurriculumContentContainer
              programId={selectedProgramId}
              schoolYearId={selectedSchoolYearId}
              programCode={program?.code ?? ""}
              schoolYearName={schoolYear?.name ?? ""}
              showAddButton={true}
              addButtonLabel="Create curriculum"
            >
              <CreateCurriculumPrompt
                programId={selectedProgramId}
                schoolYearId={selectedSchoolYearId}
                programCode={program?.code ?? ""}
                schoolYearName={schoolYear?.name ?? ""}
              />
            </CurriculumContentContainer>
          </CurriculumContextBar>
        </div>
      </CurriculumRouteProvider>
    );
  }

  const termsForVersion = version
    ? await getTermsBySchoolYearId(version.schoolYearId)
    : [];
  const allBlocks = version
    ? await getCurriculumBlocksByVersionId(version.id)
    : [];
  const blocksWithSubjects = await Promise.all(
    allBlocks.map(async (b) => ({
      ...b,
      subjects: await getCurriculumBlockSubjectsByBlockId(b.id),
    }))
  );

  const blocksForYear = blocksWithSubjects.filter(
    (b) => b.yearLevel === selectedYearLevel
  );

  const termCount = termsForVersion.length;
  const subjectCount = blocksForYear.reduce((sum, b) => sum + b.subjects.length, 0);
  const totalUnits = blocksForYear.reduce(
    (sum, b) =>
      sum + b.subjects.reduce((s, sub) => s + parseFloat(sub.units ?? "0"), 0),
    0
  );

  const baseUrl = `${basePath}?programId=${selectedProgramId}&schoolYearId=${selectedSchoolYearId}&yearLevel=${encodeURIComponent(selectedYearLevel)}`;
  const otherViewHref = hasBoth
    ? isDraft
      ? `${baseUrl}&view=published`
      : `${baseUrl}&view=draft`
    : null;
  const otherViewLabel = hasBoth
    ? isDraft
      ? "View published"
      : "Edit draft"
    : null;

  return (
    <CurriculumRouteProvider basePath={basePath}>
      <div className="mx-auto max-w-6xl space-y-6">
        <CurriculumPageHeader
          version={version}
          program={programs.find((p) => p.id === selectedProgramId) ?? null}
          schoolYear={
            schoolYears.find((sy) => sy.id === selectedSchoolYearId) ?? null
          }
          programs={programs}
          schoolYears={schoolYears}
          selectedYearLevel={selectedYearLevel}
          allBlocks={blocksWithSubjects}
          otherViewHref={otherViewHref}
          otherViewLabel={otherViewLabel}
        />

        <CurriculumContextBar
          programs={programs}
          selectedProgramId={selectedProgramId}
          schoolYears={schoolYears}
          selectedSchoolYearId={selectedSchoolYearId}
          selectedYearLevel={selectedYearLevel}
        >
          {version && (
            <CurriculumContentContainer
              programId={selectedProgramId}
              schoolYearId={selectedSchoolYearId}
              programCode={programs.find((p) => p.id === selectedProgramId)?.code ?? ""}
              schoolYearName={schoolYears.find((sy) => sy.id === selectedSchoolYearId)?.name ?? ""}
              showAddButton={!isDraft}
              addButtonLabel={isDraft ? undefined : "Create curriculum"}
              yearLevel={selectedYearLevel}
              termCount={termCount}
              subjectCount={subjectCount}
              totalUnits={totalUnits}
              isPublished={version.status === "published"}
            >
              <CurriculumBuilder
                versionId={version.id}
                versionStatus={version.status}
                blocks={blocksForYear}
                terms={termsForVersion}
                yearLevel={selectedYearLevel}
                targetUnitsPerTerm={24}
                hideSummaryHeader
              />
            </CurriculumContentContainer>
          )}
        </CurriculumContextBar>
      </div>
    </CurriculumRouteProvider>
  );
}
