import { db } from "@/lib/db";
import type { Role } from "@/db/schema";
import {
  userProfile,
  students,
  enrollments,
  studentBillingView,
  studentGradesView,
  studentScheduleView,
  subjects,
  sections,
  pendingStudentApplications,
  studentAddresses,
  schoolYears,
  terms,
  classSchedules,
  scheduleDays,
  requirements,
  requirementVerifications,
  announcements,
  enrollmentApprovals,
} from "@/db/schema";
import { eq, and, desc, sql, or, like, isNull } from "drizzle-orm";

// ============ Auth / User ============

export async function getUserProfileByUserId(userId: string) {
  const [profile] = await db
    .select()
    .from(userProfile)
    .where(eq(userProfile.userId, userId))
    .limit(1);
  return profile ?? null;
}

export async function createUserProfile(values: {
  userId: string;
  email?: string | null;
  fullName?: string | null;
  role: Role;
}) {
  return db.insert(userProfile).values(values);
}

export async function getProfileAndStudentByUserId(userId: string) {
  const [profile] = await db
    .select()
    .from(userProfile)
    .where(eq(userProfile.userId, userId))
    .limit(1);

  if (!profile) return null;

  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.userProfileId, profile.id))
    .limit(1);

  return { profile, student: student ?? null };
}

// ============ Pending Applications ============

export async function hasPendingApplicationByUserProfileId(userProfileId: string) {
  const [row] = await db
    .select({ id: pendingStudentApplications.id })
    .from(pendingStudentApplications)
    .where(
      and(
        eq(pendingStudentApplications.userProfileId, userProfileId),
        eq(pendingStudentApplications.status, "pending")
      )
    )
    .limit(1);
  return !!row;
}

export async function getPendingApplicationsList() {
  return db
    .select({
      id: pendingStudentApplications.id,
      firstName: pendingStudentApplications.firstName,
      middleName: pendingStudentApplications.middleName,
      lastName: pendingStudentApplications.lastName,
      program: pendingStudentApplications.program,
      yearLevel: pendingStudentApplications.yearLevel,
      createdAt: pendingStudentApplications.createdAt,
      email: userProfile.email,
    })
    .from(pendingStudentApplications)
    .innerJoin(
      userProfile,
      eq(pendingStudentApplications.userProfileId, userProfile.id)
    )
    .where(eq(pendingStudentApplications.status, "pending"))
    .orderBy(desc(pendingStudentApplications.createdAt));
}

export async function getPendingApplicationById(id: string) {
  const [row] = await db
    .select({
      id: pendingStudentApplications.id,
      firstName: pendingStudentApplications.firstName,
      middleName: pendingStudentApplications.middleName,
      lastName: pendingStudentApplications.lastName,
      birthday: pendingStudentApplications.birthday,
      program: pendingStudentApplications.program,
      yearLevel: pendingStudentApplications.yearLevel,
      street: pendingStudentApplications.street,
      province: pendingStudentApplications.province,
      municipality: pendingStudentApplications.municipality,
      barangay: pendingStudentApplications.barangay,
      notes: pendingStudentApplications.notes,
      status: pendingStudentApplications.status,
      createdAt: pendingStudentApplications.createdAt,
      email: userProfile.email,
    })
    .from(pendingStudentApplications)
    .innerJoin(
      userProfile,
      eq(pendingStudentApplications.userProfileId, userProfile.id)
    )
    .where(eq(pendingStudentApplications.id, id))
    .limit(1);
  return row ?? null;
}

export async function getPendingApplicationByIdForAction(id: string) {
  const [row] = await db
    .select()
    .from(pendingStudentApplications)
    .where(eq(pendingStudentApplications.id, id))
    .limit(1);
  return row ?? null;
}

export async function insertPendingApplication(values: {
  userProfileId: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  birthday?: string | null;
  program?: string | null;
  yearLevel?: string | null;
  street?: string | null;
  province?: string | null;
  municipality?: string | null;
  barangay?: string | null;
  notes?: string | null;
}) {
  return db.insert(pendingStudentApplications).values({
    ...values,
    status: "pending",
  });
}

