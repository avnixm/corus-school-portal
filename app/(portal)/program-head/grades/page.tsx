import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { getProgramHeadScopeAndSyTerm } from "@/lib/programHead/pageContext";
import {
  getGradePassFailCounts,
  getAverageGradeBySubject,
  getGradeDistribution,
  getTopBottomStudentsByAverage,
  listGradeSubmissionsProgramHead,
} from "@/lib/programHead/queries";
import { getProgramsByCodes, getSectionsList } from "@/db/queries";
import { db } from "@/lib/db";
import { subjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ProgramHeadScopeGate } from "@/components/portal/programHead/ProgramHeadScopeGate";
import { ProgramHeadGradesFilters } from "@/components/portal/programHead/ProgramHeadGradesFilters";
import { GradesPageContent } from "./GradesPageContent";

export const dynamic = "force-dynamic";

async function getSubjectsList() {
  try {
    return await db
      .select({ id: subjects.id, code: subjects.code, description: subjects.description })
      .from(subjects)
      .where(eq(subjects.active, true))
      .orderBy(subjects.code);
  } catch {
    return [];
  }
}

export const metadata = { title: "Grades" };

export default async function ProgramHeadGradesPage({
  searchParams,
}: {
  searchParams: Promise<{
    schoolYearId?: string;
    termId?: string;
    gradingPeriodId?: string;
    yearLevel?: string;
    subjectId?: string;
    sectionId?: string;
    status?: string;
    view?: string;
  }>;
}) {
  const user = await getCurrentUserWithRole();
  if (!user) return null;
  const params = await searchParams;
  const { scope, schoolYears, terms, syId, termId, needsScope, gradingPeriods } =
    await getProgramHeadScopeAndSyTerm(
      user.userId,
      { schoolYearId: params.schoolYearId, termId: params.termId },
      { includeGradingPeriods: true }
    );

  if (needsScope) {
    return <ProgramHeadScopeGate title="Grade Analytics" />;
  }

  const subjectsList = await getSubjectsList();
  const programs = await getProgramsByCodes(scope!);
  const programIds = new Set(programs.map((p) => p.id));
  const allSections = await getSectionsList();
  const sections = allSections.filter((s) => s.programId && programIds.has(s.programId));

  const filters = {
    schoolYearId: syId ?? undefined,
    termId: termId ?? undefined,
    gradingPeriodId: params.gradingPeriodId ?? undefined,
    yearLevel: params.yearLevel ?? undefined,
    subjectId: params.subjectId ?? undefined,
  };

  const [passFail, avgBySubject, distribution, top10, bottom10, submissionRows] =
    await Promise.all([
      getGradePassFailCounts(scope!, filters),
      getAverageGradeBySubject(scope!, filters),
      getGradeDistribution(scope!, filters),
      getTopBottomStudentsByAverage(scope!, filters, "top", 10),
      getTopBottomStudentsByAverage(scope!, filters, "bottom", 10),
      listGradeSubmissionsProgramHead(scope!, {
        schoolYearId: syId ?? undefined,
        termId: termId ?? undefined,
        gradingPeriodId: params.gradingPeriodId,
        subjectId: params.subjectId,
        sectionId: params.sectionId,
        status: params.status,
      }),
    ]);

  const view = params.view === "submissions" ? "submissions" : "analytics";

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Grades
        </h2>
        <p className="mt-1 text-sm text-neutral-800">
          Analytics: released grades only (pass threshold 75). Submissions: monitor teacher completion status.
        </p>
      </section>

      <ProgramHeadGradesFilters
        basePath="/program-head/grades"
        schoolYears={schoolYears}
        terms={terms}
        gradingPeriods={gradingPeriods ?? []}
        subjects={subjectsList}
        sections={sections.map((s) => ({ id: s.id, name: s.name }))}
        current={{
          schoolYearId: syId,
          termId,
          gradingPeriodId: params.gradingPeriodId,
          yearLevel: params.yearLevel,
          subjectId: params.subjectId,
          sectionId: params.sectionId,
          status: params.status,
        }}
      />

      <GradesPageContent
        view={view}
        analytics={{
          passFail,
          distribution,
          avgBySubject,
          top10,
          bottom10,
        }}
        submissions={submissionRows.map((s) => ({
          id: s.id,
          subjectCode: s.subjectCode,
          sectionName: s.sectionName,
          gradingPeriodName: s.gradingPeriodName,
          teacherFirstName: s.teacherFirstName ?? null,
          teacherLastName: s.teacherLastName ?? null,
          status: s.status,
          submittedAt: s.submittedAt,
          updatedAt: s.updatedAt,
        }))}
      />
    </div>
  );
}
