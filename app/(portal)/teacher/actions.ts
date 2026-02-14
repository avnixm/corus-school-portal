// path: app/(portal)/teacher/actions.ts
"use server";

import { redirect } from "next/navigation";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import {
  getTeacherByUserId,
  getTeacherByUserProfileId,
  createTeacher,
  updateTeacherUserId,
  listTeacherAssignmentsForTeacher,
  getActiveSchoolYear,
  getActiveTerm,
  getGradeSubmissionByScheduleAndPeriod,
  createGradeSubmission,
  getGradeEntriesBySubmissionId,
  upsertGradeEntries,
  submitGradesForApproval,
  getScheduleById,
  getEnrollmentsBySectionAndTerm,
  getGradingPeriodsBySchoolYearTerm,
  getGradingPeriodById,
  isTeacherAssignedToSchedule,
  listGradeSubmissionsForTeacher,
  getTodaysClassesForTeacher,
  type GradeEntryInput,
} from "@/db/queries";
import { getUserProfileByUserId } from "@/db/queries";

export type TeacherContext = {
  teacherId: string;
  userId: string;
};

export async function ensureTeacherForCurrentUser(): Promise<TeacherContext | null> {
  const user = await getCurrentUserWithRole();
  if (!user || (user.role !== "teacher" && user.role !== "admin")) return null;

  let teacher = await getTeacherByUserId(user.userId);
  if (teacher) {
    if (!teacher.userId) {
      await updateTeacherUserId(teacher.id, user.userId);
    }
    return { teacherId: teacher.id, userId: user.userId };
  }

  const profile = await getUserProfileByUserId(user.userId);
  if (profile) {
    teacher = await getTeacherByUserProfileId(profile.id);
    if (teacher) {
      await updateTeacherUserId(teacher.id, user.userId);
      return { teacherId: teacher.id, userId: user.userId };
    }
  }

  const nameParts = (user.name || "Teacher").trim().split(/\s+/);
  const firstName = nameParts[0] ?? "Teacher";
  const lastName = nameParts.slice(1).join(" ") || "User";
  const newTeacher = await createTeacher({
    userId: user.userId,
    userProfileId: profile?.id ?? null,
    firstName,
    lastName,
    email: user.email ?? null,
    active: true,
  });
  if (!newTeacher) return null;
  return { teacherId: newTeacher.id, userId: user.userId };
}

export async function listMyClasses(filters?: { schoolYearId?: string; termId?: string }) {
  const ctx = await ensureTeacherForCurrentUser();
  if (!ctx) return { classes: [], schoolYear: null, term: null, schoolYears: [], terms: [] };
  const syActive = await getActiveSchoolYear();
  const termActive = await getActiveTerm();
  const schoolYearId = filters?.schoolYearId ?? syActive?.id;
  const termId = filters?.termId ?? termActive?.id;
  if (!schoolYearId || !termId) {
    const { getSchoolYearsList, getTermsBySchoolYearId } = await import("@/db/queries");
    const [schoolYears, terms] = await Promise.all([
      getSchoolYearsList(),
      schoolYearId ? getTermsBySchoolYearId(schoolYearId) : Promise.resolve([]),
    ]);
    return {
      classes: [],
      schoolYear: syActive ?? null,
      term: termActive ?? null,
      schoolYears,
      terms,
    };
  }
  const classes = await listTeacherAssignmentsForTeacher(ctx.teacherId, {
    schoolYearId,
    termId,
  });
  const { getSchoolYearsList, getTermsBySchoolYearId } = await import("@/db/queries");
  const [schoolYears, terms] = await Promise.all([
    getSchoolYearsList(),
    getTermsBySchoolYearId(schoolYearId),
  ]);
  const schoolYear = schoolYears.find((sy) => sy.id === schoolYearId) ?? syActive ?? null;
  const term = terms.find((t) => t.id === termId) ?? termActive ?? null;
  return { classes, schoolYear, term, schoolYears, terms };
}

export async function getClassesWithPeriodStatuses(filters?: {
  schoolYearId?: string;
  termId?: string;
}) {
  const list = await listMyClasses(filters);
  if (!list.classes.length || !list.schoolYear || !list.term) {
    return {
      ...list,
      classesWithStatuses: [],
    };
  }
  const { getGradingPeriodsBySchoolYearTerm, getGradeSubmissionByScheduleAndPeriod } =
    await import("@/db/queries");
  const periods = await getGradingPeriodsBySchoolYearTerm(list.schoolYear.id, list.term.id);
  const classesWithStatuses = await Promise.all(
    list.classes.map(async (c) => {
      const periodStatuses = await Promise.all(
        periods.map(async (p) => {
          const sub = await getGradeSubmissionByScheduleAndPeriod(c.scheduleId, p.id);
          return { periodId: p.id, periodName: p.name, status: sub?.status ?? "none" };
        })
      );
      return { ...c, periodStatuses };
    })
  );
  return { ...list, classesWithStatuses };
}

