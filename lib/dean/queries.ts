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
  enrollmentFinanceStatus,
  announcements,
  userProfile,
  assessments,
  payments,
  enrollmentApprovals,
  requirementVerifications,
  governanceFlags,
} from "@/db/schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";

type DeanFilters = {
  schoolYearId?: string | null;
  termId?: string | null;
  program?: string | null;
  yearLevel?: string | null;
  gradingPeriodId?: string | null;
  subjectId?: string | null;
};

function buildEnrollmentConds(f: DeanFilters) {
  const conds = [eq(enrollments.status, "approved")];
  if (f.schoolYearId) conds.push(eq(enrollments.schoolYearId, f.schoolYearId));
  if (f.termId) conds.push(eq(enrollments.termId, f.termId));
  if (f.program) conds.push(eq(enrollments.program, f.program));
  if (f.yearLevel) conds.push(eq(enrollments.yearLevel, f.yearLevel));
  return conds;
}

export async function getDeanDashboardTotalEnrollments(syId: string | null, termId: string | null) {
  if (!syId || !termId) return 0;
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(enrollments)
    .where(and(eq(enrollments.schoolYearId, syId), eq(enrollments.termId, termId), eq(enrollments.status, "approved")));
  return row?.count ?? 0;
}

export async function getDeanDashboardPendingApprovals() {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(enrollmentApprovals)
    .where(eq(enrollmentApprovals.status, "pending"));
  return row?.count ?? 0;
}

export async function getDeanDashboardUnreleasedSubmissions(syId: string | null, termId: string | null) {
  if (!syId || !termId) return 0;
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(gradeSubmissions)
    .where(
      and(
        eq(gradeSubmissions.schoolYearId, syId),
        eq(gradeSubmissions.termId, termId),
        sql`${gradeSubmissions.status} IN ('submitted', 'approved')`
      )
    );
  return row?.count ?? 0;
}

export async function getDeanDashboardUncleared(syId: string | null, termId: string | null) {
  if (!syId || !termId) return 0;
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(enrollments)
    .innerJoin(enrollmentFinanceStatus, eq(enrollments.id, enrollmentFinanceStatus.enrollmentId))
    .where(
      and(
        eq(enrollments.schoolYearId, syId),
        eq(enrollments.termId, termId),
        eq(enrollments.status, "approved"),
        sql`${enrollmentFinanceStatus.status} IS DISTINCT FROM 'cleared'`
      )
    );
  return row?.count ?? 0;
}

export async function getDeanEnrollmentByProgram(f: DeanFilters, limit = 8) {
  const conds = buildEnrollmentConds(f);
  if (conds.length === 0) return [];
  return db
    .select({ program: enrollments.program, count: sql<number>`count(*)::int`.as("count") })
    .from(enrollments)
    .where(and(...conds))
    .groupBy(enrollments.program)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);
}

export async function getDeanCollectionThisMonth() {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setMonth(end.getMonth() + 1);
  end.setDate(0);
  end.setHours(23, 59, 59, 999);
  const rows = await db
    .select({ method: payments.method, amount: payments.amount })
    .from(payments)
    .where(and(eq(payments.status, "posted"), gte(payments.receivedAt, start), lte(payments.receivedAt, end)));
  const total = rows.reduce((acc, p) => acc + parseFloat(p.amount ?? "0"), 0);
  const byMethod: Record<string, number> = {};
  for (const p of rows) {
    const m = p.method ?? "other";
    byMethod[m] = (byMethod[m] ?? 0) + parseFloat(p.amount ?? "0");
  }
  return { total, count: rows.length, byMethod };
}

const PASS_THRESHOLD = 75;

export async function getDeanAcademicRiskCount(syId: string | null, termId: string | null) {
  if (!syId || !termId) return 0;
  const atRisk = db
    .select({ enrollmentId: gradeEntries.enrollmentId })
    .from(gradeEntries)
    .innerJoin(gradeSubmissions, eq(gradeEntries.submissionId, gradeSubmissions.id))
    .innerJoin(enrollments, eq(gradeEntries.enrollmentId, enrollments.id))
    .where(
      and(
        eq(gradeSubmissions.status, "released"),
        eq(gradeSubmissions.schoolYearId, syId),
        eq(gradeSubmissions.termId, termId)
      )
    )
    .groupBy(gradeEntries.enrollmentId)
    .having(sql`AVG((${gradeEntries.numericGrade})::numeric) < ${PASS_THRESHOLD}`)
    .as("at_risk");
  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(atRisk);
  return row?.count ?? 0;
}

