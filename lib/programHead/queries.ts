import "server-only";
import { db } from "@/lib/db";
import {
  enrollments,
  students,
  schoolYears,
  terms,
  sections,
  programs,
  classSchedules,
  gradeSubmissions,
  gradeEntries,
  gradingPeriods,
  subjects,
  userProfile,
  enrollmentFinanceStatus,
  announcements,
  ledgerEntries,
} from "@/db/schema";
import { eq, and, desc, sql, gte, lte, inArray } from "drizzle-orm";
import type { getProgramHeadScopePrograms } from "./scope";

/** null = all programs; string[] = restrict to these program codes. */
export type ProgramScope = Awaited<ReturnType<typeof getProgramHeadScopePrograms>>;

function programConditionEnrollments(scope: ProgramScope) {
  if (scope === null || scope.length === 0) return null;
  if (scope.length === 1) return eq(enrollments.program, scope[0]);
  return inArray(enrollments.program, scope);
}

function programConditionSections(scope: ProgramScope) {
  if (scope === null || scope.length === 0) return null;
  const programIdsSubquery = db
    .select({ id: programs.id })
    .from(programs)
    .where(inArray(programs.code, scope));
  return inArray(sections.programId, programIdsSubquery);
}

export async function getDashboardCurrentTermEnrollments(
  scope: ProgramScope,
  schoolYearId: string | null,
  termId: string | null
) {
  if (!schoolYearId || !termId) return 0;
  const cond = programConditionEnrollments(scope);
  const conds = [
    eq(enrollments.schoolYearId, schoolYearId),
    eq(enrollments.termId, termId),
    eq(enrollments.status, "approved"),
  ];
  if (cond) conds.push(cond);
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(enrollments)
    .where(and(...conds));
  return row?.count ?? 0;
}

export async function getDashboardPendingGradeReleases(
  scope: ProgramScope,
  schoolYearId: string | null,
  termId: string | null
) {
  if (!schoolYearId || !termId) return 0;
  const sectionCond = programConditionSections(scope);
  const conds = [
    eq(gradeSubmissions.schoolYearId, schoolYearId),
    eq(gradeSubmissions.termId, termId),
    sql`${gradeSubmissions.status} IN ('submitted', 'approved')`,
  ];
  if (sectionCond) {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(gradeSubmissions)
      .innerJoin(classSchedules, eq(gradeSubmissions.scheduleId, classSchedules.id))
      .innerJoin(sections, eq(classSchedules.sectionId, sections.id))
      .where(and(...conds, sectionCond));
    return row?.count ?? 0;
  }
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(gradeSubmissions)
    .where(and(...conds));
  return row?.count ?? 0;
}

const AT_RISK_THRESHOLD = 75;

export async function getDashboardAtRiskCount(
  scope: ProgramScope,
  schoolYearId: string | null,
  termId: string | null
) {
  if (!schoolYearId || !termId) return 0;
  const enrollCond = programConditionEnrollments(scope);
  const conds = [
    eq(gradeSubmissions.status, "released"),
    eq(gradeSubmissions.schoolYearId, schoolYearId),
    eq(gradeSubmissions.termId, termId),
  ];
  if (enrollCond) conds.push(enrollCond);
  const atRiskSub = db
    .select({ enrollmentId: gradeEntries.enrollmentId })
    .from(gradeEntries)
    .innerJoin(gradeSubmissions, eq(gradeEntries.submissionId, gradeSubmissions.id))
    .innerJoin(enrollments, eq(gradeEntries.enrollmentId, enrollments.id))
    .where(and(...conds))
    .groupBy(gradeEntries.enrollmentId)
    .having(sql`AVG((${gradeEntries.numericGrade})::numeric) < ${AT_RISK_THRESHOLD}`)
    .as("at_risk");
  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(atRiskSub);
  return row?.count ?? 0;
}