export async function updatePendingApplicationStatus(
  id: string,
  status: "approved" | "rejected",
  actionBy: string
) {
  return db
    .update(pendingStudentApplications)
    .set({
      status,
      actionBy,
      actionDate: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(pendingStudentApplications.id, id));
}

// ============ Students ============

export async function insertStudent(values: {
  userProfileId: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  birthday?: string | null;
  program?: string | null;
  yearLevel?: string | null;
}) {
  const [student] = await db.insert(students).values(values).returning();
  return student ?? null;
}

export async function insertStudentAddress(values: {
  studentId: string;
  street?: string | null;
  province?: string | null;
  municipality?: string | null;
  barangay?: string | null;
}) {
  return db.insert(studentAddresses).values(values);
}

// ============ Student Portal - Dashboard ============

export async function getEnrollmentByStudentId(studentId: string) {
  const [row] = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.studentId, studentId))
    .limit(1);
  return row ?? null;
}

export async function getBillingByStudentId(studentId: string) {
  const [row] = await db
    .select({
      enrollmentId: studentBillingView.enrollmentId,
      totalFee: studentBillingView.totalFee,
      totalAmountDue: studentBillingView.totalAmountDue,
      balance: studentBillingView.balance,
      tuitionFeeBalance: studentBillingView.tuitionFeeBalance,
      miscFeeBalance: studentBillingView.miscFeeBalance,
      amountPaid: studentBillingView.amountPaid,
    })
    .from(studentBillingView)
    .innerJoin(
      enrollments,
      eq(studentBillingView.enrollmentId, enrollments.id)
    )
    .where(eq(enrollments.studentId, studentId))
    .limit(1);
  return row ?? null;
}

export async function getGradesByStudentId(studentId: string, limit = 4) {
  return db
    .select()
    .from(studentGradesView)
    .where(eq(studentGradesView.studentId, studentId))
    .limit(limit);
}

export async function getScheduleByStudentId(studentId: string, limit = 3) {
  return db
    .select()
    .from(studentScheduleView)
    .where(eq(studentScheduleView.studentId, studentId))
    .limit(limit);
}

// ============ Student Portal - Grades ============

export async function getGradesWithSubjectsByStudentId(
  studentId: string,
  limit = 20
) {
  return db
    .select({
      subjectCode: subjects.code,
      subjectDescription: subjects.description,
      grade: studentGradesView.grade,
      levelType: studentGradesView.levelType,
    })
    .from(studentGradesView)
    .leftJoin(subjects, eq(studentGradesView.subjectId, subjects.id))
    .where(eq(studentGradesView.studentId, studentId))
    .limit(limit);
}

// ============ Student Portal - Billing ============

export async function getBillingRowsByStudentId(
  studentId: string,
  limit = 10
) {
  return db
    .select({
      enrollmentId: studentBillingView.enrollmentId,
      totalFee: studentBillingView.totalFee,
      totalAmountDue: studentBillingView.totalAmountDue,
      balance: studentBillingView.balance,
      amountPaid: studentBillingView.amountPaid,
    })
    .from(studentBillingView)
    .innerJoin(
      enrollments,
      eq(studentBillingView.enrollmentId, enrollments.id)
    )
    .where(eq(enrollments.studentId, studentId))
    .limit(limit);
}

// ============ Student Portal - Schedule ============

export async function getScheduleWithDetailsByStudentId(
  studentId: string,
  limit = 40
) {
  return db
    .select({
      day: studentScheduleView.day,
      timeIn: studentScheduleView.timeIn,
      timeOut: studentScheduleView.timeOut,
      room: studentScheduleView.room,
      subjectCode: subjects.code,
      subjectDescription: subjects.description,
      sectionName: sections.name,
    })
    .from(studentScheduleView)
    .leftJoin(subjects, eq(studentScheduleView.subjectId, subjects.id))
    .leftJoin(sections, eq(studentScheduleView.sectionId, sections.id))
    .where(eq(studentScheduleView.studentId, studentId))
    .limit(limit);
}

// ============ Registrar Dashboard ============

export async function getPendingApplicationsCount() {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(pendingStudentApplications)
    .where(eq(pendingStudentApplications.status, "pending"));
  return row?.count ?? 0;
}