export async function getOrCreateSubmissionDraft(scheduleId: string, periodId: string) {
  const ctx = await ensureTeacherForCurrentUser();
  if (!ctx) return { error: "Unauthorized", submission: null };
  const isAssigned = await isTeacherAssignedToSchedule(ctx.teacherId, scheduleId);
  if (!isAssigned) return { error: "You are not assigned to this class", submission: null };

  const schedule = await getScheduleById(scheduleId);
  if (!schedule) return { error: "Schedule not found", submission: null };
  const period = await getGradingPeriodById(periodId);
  if (!period) return { error: "Grading period not found", submission: null };
  if (
    period.schoolYearId !== schedule.schoolYearId ||
    period.termId !== schedule.termId
  ) {
    return { error: "Grading period does not match schedule", submission: null };
  }

  let submission = await getGradeSubmissionByScheduleAndPeriod(scheduleId, periodId);
  if (!submission) {
    const created = await createGradeSubmission({
      scheduleId,
      schoolYearId: schedule.schoolYearId,
      termId: schedule.termId,
      gradingPeriodId: periodId,
      teacherId: ctx.teacherId,
    });
    if (!created) return { error: "Failed to create submission", submission: null };
    submission = created;
  }
  if (submission.teacherId !== ctx.teacherId)
    return { error: "You are not the teacher for this submission", submission: null };
  return { error: null, submission };
}

export async function upsertGradeEntriesAction(
  submissionId: string,
  entries: GradeEntryInput[]
) {
  const ctx = await ensureTeacherForCurrentUser();
  if (!ctx) return { error: "Unauthorized" };
  const { getGradeSubmissionById } = await import("@/db/queries");
  const sub = await getGradeSubmissionById(submissionId);
  if (!sub) return { error: "Submission not found" };
  if (sub.teacherId !== ctx.teacherId) return { error: "Not your submission" };
  if (sub.status !== "draft" && sub.status !== "returned")
    return { error: "Submission is locked for editing" };
  await upsertGradeEntries(submissionId, entries);
  return { error: null };
}

function parseGrade(value: string | null | undefined): number | null {
  if (value == null || String(value).trim() === "") return null;
  const n = Number.parseFloat(String(value).trim());
  return Number.isFinite(n) ? n : null;
}

export async function submitGradesAction(submissionId: string) {
  const ctx = await ensureTeacherForCurrentUser();
  if (!ctx) return { error: "Unauthorized" };
  const { getGradeSubmissionById, getGradeEntriesBySubmissionId } = await import("@/db/queries");
  const sub = await getGradeSubmissionById(submissionId);
  if (!sub) return { error: "Submission not found" };
  if (sub.teacherId !== ctx.teacherId) return { error: "Not your submission" };
  if (sub.status !== "draft" && sub.status !== "returned")
    return { error: "Submission is not in draft or returned state" };
  const entries = await getGradeEntriesBySubmissionId(submissionId);
  for (const e of entries) {
    const n = parseGrade(e.numericGrade);
    if (n !== null && (n < 0 || n > 100))
      return { error: `Grade must be between 0 and 100 (found ${e.numericGrade} for student).` };
  }
  await submitGradesForApproval(submissionId);
  return { error: null };
}