export async function getDashboardUnclearedCount(
  scope: ProgramScope,
  schoolYearId: string | null,
  termId: string | null
) {
  if (!schoolYearId || !termId) return 0;
  const enrollCond = programConditionEnrollments(scope);
  const conds = [
    eq(enrollments.schoolYearId, schoolYearId),
    eq(enrollments.termId, termId),
    eq(enrollments.status, "approved"),
    sql`${enrollmentFinanceStatus.status} IS DISTINCT FROM 'cleared'`,
  ];
  if (enrollCond) conds.push(enrollCond);
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(enrollments)
    .innerJoin(enrollmentFinanceStatus, eq(enrollments.id, enrollmentFinanceStatus.enrollmentId))
    .where(and(...conds));
  return row?.count ?? 0;
}

export async function getEnrollmentTrendByYearLevel(
  scope: ProgramScope,
  schoolYearId: string | null,
  termId: string | null
) {
  if (!schoolYearId || !termId) return [];
  const enrollCond = programConditionEnrollments(scope);
  const conds = [
    eq(enrollments.schoolYearId, schoolYearId),
    eq(enrollments.termId, termId),
    eq(enrollments.status, "approved"),
  ];
  if (enrollCond) conds.push(enrollCond);
  return db
    .select({
      yearLevel: enrollments.yearLevel,
      count: sql<number>`count(*)::int`.as("count"),
    })
    .from(enrollments)
    .where(and(...conds))
    .groupBy(enrollments.yearLevel)
    .orderBy(enrollments.yearLevel);
}

export async function getRecentAnnouncementsForProgramHead(limit = 5) {
  return db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      audience: announcements.audience,
      createdAt: announcements.createdAt,
      createdByRole: userProfile.role,
    })
    .from(announcements)
    .leftJoin(userProfile, eq(announcements.createdByUserId, userProfile.userId))
    .where(sql`${announcements.audience} IN ('all', 'program_head')`)
    .orderBy(desc(announcements.createdAt))
    .limit(limit);
}

export async function getAttentionNeededSubmissions(
  scope: ProgramScope,
  schoolYearId: string | null,
  termId: string | null,
  limit = 5
) {
  if (!schoolYearId || !termId) return [];
  const sectionCond = programConditionSections(scope);
  const conds = [
    eq(gradeSubmissions.schoolYearId, schoolYearId),
    eq(gradeSubmissions.termId, termId),
    sql`${gradeSubmissions.status} IN ('draft', 'submitted', 'returned')`,
  ];
  const base = db
    .select({
      id: gradeSubmissions.id,
      subjectCode: subjects.code,
      sectionName: sections.name,
      gradingPeriodName: gradingPeriods.name,
      status: gradeSubmissions.status,
      updatedAt: gradeSubmissions.updatedAt,
      teacherFirstName: sql<string>`COALESCE(SPLIT_PART(COALESCE(${userProfile.fullName},''), ' ', 1), '')`,
      teacherLastName: sql<string>`COALESCE(NULLIF(TRIM(SUBSTRING(COALESCE(${userProfile.fullName},'') FROM POSITION(' ' IN COALESCE(${userProfile.fullName},'')||' ')+1)), ''), '')`,
    })
    .from(gradeSubmissions)
    .innerJoin(gradingPeriods, eq(gradeSubmissions.gradingPeriodId, gradingPeriods.id))
    .innerJoin(classSchedules, eq(gradeSubmissions.scheduleId, classSchedules.id))
    .innerJoin(subjects, eq(classSchedules.subjectId, subjects.id))
    .innerJoin(sections, eq(classSchedules.sectionId, sections.id))
    .innerJoin(userProfile, eq(gradeSubmissions.teacherUserProfileId, userProfile.id))
    .where(and(...conds, ...(sectionCond ? [sectionCond] : [])))
    .orderBy(desc(gradeSubmissions.updatedAt))
    .limit(limit);
  return base;
}

// ---------- Enrollment Analytics ----------