export async function getApprovedTodayCount() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(pendingStudentApplications)
    .where(
      and(
        eq(pendingStudentApplications.status, "approved"),
        sql`${pendingStudentApplications.actionDate} >= ${today}`
      )
    );
  return row?.count ?? 0;
}

export async function getRejectedTodayCount() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(pendingStudentApplications)
    .where(
      and(
        eq(pendingStudentApplications.status, "rejected"),
        sql`${pendingStudentApplications.actionDate} >= ${today}`
      )
    );
  return row?.count ?? 0;
}

// ============ Registrar - Enrollments ============

export async function getPendingEnrollmentApprovalsCount() {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(enrollments)
    .where(eq(enrollments.status, "pending_approval"));
  return row?.count ?? 0;
}

export async function getActiveEnrollmentsCount() {
  const [activeSy] = await db
    .select()
    .from(schoolYears)
    .where(eq(schoolYears.isActive, true))
    .limit(1);
  if (!activeSy) return 0;
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.schoolYearId, activeSy.id),
        eq(enrollments.status, "approved")
    ));
  return row?.count ?? 0;
}

export async function getRequirementVerificationsAwaitingCount() {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(requirementVerifications)
    .where(eq(requirementVerifications.status, "submitted"));
  return row?.count ?? 0;
}

export async function getAnnouncementsThisWeekCount() {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(announcements)
    .where(sql`${announcements.createdAt} >= ${weekAgo}`);
  return row?.count ?? 0;
}

export async function getLatestPendingEnrollmentApprovals(limit = 5) {
  return db
    .select({
      id: enrollments.id,
      studentId: enrollments.studentId,
      schoolYearId: enrollments.schoolYearId,
      termId: enrollments.termId,
      program: enrollments.program,
      yearLevel: enrollments.yearLevel,
      createdAt: enrollments.createdAt,
      firstName: students.firstName,
      middleName: students.middleName,
      lastName: students.lastName,
      studentCode: students.studentCode,
    })
    .from(enrollments)
    .innerJoin(students, eq(enrollments.studentId, students.id))
    .where(eq(enrollments.status, "pending_approval"))
    .orderBy(desc(enrollments.createdAt))
    .limit(limit);
}

export async function getRecentAnnouncements(limit = 5) {
  return db
    .select({
      id: announcements.id,
      title: announcements.title,
      audience: announcements.audience,
      createdAt: announcements.createdAt,
    })
    .from(announcements)
    .orderBy(desc(announcements.createdAt))
    .limit(limit);
}

export async function getPendingEnrollmentApprovalsList(search?: string) {
  const base = db
    .select({
      id: enrollments.id,
      studentId: enrollments.studentId,
      schoolYearName: schoolYears.name,
      termName: terms.name,
      program: enrollments.program,
      yearLevel: enrollments.yearLevel,
      createdAt: enrollments.createdAt,
      firstName: students.firstName,
      middleName: students.middleName,
      lastName: students.lastName,
      studentCode: students.studentCode,
    })
    .from(enrollments)
    .innerJoin(students, eq(enrollments.studentId, students.id))
    .innerJoin(schoolYears, eq(enrollments.schoolYearId, schoolYears.id))
    .innerJoin(terms, eq(enrollments.termId, terms.id))
    .where(eq(enrollments.status, "pending_approval"))
    .orderBy(desc(enrollments.createdAt));

  if (search?.trim()) {
    const s = `%${search.trim()}%`;
    return db
      .select({
        id: enrollments.id,
        studentId: enrollments.studentId,
        schoolYearName: schoolYears.name,
        termName: terms.name,
        program: enrollments.program,
        yearLevel: enrollments.yearLevel,
        createdAt: enrollments.createdAt,
        firstName: students.firstName,
        middleName: students.middleName,
        lastName: students.lastName,
        studentCode: students.studentCode,
      })
      .from(enrollments)
      .innerJoin(students, eq(enrollments.studentId, students.id))
      .innerJoin(schoolYears, eq(enrollments.schoolYearId, schoolYears.id))
      .innerJoin(terms, eq(enrollments.termId, terms.id))
      .where(
        and(
          eq(enrollments.status, "pending_approval"),
          or(
            like(students.firstName, s),
            like(students.lastName, s),
            sql`${students.studentCode}::text ILIKE ${s}`
          )
        )
      )
      .orderBy(desc(enrollments.createdAt));
  }
  return base;
}