export async function getDeanRecentAnnouncements(limit = 10) {
  return db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      audience: announcements.audience,
      program: announcements.program,
      pinned: announcements.pinned,
      createdByUserId: announcements.createdByUserId,
      createdAt: announcements.createdAt,
      updatedAt: announcements.updatedAt,
      createdByRole: userProfile.role,
    })
    .from(announcements)
    .leftJoin(userProfile, eq(announcements.createdByUserId, userProfile.userId))
    .orderBy(desc(announcements.pinned), desc(announcements.createdAt))
    .limit(limit);
}

// ---------- Enrollment Overview ----------

export async function getDeanEnrollmentsByProgram(f: DeanFilters) {
  const conds = buildEnrollmentConds(f);
  if (conds.length === 0) return [];
  return db
    .select({ program: enrollments.program, count: sql<number>`count(*)::int`.as("count") })
    .from(enrollments)
    .where(and(...conds))
    .groupBy(enrollments.program)
    .orderBy(desc(sql`count(*)`));
}

export async function getDeanEnrollmentsByYearLevel(f: DeanFilters) {
  const conds = buildEnrollmentConds(f);
  if (conds.length === 0) return [];
  return db
    .select({ yearLevel: enrollments.yearLevel, count: sql<number>`count(*)::int`.as("count") })
    .from(enrollments)
    .where(and(...conds))
    .groupBy(enrollments.yearLevel)
    .orderBy(enrollments.yearLevel);
}