export async function getEnrollmentsByYearLevel(
  scope: ProgramScope,
  filters: { schoolYearId?: string; termId?: string }
) {
  const enrollCond = programConditionEnrollments(scope);
  const conds = [eq(enrollments.status, "approved")];
  if (filters.schoolYearId) conds.push(eq(enrollments.schoolYearId, filters.schoolYearId));
  if (filters.termId) conds.push(eq(enrollments.termId, filters.termId));
  if (enrollCond) conds.push(enrollCond);
  return db
    .select({
      yearLevel: enrollments.yearLevel,
      count: sql<number>`count(*)::int`.as("count"),
    })
    .from(enrollments)
    .where(and(...conds))
    .groupBy(enrollments.yearLevel)
    .orderBy(enrollments.yearLevel);
}

export async function getEnrollmentsBySection(
  scope: ProgramScope,
  filters: { schoolYearId?: string; termId?: string; yearLevel?: string }
) {
  const enrollCond = programConditionEnrollments(scope);
  const conds = [eq(enrollments.status, "approved")];
  if (filters.schoolYearId) conds.push(eq(enrollments.schoolYearId, filters.schoolYearId));
  if (filters.termId) conds.push(eq(enrollments.termId, filters.termId));
  if (filters.yearLevel) conds.push(eq(enrollments.yearLevel, filters.yearLevel));
  if (enrollCond) conds.push(enrollCond);
  return db
    .select({
      sectionName: sections.name,
      sectionId: sections.id,
      program: programs.code,
      count: sql<number>`count(*)::int`.as("count"),
    })
    .from(enrollments)
    .innerJoin(sections, eq(enrollments.sectionId, sections.id))
    .leftJoin(programs, eq(sections.programId, programs.id))
    .where(and(...conds))
    .groupBy(sections.id, sections.name, programs.code)
    .orderBy(desc(sql`count(*)`));
}

// ---------- Grade Analytics (released only) ----------

const PASS_THRESHOLD = 75;

export async function getGradePassFailCounts(
  scope: ProgramScope,
  filters: { schoolYearId?: string; termId?: string; gradingPeriodId?: string; yearLevel?: string; subjectId?: string }
) {
  const enrollCond = programConditionEnrollments(scope);
  const conds = [eq(gradeSubmissions.status, "released")];
  if (filters.schoolYearId) conds.push(eq(gradeSubmissions.schoolYearId, filters.schoolYearId));
  if (filters.termId) conds.push(eq(gradeSubmissions.termId, filters.termId));
  if (filters.gradingPeriodId) conds.push(eq(gradeSubmissions.gradingPeriodId, filters.gradingPeriodId));
  if (enrollCond) conds.push(enrollCond);
  const withSubject = !!filters.subjectId;
  if (withSubject) conds.push(eq(classSchedules.subjectId, filters.subjectId!));
  const q = db
    .select({
      pass: sql<number>`count(*) filter (where (${gradeEntries.numericGrade})::numeric >= ${PASS_THRESHOLD})::int`.as("pass"),
      fail: sql<number>`count(*) filter (where (${gradeEntries.numericGrade})::numeric < ${PASS_THRESHOLD})::int`.as("fail"),
    })
    .from(gradeEntries)
    .innerJoin(gradeSubmissions, eq(gradeEntries.submissionId, gradeSubmissions.id))
    .innerJoin(enrollments, eq(gradeEntries.enrollmentId, enrollments.id))
    .innerJoin(classSchedules, eq(gradeSubmissions.scheduleId, classSchedules.id))
    .where(and(...conds));
  const [row] = await q;
  return { pass: row?.pass ?? 0, fail: row?.fail ?? 0 };
}