export async function getEnrollmentById(id: string) {
  const [row] = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.id, id))
    .limit(1);
  return row ?? null;
}

export async function approveEnrollmentById(
  enrollmentId: string,
  reviewedByUserId: string,
  remarks?: string
) {
  await db
    .update(enrollments)
    .set({ status: "approved", updatedAt: new Date() })
    .where(eq(enrollments.id, enrollmentId));

  const [existing] = await db
    .select()
    .from(enrollmentApprovals)
    .where(eq(enrollmentApprovals.enrollmentId, enrollmentId))
    .limit(1);

  const now = new Date();
  if (existing) {
    await db
      .update(enrollmentApprovals)
      .set({
        status: "approved",
        actionBy: undefined,
        reviewedByUserId,
        actionDate: now,
        reviewedAt: now,
        remarks: remarks ?? null,
      })
      .where(eq(enrollmentApprovals.enrollmentId, enrollmentId));
  } else {
    await db.insert(enrollmentApprovals).values({
      enrollmentId,
      status: "approved",
      reviewedByUserId,
      reviewedAt: now,
      remarks: remarks ?? null,
    });
  }
}

export async function rejectEnrollmentById(
  enrollmentId: string,
  reviewedByUserId: string,
  remarks?: string
) {
  await db
    .update(enrollments)
    .set({ status: "rejected", updatedAt: new Date() })
    .where(eq(enrollments.id, enrollmentId));

  const now = new Date();
  const [existing] = await db
    .select()
    .from(enrollmentApprovals)
    .where(eq(enrollmentApprovals.enrollmentId, enrollmentId))
    .limit(1);

  if (existing) {
    await db
      .update(enrollmentApprovals)
      .set({
        status: "rejected",
        reviewedByUserId,
        reviewedAt: now,
        remarks: remarks ?? null,
      })
      .where(eq(enrollmentApprovals.enrollmentId, enrollmentId));
  } else {
    await db.insert(enrollmentApprovals).values({
      enrollmentId,
      status: "rejected",
      reviewedByUserId,
      reviewedAt: now,
      remarks: remarks ?? null,
    });
  }
}

export async function createEnrollment(values: {
  studentId: string;
  schoolYearId: string;
  termId: string;
  program?: string | null;
  yearLevel?: string | null;
  sectionId?: string | null;
}) {
  return db.insert(enrollments).values({
    ...values,
    status: "pending_approval",
  });
}

export async function getSchoolYearsList() {
  return db.select().from(schoolYears).orderBy(desc(schoolYears.name));
}

export async function getTermsBySchoolYearId(schoolYearId: string) {
  return db
    .select()
    .from(terms)
    .where(eq(terms.schoolYearId, schoolYearId))
    .orderBy(terms.name);
}

export async function getTermsList() {
  return db.select().from(terms).orderBy(terms.name);
}

export async function getActiveSchoolYear() {
  const [row] = await db
    .select()
    .from(schoolYears)
    .where(eq(schoolYears.isActive, true))
    .limit(1);
  return row ?? null;
}

export async function getStudentsList(search?: string) {
  const baseWhere = isNull(students.deletedAt);
  if (search?.trim()) {
    const s = `%${search.trim()}%`;
    return db
      .select()
      .from(students)
      .where(
        and(
          baseWhere,
          or(
            like(students.firstName, s),
            like(students.lastName, s),
            sql`${students.studentCode}::text ILIKE ${s}`
          )
        )
      )
      .orderBy(desc(students.createdAt));
  }
  return db.select().from(students).where(baseWhere).orderBy(desc(students.createdAt));
}

export async function getStudentById(id: string) {
  const [row] = await db
    .select()
    .from(students)
    .where(and(eq(students.id, id), isNull(students.deletedAt)))
    .limit(1);
  return row ?? null;
}