export async function getTeacherDashboardData() {
  const ctx = await ensureTeacherForCurrentUser();
  if (!ctx) return null;
  const sy = await getActiveSchoolYear();
  const term = await getActiveTerm();
  const todayShort = new Date().toLocaleDateString("en-US", { weekday: "short" });
  if (!sy || !term) {
    return {
      classesCount: 0,
      draftCount: 0,
      submittedCount: 0,
      returnedCount: 0,
      releasedCount: 0,
      classes: [],
      todaysClasses: [],
      recentSubmissions: [],
      returnedSubmissions: [],
      schoolYear: null,
      term: null,
    };
  }
  const [
    classes,
    draftSubs,
    submittedSubs,
    returnedSubs,
    releasedSubs,
    recentSubmissions,
    todaysClasses,
  ] = await Promise.all([
    listTeacherAssignmentsForTeacher(ctx.teacherId, {
      schoolYearId: sy.id,
      termId: term.id,
    }),
    listGradeSubmissionsForTeacher(ctx.teacherId, {
      schoolYearId: sy.id,
      termId: term.id,
      status: "draft",
    }),
    listGradeSubmissionsForTeacher(ctx.teacherId, {
      schoolYearId: sy.id,
      termId: term.id,
      status: "submitted",
    }),
    listGradeSubmissionsForTeacher(ctx.teacherId, {
      schoolYearId: sy.id,
      termId: term.id,
      status: "returned",
    }),
    listGradeSubmissionsForTeacher(ctx.teacherId, {
      schoolYearId: sy.id,
      termId: term.id,
      status: "released",
    }),
    listGradeSubmissionsForTeacher(ctx.teacherId, {
      schoolYearId: sy.id,
      termId: term.id,
    }),
    getTodaysClassesForTeacher(ctx.teacherId, todayShort, {
      schoolYearId: sy.id,
      termId: term.id,
    }),
  ]);
  return {
    classesCount: classes.length,
    draftCount: draftSubs.length,
    submittedCount: submittedSubs.length,
    returnedCount: returnedSubs.length,
    releasedCount: releasedSubs.length,
    classes,
    todaysClasses,
    recentSubmissions: recentSubmissions.slice(0, 5),
    returnedSubmissions: returnedSubs,
    schoolYear: sy,
    term,
  };
}

/** Returns roster for a class; verifies teacher is assigned via teacher_assignments. */
export async function getClassRoster(scheduleId: string) {
  const ctx = await ensureTeacherForCurrentUser();
  if (!ctx) return null;
  const isAssigned = await isTeacherAssignedToSchedule(ctx.teacherId, scheduleId);
  if (!isAssigned) return null;
  const schedule = await getScheduleById(scheduleId);
  if (!schedule) return null;
  return getEnrollmentsBySectionAndTerm(
    schedule.sectionId,
    schedule.termId,
    schedule.schoolYearId
  );
}

export async function getClassDetailData(scheduleId: string) {
  const ctx = await ensureTeacherForCurrentUser();
  if (!ctx) return null;
  const isAssigned = await isTeacherAssignedToSchedule(ctx.teacherId, scheduleId);
  if (!isAssigned) return null;
  const schedule = await getScheduleById(scheduleId);
  if (!schedule) return null;
  const periods = await getGradingPeriodsBySchoolYearTerm(
    schedule.schoolYearId,
    schedule.termId
  );
  const roster = await getEnrollmentsBySectionAndTerm(
    schedule.sectionId,
    schedule.termId,
    schedule.schoolYearId
  );
  const submissionsByPeriod: { periodId: string; periodName: string; status: string }[] = [];
  for (const p of periods) {
    const sub = await getGradeSubmissionByScheduleAndPeriod(scheduleId, p.id);
    submissionsByPeriod.push({
      periodId: p.id,
      periodName: p.name,
      status: sub?.status ?? "none",
    });
  }
  return { schedule, periods, roster, submissionsByPeriod };
}

export async function getGradebookData(scheduleId: string, periodId: string) {
  const result = await getOrCreateSubmissionDraft(scheduleId, periodId);
  if (result.error || !result.submission) return { error: result.error, submission: null, entries: [], schedule: null, periodName: null };
  const schedule = await getScheduleById(scheduleId);
  const period = await getGradingPeriodById(periodId);
  const entries = await getGradeEntriesBySubmissionId(result.submission.id);
  const roster = await getEnrollmentsBySectionAndTerm(
    schedule!.sectionId,
    schedule!.termId,
    schedule!.schoolYearId
  );
  const entryMap = new Map(entries.map((e) => [e.studentId, e]));
  const rows = roster.map((r) => {
    const entry = entryMap.get(r.studentId);
    return {
      studentId: r.studentId,
      enrollmentId: r.id,
      firstName: r.firstName,
      middleName: r.middleName,
      lastName: r.lastName,
      studentCode: r.studentCode,
      numericGrade: entry?.numericGrade ?? null,
      letterGrade: entry?.letterGrade ?? null,
      remarks: entry?.remarks ?? null,
      entryId: entry?.id,
    };
  });
  return {
    error: null,
    submission: result.submission,
    entries: rows,
    schedule,
    periodName: period?.name ?? "",
  };
}