export async function getAverageGradeBySubject(
  scope: ProgramScope,
  filters: { schoolYearId?: string; termId?: string; gradingPeriodId?: string }
) {
  const enrollCond = programConditionEnrollments(scope);
  const conds = [eq(gradeSubmissions.status, "released")];
  if (filters.schoolYearId) conds.push(eq(gradeSubmissions.schoolYearId, filters.schoolYearId));
  if (filters.termId) conds.push(eq(gradeSubmissions.termId, filters.termId));
  if (filters.gradingPeriodId) conds.push(eq(gradeSubmissions.gradingPeriodId, filters.gradingPeriodId));
  if (enrollCond) conds.push(enrollCond);
  return db
    .select({
      subjectCode: subjects.code,
      subjectDescription: subjects.description,
      subjectId: subjects.id,
      avg: sql<string>`ROUND(AVG((${gradeEntries.numericGrade})::numeric), 2)::text`.as("avg"),
      count: sql<number>`count(*)::int`.as("count"),
    })
    .from(gradeEntries)
    .innerJoin(gradeSubmissions, eq(gradeEntries.submissionId, gradeSubmissions.id))
    .innerJoin(enrollments, eq(gradeEntries.enrollmentId, enrollments.id))
    .innerJoin(classSchedules, eq(gradeSubmissions.scheduleId, classSchedules.id))
    .innerJoin(subjects, eq(classSchedules.subjectId, subjects.id))
    .where(and(...conds))
    .groupBy(subjects.id, subjects.code, subjects.description)
    .orderBy(subjects.code);
}

export async function getGradeDistribution(
  scope: ProgramScope,
  filters: { schoolYearId?: string; termId?: string; gradingPeriodId?: string }
) {
  const enrollCond = programConditionEnrollments(scope);
  const conds = [eq(gradeSubmissions.status, "released")];
  if (filters.schoolYearId) conds.push(eq(gradeSubmissions.schoolYearId, filters.schoolYearId));
  if (filters.termId) conds.push(eq(gradeSubmissions.termId, filters.termId));
  if (filters.gradingPeriodId) conds.push(eq(gradeSubmissions.gradingPeriodId, filters.gradingPeriodId));
  if (enrollCond) conds.push(enrollCond);
  const buckets = [
    { label: "95-100", min: 95, max: 100 },
    { label: "90-94", min: 90, max: 94 },
    { label: "85-89", min: 85, max: 89 },
    { label: "80-84", min: 80, max: 84 },
    { label: "75-79", min: 75, max: 79 },
    { label: "<75", min: 0, max: 74 },
  ];
  const result: { label: string; count: number }[] = [];
  for (const b of buckets) {
    const rangeCond = b.max >= 100
      ? sql`(${gradeEntries.numericGrade})::numeric >= ${b.min}`
      : b.min === 0
      ? sql`(${gradeEntries.numericGrade})::numeric < ${b.max + 1}`
      : sql`(${gradeEntries.numericGrade})::numeric >= ${b.min} AND (${gradeEntries.numericGrade})::numeric <= ${b.max}`;
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(gradeEntries)
      .innerJoin(gradeSubmissions, eq(gradeEntries.submissionId, gradeSubmissions.id))
      .innerJoin(enrollments, eq(gradeEntries.enrollmentId, enrollments.id))
      .where(and(...conds, rangeCond));
    result.push({ label: b.label, count: row?.count ?? 0 });
  }
  return result;
}