export async function getEnrollmentsList(filters?: {
  studentId?: string;
  schoolYearId?: string;
  termId?: string;
}) {
  const conds: ReturnType<typeof eq>[] = [];
  if (filters?.studentId) conds.push(eq(enrollments.studentId, filters.studentId));
  if (filters?.schoolYearId) conds.push(eq(enrollments.schoolYearId, filters.schoolYearId));
  if (filters?.termId) conds.push(eq(enrollments.termId, filters.termId));

  const base = db
    .select({
      id: enrollments.id,
      studentId: enrollments.studentId,
      schoolYearName: schoolYears.name,
      termName: terms.name,
      program: enrollments.program,
      yearLevel: enrollments.yearLevel,
      status: enrollments.status,
      createdAt: enrollments.createdAt,
      firstName: students.firstName,
      middleName: students.middleName,
      lastName: students.lastName,
      studentCode: students.studentCode,
    })
    .from(enrollments)
    .innerJoin(students, eq(enrollments.studentId, students.id))
    .innerJoin(schoolYears, eq(enrollments.schoolYearId, schoolYears.id))
    .innerJoin(terms, eq(enrollments.termId, terms.id))
    .orderBy(desc(enrollments.createdAt));

  if (conds.length > 0) {
    return base.where(and(...conds));
  }
  return base;
}

export async function getEnrollmentsByStudentId(studentId: string) {
  return db
    .select({
      id: enrollments.id,
      schoolYearName: schoolYears.name,
      termName: terms.name,
      program: enrollments.program,
      yearLevel: enrollments.yearLevel,
      status: enrollments.status,
      createdAt: enrollments.createdAt,
    })
    .from(enrollments)
    .innerJoin(schoolYears, eq(enrollments.schoolYearId, schoolYears.id))
    .innerJoin(terms, eq(enrollments.termId, terms.id))
    .where(eq(enrollments.studentId, studentId))
    .orderBy(desc(enrollments.createdAt));
}

export async function getSubjectsList() {
  return db.select().from(subjects).orderBy(subjects.code);
}

export async function createSubject(values: {
  code: string;
  description: string;
  units?: string | number | null;
  active?: boolean;
}) {
  return db.insert(subjects).values({
    ...values,
    active: values.active ?? true,
  });
}

export async function updateSubject(
  id: string,
  values: {
    code?: string;
    description?: string;
    units?: string | number | null;
    active?: boolean;
  }
) {
  return db.update(subjects).set({ ...values, updatedAt: new Date() }).where(eq(subjects.id, id));
}

export async function toggleSubjectActive(id: string, active: boolean) {
  return db.update(subjects).set({ active, updatedAt: new Date() }).where(eq(subjects.id, id));
}

export async function getSectionsList() {
  return db.select().from(sections).orderBy(sections.name);
}

export async function createSection(values: {
  name: string;
  yearLevel?: string | null;
  program?: string | null;
  active?: boolean;
}) {
  return db.insert(sections).values({
    ...values,
    active: values.active ?? true,
  });
}

export async function updateSection(
  id: string,
  values: {
    name?: string;
    yearLevel?: string | null;
    program?: string | null;
    active?: boolean;
  }
) {
  return db.update(sections).set({ ...values, updatedAt: new Date() }).where(eq(sections.id, id));
}

export async function getRequirementsList(activeOnly = true) {
  const q = db.select().from(requirements).orderBy(requirements.name);
  if (activeOnly) {
    return db
      .select()
      .from(requirements)
      .where(eq(requirements.active, true))
      .orderBy(requirements.name);
  }
  return q;
}

export async function getAnnouncementsList(limit = 50) {
  return db
    .select()
    .from(announcements)
    .orderBy(desc(announcements.createdAt))
    .limit(limit);
}

export async function getRequirementVerificationsSubmitted() {
  return db
    .select({
      id: requirementVerifications.id,
      studentId: requirementVerifications.studentId,
      requirementId: requirementVerifications.requirementId,
      status: requirementVerifications.status,
      requirementName: requirements.name,
      firstName: students.firstName,
      lastName: students.lastName,
      studentCode: students.studentCode,
    })
    .from(requirementVerifications)
    .innerJoin(requirements, eq(requirementVerifications.requirementId, requirements.id))
    .innerJoin(students, eq(requirementVerifications.studentId, students.id))
    .where(eq(requirementVerifications.status, "submitted"))
    .orderBy(desc(requirementVerifications.updatedAt));
}

