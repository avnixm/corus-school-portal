import {
  getCurriculumVersionsList,
  getCurriculumVersionById,
  getCurriculumBlocksByVersionId,
  getCurriculumBlockSubjectsByBlockId,
  getProgramsList,
  getSchoolYearsList,
  getTermsBySchoolYearId,
} from "@/db/queries";
import { CurriculumHeader } from "@/components/registrar/curriculum/CurriculumHeader";
import { ContextBar } from "@/components/registrar/curriculum/ContextBar";
import { VersionStrip } from "@/components/registrar/curriculum/VersionStrip";
import { YearLevelTabs } from "@/components/registrar/curriculum/YearLevelTabs";
import { TermTabs } from "@/components/registrar/curriculum/TermTabs";
import { EditorCard } from "@/components/registrar/curriculum/EditorCard";

export const dynamic = "force-dynamic";

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

export default async function RegistrarCurriculumPage({
  searchParams,
}: {
  searchParams: Promise<{
    versionId?: string;
    programId?: string;
    schoolYearId?: string;
    status?: string;
    search?: string;
    yearLevel?: string;
    termId?: string;
  }>;
}) {
  const params = await searchParams;
  const selectedVersionId = params.versionId ?? null;
  const selectedYearLevel = params.yearLevel ?? YEAR_LEVELS[0];
  const searchQuery = params.search ?? "";

  const [versions, programs, schoolYears, version, blocks] = await Promise.all([
    getCurriculumVersionsList({
      programId: params.programId ?? undefined,
      schoolYearId: params.schoolYearId ?? undefined,
      status: params.status as "draft" | "published" | "archived" | undefined,
    }),
    getProgramsList(true),
    getSchoolYearsList(),
    selectedVersionId ? getCurriculumVersionById(selectedVersionId) : Promise.resolve(null),
    selectedVersionId ? getCurriculumBlocksByVersionId(selectedVersionId) : Promise.resolve([]),
  ]);

  const termsForVersion = version ? await getTermsBySchoolYearId(version.schoolYearId) : [];
  const blocksWithSubjects = await Promise.all(
    (blocks ?? []).map(async (b) => ({
      ...b,
      subjects: await getCurriculumBlockSubjectsByBlockId(b.id),
    }))
  );

  const selectedTermId = params.termId ?? termsForVersion[0]?.id ?? "";
  const selectedTerm = termsForVersion.find((t) => t.id === selectedTermId) ?? termsForVersion[0];
  const selectedBlock = selectedTerm
    ? blocksWithSubjects.find(
        (b) => b.yearLevel === selectedYearLevel && b.termId === selectedTerm.id
      ) ?? null
    : null;
  const program = version ? programs.find((p) => p.id === version.programId) : null;

  const versionsForHeader = versions.map((v) => ({
    id: v.id,
    name: v.name,
    programCode: v.programCode,
    schoolYearName: v.schoolYearName,
    status: v.status,
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <CurriculumHeader
        version={version}
        programs={programs}
        schoolYears={schoolYears}
        versions={versionsForHeader}
        blocks={blocksWithSubjects}
        terms={termsForVersion}
      />
      <ContextBar programs={programs} schoolYears={schoolYears} />
      <VersionStrip
        versions={versions}
        programs={programs}
        schoolYears={schoolYears}
        selectedVersionId={selectedVersionId}
        searchQuery={searchQuery}
      />

      {selectedVersionId && version ? (
        <YearLevelTabs
          versionId={version.id}
          blocks={blocksWithSubjects}
          terms={termsForVersion}
          yearLevels={YEAR_LEVELS}
        >
          <div className="space-y-4">
            <TermTabs
              versionId={version.id}
              blocks={blocksWithSubjects}
              terms={termsForVersion}
              yearLevel={selectedYearLevel}
              isDraft={version.status === "draft"}
            />
            {selectedTerm && (
              <EditorCard
                versionId={version.id}
                program={program ?? null}
                yearLevel={selectedYearLevel}
                term={selectedTerm}
                block={selectedBlock}
                isDraft={version.status === "draft"}
              />
            )}
          </div>
        </YearLevelTabs>
      ) : (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/50 p-12 text-center text-sm text-neutral-600">
          Select a curriculum version from the strip above or create a new one.
        </div>
      )}
    </div>
  );
}