export async function getTopBottomStudentsByAverage(
  scope: ProgramScope,
  filters: { schoolYearId?: string; termId?: string; gradingPeriodId?: string },
  direction: "top" | "bottom",
  limit = 10
) {
  const enrollCond = programConditionEnrollments(scope);
  const conds = [eq(gradeSubmissions.status, "released")];
  if (filters.schoolYearId) conds.push(eq(gradeSubmissions.schoolYearId, filters.schoolYearId));
  if (filters.termId) conds.push(eq(gradeSubmissions.termId, filters.termId));
  if (filters.gradingPeriodId) conds.push(eq(gradeSubmissions.gradingPeriodId, filters.gradingPeriodId));
  if (enrollCond) conds.push(enrollCond);
  const order = direction === "top" ? desc(sql`AVG((${gradeEntries.numericGrade})::numeric)`) : sql`AVG((${gradeEntries.numericGrade})::numeric)`;
  return db
    .select({
      studentId: students.id,
      studentCode: students.studentCode,
      firstName: students.firstName,
      lastName: students.lastName,
      avg: sql<string>`ROUND(AVG((${gradeEntries.numericGrade})::numeric), 2)::text`.as("avg"),
    })
    .from(gradeEntries)
    .innerJoin(gradeSubmissions, eq(gradeEntries.submissionId, gradeSubmissions.id))
    .innerJoin(students, eq(gradeEntries.studentId, students.id))
    .innerJoin(enrollments, eq(gradeEntries.enrollmentId, enrollments.id))
    .where(and(...conds))
    .groupBy(students.id, students.studentCode, students.firstName, students.lastName)
    .orderBy(order)
    .limit(limit);
}

// ---------- Grade Submissions (monitor) ----------

export async function listGradeSubmissionsProgramHead(
  scope: ProgramScope,
  filters: {
    schoolYearId?: string;
    termId?: string;
    gradingPeriodId?: string;
    subjectId?: string;
    sectionId?: string;
    status?: string;
  }
) {
  const sectionCond = programConditionSections(scope);
  const conds: ReturnType<typeof eq>[] = [];
  if (filters.schoolYearId) conds.push(eq(gradeSubmissions.schoolYearId, filters.schoolYearId));
  if (filters.termId) conds.push(eq(gradeSubmissions.termId, filters.termId));
  if (filters.gradingPeriodId) conds.push(eq(gradeSubmissions.gradingPeriodId, filters.gradingPeriodId));
  if (filters.subjectId) conds.push(eq(subjects.id, filters.subjectId));
  if (filters.sectionId) conds.push(eq(sections.id, filters.sectionId));
  if (filters.status)
    conds.push(eq(gradeSubmissions.status, filters.status as "draft" | "submitted" | "returned" | "approved" | "released"));
  if (sectionCond) conds.push(sectionCond);
  const base = db
    .select({
      id: gradeSubmissions.id,
      subjectCode: subjects.code,
      sectionName: sections.name,
      gradingPeriodName: gradingPeriods.name,
      status: gradeSubmissions.status,
      submittedAt: gradeSubmissions.submittedAt,
      updatedAt: gradeSubmissions.updatedAt,
      teacherFirstName: sql<string>`COALESCE(SPLIT_PART(COALESCE(${userProfile.fullName},''), ' ', 1), '')`,
      teacherLastName: sql<string>`COALESCE(NULLIF(TRIM(SUBSTRING(COALESCE(${userProfile.fullName},'') FROM POSITION(' ' IN COALESCE(${userProfile.fullName},'')||' ')+1)), ''), '')`,
    })
    .from(gradeSubmissions)
    .innerJoin(gradingPeriods, eq(gradeSubmissions.gradingPeriodId, gradingPeriods.id))
    .innerJoin(classSchedules, eq(gradeSubmissions.scheduleId, classSchedules.id))
    .innerJoin(subjects, eq(classSchedules.subjectId, subjects.id))
    .innerJoin(sections, eq(classSchedules.sectionId, sections.id))
    .innerJoin(userProfile, eq(gradeSubmissions.teacherUserProfileId, userProfile.id))
    .orderBy(desc(gradeSubmissions.updatedAt));
  if (conds.length > 0) return base.where(and(...conds));
  return base;
}

// ---------- Finance Clearance ----------