export async function getSchedulesList(filters?: {
  schoolYearId?: string;
  termId?: string;
  sectionId?: string;
}) {
  const conds: ReturnType<typeof eq>[] = [];
  if (filters?.schoolYearId) conds.push(eq(classSchedules.schoolYearId, filters.schoolYearId));
  if (filters?.termId) conds.push(eq(classSchedules.termId, filters.termId));
  if (filters?.sectionId) conds.push(eq(classSchedules.sectionId, filters.sectionId));

  const base = db
    .select({
      id: classSchedules.id,
      schoolYearName: schoolYears.name,
      termName: terms.name,
      sectionName: sections.name,
      subjectCode: subjects.code,
      subjectDescription: subjects.description,
      teacherName: classSchedules.teacherName,
      timeIn: classSchedules.timeIn,
      timeOut: classSchedules.timeOut,
      room: classSchedules.room,
    })
    .from(classSchedules)
    .innerJoin(schoolYears, eq(classSchedules.schoolYearId, schoolYears.id))
    .innerJoin(terms, eq(classSchedules.termId, terms.id))
    .innerJoin(sections, eq(classSchedules.sectionId, sections.id))
    .innerJoin(subjects, eq(classSchedules.subjectId, subjects.id));

  if (conds.length > 0) {
    return base.where(and(...conds)).orderBy(classSchedules.timeIn);
  }
  return base.orderBy(classSchedules.timeIn);
}

export async function createScheduleWithDays(values: {
  schoolYearId: string;
  termId: string;
  sectionId: string;
  subjectId: string;
  teacherName?: string | null;
  room?: string | null;
  timeIn?: string | null;
  timeOut?: string | null;
  days: string[];
}) {
  const { days, ...scheduleValues } = values;
  const [schedule] = await db
    .insert(classSchedules)
    .values({
      ...scheduleValues,
      timeIn: scheduleValues.timeIn ?? null,
      timeOut: scheduleValues.timeOut ?? null,
      room: scheduleValues.room ?? null,
      teacherName: scheduleValues.teacherName ?? null,
    })
    .returning();
  if (schedule && days.length > 0) {
    await db.insert(scheduleDays).values(
      days.map((day) => ({
        scheduleId: schedule.id,
        day,
        isActive: true,
      }))
    );
  }
  return schedule;
}

export async function deleteSchedule(id: string) {
  await db.delete(scheduleDays).where(eq(scheduleDays.scheduleId, id));
  await db.delete(classSchedules).where(eq(classSchedules.id, id));
}

export async function createRequirement(values: {
  name: string;
  description?: string | null;
  active?: boolean;
}) {
  return db.insert(requirements).values({
    ...values,
    active: values.active ?? true,
  });
}

export async function updateRequirement(
  id: string,
  values: { name?: string; description?: string | null; active?: boolean }
) {
  return db
    .update(requirements)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(requirements.id, id));
}

export async function verifyRequirement(
  id: string,
  verifiedByUserId: string
) {
  return db
    .update(requirementVerifications)
    .set({
      status: "verified",
      verifiedByUserId,
      verifiedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(requirementVerifications.id, id));
}

export async function rejectRequirement(id: string, notes: string) {
  return db
    .update(requirementVerifications)
    .set({
      status: "rejected",
      notes,
      updatedAt: new Date(),
    })
    .where(eq(requirementVerifications.id, id));
}

export async function createAnnouncement(values: {
  title: string;
  body: string;
  audience?: string;
  createdByUserId: string;
}) {
  return db.insert(announcements).values({
    ...values,
    audience: (values.audience as "all" | "students" | "teachers" | "registrar" | "finance" | "program_head" | "dean") ?? "all",
  });
}

export async function updateAnnouncement(
  id: string,
  values: { title?: string; body?: string; audience?: string }
) {
  return db
    .update(announcements)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(announcements.id, id));
}

export async function deleteAnnouncement(id: string) {
  return db.delete(announcements).where(eq(announcements.id, id));
}