export async function getDeanEnrollmentsBySection(f: DeanFilters) {
  const conds = buildEnrollmentConds(f);
  if (conds.length === 0) return [];
  return db
    .select({
      sectionName: sections.name,
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

// ---------- Academic Outcomes (released only) ----------

export async function getDeanPassFailByProgram(f: DeanFilters) {
  const conds = [eq(gradeSubmissions.status, "released")];
  if (f.schoolYearId) conds.push(eq(gradeSubmissions.schoolYearId, f.schoolYearId));
  if (f.termId) conds.push(eq(gradeSubmissions.termId, f.termId));
  if (f.gradingPeriodId) conds.push(eq(gradeSubmissions.gradingPeriodId, f.gradingPeriodId));
  if (f.program) conds.push(eq(enrollments.program, f.program));
  return db
    .select({
      program: enrollments.program,
      pass: sql<number>`count(*) filter (where (${gradeEntries.numericGrade})::numeric >= ${PASS_THRESHOLD})::int`.as("pass"),
      fail: sql<number>`count(*) filter (where (${gradeEntries.numericGrade})::numeric < ${PASS_THRESHOLD})::int`.as("fail"),
    })
    .from(gradeEntries)
    .innerJoin(gradeSubmissions, eq(gradeEntries.submissionId, gradeSubmissions.id))
    .innerJoin(enrollments, eq(gradeEntries.enrollmentId, enrollments.id))
    .innerJoin(classSchedules, eq(gradeSubmissions.scheduleId, classSchedules.id))
    .where(and(...conds))
    .groupBy(enrollments.program)
    .orderBy(enrollments.program);
}

export async function getDeanAvgGradeBySubject(f: DeanFilters) {
  const conds = [eq(gradeSubmissions.status, "released")];
  if (f.schoolYearId) conds.push(eq(gradeSubmissions.schoolYearId, f.schoolYearId));
  if (f.termId) conds.push(eq(gradeSubmissions.termId, f.termId));
  if (f.gradingPeriodId) conds.push(eq(gradeSubmissions.gradingPeriodId, f.gradingPeriodId));
  if (f.subjectId) conds.push(eq(subjects.id, f.subjectId));
  return db
    .select({
      subjectCode: subjects.code,
      subjectDescription: subjects.description,
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

export async function getDeanGradeDistribution(f: DeanFilters) {
  const conds = [eq(gradeSubmissions.status, "released")];
  if (f.schoolYearId) conds.push(eq(gradeSubmissions.schoolYearId, f.schoolYearId));
  if (f.termId) conds.push(eq(gradeSubmissions.termId, f.termId));
  if (f.gradingPeriodId) conds.push(eq(gradeSubmissions.gradingPeriodId, f.gradingPeriodId));
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
    const rangeCond =
      b.max >= 100
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

export async function getDeanProgramsNeedingAttention(f: DeanFilters, limit = 10) {
  const conds = [eq(gradeSubmissions.status, "released")];
  if (f.schoolYearId) conds.push(eq(gradeSubmissions.schoolYearId, f.schoolYearId));
  if (f.termId) conds.push(eq(gradeSubmissions.termId, f.termId));
  const sub = db
    .select({
      program: enrollments.program,
      avg: sql<string>`ROUND(AVG((${gradeEntries.numericGrade})::numeric), 2)`.as("avg"),
      failCount: sql<number>`count(*) filter (where (${gradeEntries.numericGrade})::numeric < ${PASS_THRESHOLD})::int`.as("fail_count"),
      total: sql<number>`count(*)::int`.as("total"),
    })
    .from(gradeEntries)
    .innerJoin(gradeSubmissions, eq(gradeEntries.submissionId, gradeSubmissions.id))
    .innerJoin(enrollments, eq(gradeEntries.enrollmentId, enrollments.id))
    .where(and(...conds))
    .groupBy(enrollments.program)
    .as("prog");
  return db
    .select()
    .from(sub)
    .where(sql`${sub.total} > 0`)
    .orderBy(sql`(${sub.failCount})::int desc`)
    .limit(limit);
}

// ---------- Finance Overview ----------

export async function getDeanTotalAssessed(f: DeanFilters) {
  const conds = [eq(assessments.status, "posted")];
  if (f.schoolYearId) conds.push(eq(enrollments.schoolYearId, f.schoolYearId));
  if (f.termId) conds.push(eq(enrollments.termId, f.termId));
  if (f.program) conds.push(eq(enrollments.program, f.program));
  const [row] = await db
    .select({ total: sql<string>`COALESCE(SUM(${assessments.total}::numeric), 0)::text` })
    .from(assessments)
    .innerJoin(enrollments, eq(assessments.enrollmentId, enrollments.id))
    .where(and(...conds));
  return row?.total ?? "0";
}

export async function getDeanTotalCollected(f: DeanFilters) {
  const conds = [eq(payments.status, "posted")];
  if (f.schoolYearId) conds.push(eq(enrollments.schoolYearId, f.schoolYearId));
  if (f.termId) conds.push(eq(enrollments.termId, f.termId));
  if (f.program) conds.push(eq(enrollments.program, f.program));
  const [row] = await db
    .select({ total: sql<string>`COALESCE(SUM(${payments.amount}::numeric), 0)::text` })
    .from(payments)
    .innerJoin(enrollments, eq(payments.enrollmentId, enrollments.id))
    .where(and(...conds));
  return row?.total ?? "0";
}

export async function getDeanOutstandingBalances(f: DeanFilters) {
  const conds = [eq(enrollments.status, "approved")];
  if (f.schoolYearId) conds.push(eq(enrollments.schoolYearId, f.schoolYearId));
  if (f.termId) conds.push(eq(enrollments.termId, f.termId));
  if (f.program) conds.push(eq(enrollments.program, f.program));
  const [row] = await db
    .select({ total: sql<string>`COALESCE(SUM(${enrollmentFinanceStatus.balance}::numeric), 0)::text` })
    .from(enrollmentFinanceStatus)
    .innerJoin(enrollments, eq(enrollmentFinanceStatus.enrollmentId, enrollments.id))
    .where(and(...conds));
  return row?.total ?? "0";
}

export async function getDeanClearanceRate(f: DeanFilters) {
  const conds = [eq(enrollments.status, "approved")];
  if (f.schoolYearId) conds.push(eq(enrollments.schoolYearId, f.schoolYearId));
  if (f.termId) conds.push(eq(enrollments.termId, f.termId));
  if (f.program) conds.push(eq(enrollments.program, f.program));
  const [allRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(enrollments)
    .innerJoin(enrollmentFinanceStatus, eq(enrollments.id, enrollmentFinanceStatus.enrollmentId))
    .where(and(...conds));
  const [clearedRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(enrollments)
    .innerJoin(enrollmentFinanceStatus, eq(enrollments.id, enrollmentFinanceStatus.enrollmentId))
    .where(and(...conds, eq(enrollmentFinanceStatus.status, "cleared")));
  const total = allRow?.count ?? 0;
  const cleared = clearedRow?.count ?? 0;
  return { total, cleared, rate: total > 0 ? (cleared / total) * 100 : 0 };
}

export async function getDeanFinanceByProgram(f: DeanFilters) {
  const conds = [eq(enrollments.status, "approved")];
  if (f.schoolYearId) conds.push(eq(enrollments.schoolYearId, f.schoolYearId));
  if (f.termId) conds.push(eq(enrollments.termId, f.termId));
  return db
    .select({
      program: enrollments.program,
      totalBalance: sql<string>`COALESCE(SUM(${enrollmentFinanceStatus.balance}::numeric), 0)::text`.as("total_balance"),
      clearedCount: sql<number>`count(*) filter (where ${enrollmentFinanceStatus.status} = 'cleared')::int`.as("cleared_count"),
      totalCount: sql<number>`count(*)::int`.as("total_count"),
    })
    .from(enrollmentFinanceStatus)
    .innerJoin(enrollments, eq(enrollmentFinanceStatus.enrollmentId, enrollments.id))
    .where(and(...conds))
    .groupBy(enrollments.program)
    .orderBy(enrollments.program);
}

// ---------- Operations Monitor ----------

export async function getDeanPendingEnrollmentApprovals() {
  return db
    .select({
      id: enrollmentApprovals.id,
      enrollmentId: enrollmentApprovals.enrollmentId,
      status: enrollmentApprovals.status,
      actionDate: enrollmentApprovals.actionDate,
    })
    .from(enrollmentApprovals)
    .where(eq(enrollmentApprovals.status, "pending"))
    .orderBy(desc(enrollmentApprovals.actionDate))
    .limit(50);
}

export async function getDeanUnreleasedSubmissions(f: DeanFilters) {
  const conds = [sql`${gradeSubmissions.status} IN ('draft', 'submitted', 'returned', 'approved')`];
  if (f.schoolYearId) conds.push(eq(gradeSubmissions.schoolYearId, f.schoolYearId));
  if (f.termId) conds.push(eq(gradeSubmissions.termId, f.termId));
  return db
    .select({
      id: gradeSubmissions.id,
      subjectCode: subjects.code,
      sectionName: sections.name,
      gradingPeriodName: gradingPeriods.name,
      status: gradeSubmissions.status,
      updatedAt: gradeSubmissions.updatedAt,
    })
    .from(gradeSubmissions)
    .innerJoin(gradingPeriods, eq(gradeSubmissions.gradingPeriodId, gradingPeriods.id))
    .innerJoin(classSchedules, eq(gradeSubmissions.scheduleId, classSchedules.id))
    .innerJoin(subjects, eq(classSchedules.subjectId, subjects.id))
    .innerJoin(sections, eq(classSchedules.sectionId, sections.id))
    .where(and(...conds))
    .orderBy(desc(gradeSubmissions.updatedAt))
    .limit(100);
}

export async function getDeanRequirementVerificationsSubmitted() {
  return db
    .select({
      id: requirementVerifications.id,
      studentId: requirementVerifications.studentId,
      status: requirementVerifications.status,
      createdAt: requirementVerifications.createdAt,
    })
    .from(requirementVerifications)
    .where(eq(requirementVerifications.status, "submitted"))
    .orderBy(desc(requirementVerifications.createdAt))
    .limit(50);
}

export async function getDeanClearanceHolds(f: DeanFilters) {
  const conds = [
    eq(enrollments.status, "approved"),
    sql`${enrollmentFinanceStatus.status} IS DISTINCT FROM 'cleared'`,
  ];
  if (f.schoolYearId) conds.push(eq(enrollments.schoolYearId, f.schoolYearId));
  if (f.termId) conds.push(eq(enrollments.termId, f.termId));
  if (f.program) conds.push(eq(enrollments.program, f.program));
  return db
    .select({
      enrollmentId: enrollments.id,
      studentCode: students.studentCode,
      firstName: students.firstName,
      lastName: students.lastName,
      program: enrollments.program,
      balance: enrollmentFinanceStatus.balance,
      financeStatus: enrollmentFinanceStatus.status,
    })
    .from(enrollments)
    .innerJoin(students, eq(enrollments.studentId, students.id))
    .innerJoin(enrollmentFinanceStatus, eq(enrollments.id, enrollmentFinanceStatus.enrollmentId))
    .where(and(...conds))
    .orderBy(desc(enrollmentFinanceStatus.updatedAt))
    .limit(100);
}

// ---------- Governance Flags ----------

export async function getGovernanceFlags(filters?: { status?: "active" | "resolved" }) {
  const conds = filters?.status ? [eq(governanceFlags.status, filters.status)] : [];
  const base = db.select().from(governanceFlags).orderBy(desc(governanceFlags.createdAt));
  if (conds.length > 0) return base.where(and(...conds));
  return base;
}

export async function getGovernanceFlagsForEnrollment(enrollmentId: string) {
  return db
    .select()
    .from(governanceFlags)
    .where(and(eq(governanceFlags.enrollmentId, enrollmentId), eq(governanceFlags.status, "active")));
}

export async function getGovernanceFlagsForStudent(studentId: string) {
  return db
    .select()
    .from(governanceFlags)
    .where(and(eq(governanceFlags.studentId, studentId), eq(governanceFlags.status, "active")));
}

export async function createGovernanceFlag(values: {
  enrollmentId?: string | null;
  studentId?: string | null;
  flagType: "finance_hold" | "academic_hold" | "disciplinary_hold" | "exception";
  notes?: string | null;
  createdByUserId: string;
}) {
  const [row] = await db.insert(governanceFlags).values(values).returning();
  return row ?? null;
}

export async function resolveGovernanceFlag(
  flagId: string,
  resolvedByUserId: string,
  notes?: string | null
) {
  await db
    .update(governanceFlags)
    .set({
      status: "resolved",
      resolvedByUserId,
      resolvedAt: new Date(),
      notes: notes ?? governanceFlags.notes,
    })
    .where(eq(governanceFlags.id, flagId));
}