export async function getClearanceOverview(
  scope: ProgramScope,
  filters: {
    schoolYearId?: string;
    termId?: string;
    yearLevel?: string;
    status?: string;
  }
) {
  const enrollCond = programConditionEnrollments(scope);
  const conds = [eq(enrollments.status, "approved")];
  if (filters.schoolYearId) conds.push(eq(enrollments.schoolYearId, filters.schoolYearId));
  if (filters.termId) conds.push(eq(enrollments.termId, filters.termId));
  if (filters.yearLevel) conds.push(eq(enrollments.yearLevel, filters.yearLevel));
  if (filters.status)
    conds.push(eq(enrollmentFinanceStatus.status, filters.status as "unassessed" | "assessed" | "partially_paid" | "paid" | "cleared" | "hold"));
  if (enrollCond) conds.push(enrollCond);
  return db
    .select({
      enrollmentId: enrollments.id,
      studentCode: students.studentCode,
      firstName: students.firstName,
      middleName: students.middleName,
      lastName: students.lastName,
      schoolYearName: schoolYears.name,
      termName: terms.name,
      program: enrollments.program,
      yearLevel: enrollments.yearLevel,
      balance: enrollmentFinanceStatus.balance,
      financeStatus: enrollmentFinanceStatus.status,
      updatedAt: enrollmentFinanceStatus.updatedAt,
    })
    .from(enrollments)
    .innerJoin(students, eq(enrollments.studentId, students.id))
    .innerJoin(schoolYears, eq(enrollments.schoolYearId, schoolYears.id))
    .innerJoin(terms, eq(enrollments.termId, terms.id))
    .innerJoin(enrollmentFinanceStatus, eq(enrollments.id, enrollmentFinanceStatus.enrollmentId))
    .where(and(...conds))
    .orderBy(desc(enrollmentFinanceStatus.updatedAt));
}

// ---------- Sections & Loads ----------

/** Sections under program scope with enrolled count and schedule count for the term. */
export async function getSectionsWithLoads(
  scope: ProgramScope,
  schoolYearId: string | null,
  termId: string | null
): Promise<{ id: string; name: string; program: string | null; yearLevel: string | null; enrolledCount: number; scheduleCount: number }[]> {
  if (!schoolYearId || !termId) return [];
  const sectionCond = programConditionSections(scope);
  const enrollConds = [eq(enrollments.status, "approved"), eq(enrollments.schoolYearId, schoolYearId), eq(enrollments.termId, termId)];
  if (sectionCond) enrollConds.push(sectionCond);
  const enrolledSub = db
    .select({ sectionId: enrollments.sectionId, count: sql<number>`count(*)::int`.as("c") })
    .from(enrollments)
    .where(and(...enrollConds))
    .groupBy(enrollments.sectionId)
    .as("ec");
  const scheduleSub = db
    .select({ sectionId: classSchedules.sectionId, count: sql<number>`count(*)::int`.as("c") })
    .from(classSchedules)
    .where(and(eq(classSchedules.schoolYearId, schoolYearId), eq(classSchedules.termId, termId)))
    .groupBy(classSchedules.sectionId)
    .as("sc");
  const base = db
    .select({
      id: sections.id,
      name: sections.name,
      program: programs.code,
      yearLevel: sections.yearLevel,
      enrolledCount: sql<number>`COALESCE(${enrolledSub.count}, 0)`.as("enrolled_count"),
      scheduleCount: sql<number>`COALESCE(${scheduleSub.count}, 0)`.as("schedule_count"),
    })
    .from(sections)
    .leftJoin(programs, eq(sections.programId, programs.id))
    .leftJoin(enrolledSub, eq(sections.id, enrolledSub.sectionId))
    .leftJoin(scheduleSub, eq(sections.id, scheduleSub.sectionId));
  const rows = sectionCond ? await base.where(sectionCond) : await base;
  return rows as { id: string; name: string; program: string | null; yearLevel: string | null; enrolledCount: number; scheduleCount: number }[];
}

export async function getDistinctProgramsFromEnrollments() {
  const rows = await db
    .selectDistinct({ program: enrollments.program })
    .from(enrollments)
    .where(sql`${enrollments.program} IS NOT NULL AND ${enrollments.program} != ''`)
    .orderBy(enrollments.program);
  return rows.map((r) => r.program!).filter(Boolean);
}
