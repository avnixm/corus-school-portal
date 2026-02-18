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
  scheduleApprovals,
  scheduleTimeConfigs,
  requirements,
  requirementRules,
  requirementVerifications,
  studentRequirementSubmissions,
  requirementRequests,
  requirementFiles,
  announcements,
  enrollmentApprovals,
  enrollmentFinanceStatus,
  teacherAssignments,
  teacherSubjectPermissions,
  teacherCapabilityPackages,
  teacherSubjectCapabilities,
  gradingPeriods,
  gradeSubmissions,
  gradeEntries,
  programs,
  programHeadAssignments,
  systemSettings,
  auditLog,
  supportRequests,
  governanceFlags,
  feeSetups,
  feeSetupLines,
  feeSetupApprovals,
  assessments,
  assessmentLines,
  curriculumVersions,
  curriculumBlocks,
  curriculumBlockSubjects,
  classOfferings,
  studentClassEnrollments,
  enrollmentSubjects,
  adviserAssignments,
} from "@/db/schema";
import { eq, and, desc, asc, sql, or, like, isNull, gte, lte, inArray, isNotNull, ne } from "drizzle-orm";

// ============ Auth / User ============

export async function getUserProfileByUserId(userId: string) {
  const [profile] = await db
    .select()
    .from(userProfile)
    .where(eq(userProfile.userId, userId))
    .limit(1);
  return profile ?? null;
}

/** Used at login to detect admin-created (bypassed) accounts when auth returns "email not verified". */
export async function getUserProfileByEmail(email: string) {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return null;
  const [profile] = await db
    .select({ userId: userProfile.userId, emailVerificationBypassed: userProfile.emailVerificationBypassed, role: userProfile.role })
    .from(userProfile)
    .where(eq(userProfile.email, normalized))
    .limit(1);
  return profile ?? null;
}

export async function createUserProfile(values: {
  userId: string;
  email?: string | null;
  fullName?: string | null;
  role: Role;
  emailVerificationBypassed?: boolean;
  contactNo?: string;
  dataPrivacyConsentAt?: Date;
}) {
  return db.insert(userProfile).values({
    ...values,
    emailVerificationBypassed: values.emailVerificationBypassed ?? false,
  });
}

export async function getUsersList() {
  return db
    .select()
    .from(userProfile)
    .orderBy(desc(userProfile.createdAt));
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

export async function updateUserProfileRole(profileId: string, role: Role) {
  await db
    .update(userProfile)
    .set({ role, updatedAt: new Date() })
    .where(eq(userProfile.id, profileId));
}

export async function updateUserProfileProgramScope(
  profileId: string,
  program: string | null
) {
  await db
    .update(userProfile)
    .set({ program, updatedAt: new Date() })
    .where(eq(userProfile.id, profileId));
}

export async function updateUserProfileRoleByUserId(userId: string, role: Role) {
  await db
    .update(userProfile)
    .set({ role, updatedAt: new Date() })
    .where(eq(userProfile.userId, userId));
}

export async function setUserProfileActive(userId: string, active: boolean) {
  await db
    .update(userProfile)
    .set({ active, updatedAt: new Date() })
    .where(eq(userProfile.userId, userId));
}

export async function getUsersListSearch(params?: {
  q?: string;
  role?: string;
}) {
  const q = params?.q?.trim()?.toLowerCase();
  const roleFilter = params?.role;
  // Exclude soft-deleted users (admin "Delete" sets email & fullName to null)
  const rows = await db
    .select()
    .from(userProfile)
    .where(
      or(
        isNotNull(userProfile.email),
        isNotNull(userProfile.fullName)
      )
    )
    .orderBy(desc(userProfile.createdAt));
  let result = rows;
  if (q) {
    result = result.filter(
      (r) =>
        r.userId.toLowerCase().includes(q) ||
        (r.fullName?.toLowerCase().includes(q) ?? false) ||
        (r.email?.toLowerCase().includes(q) ?? false)
    );
  }
  if (roleFilter) {
    result = result.filter((r) => r.role === roleFilter);
  }
  return result;
}

// ============ Support requests ============

export async function createSupportRequest(entry: {
  reason: string;
  email?: string | null;
  phone?: string | null;
  message: string;
  userId?: string | null;
}) {
  const email = entry.email?.trim() ? entry.email.trim().toLowerCase() : null;
  const phone = entry.phone?.trim() ? entry.phone.trim() : null;
  const message = entry.message.trim();
  const reason = entry.reason.trim() || "unknown";

  return db.insert(supportRequests).values({
    reason,
    email,
    phone,
    message,
    userId: entry.userId ?? null,
  });
}

export async function listSupportRequests(limit = 200) {
  return db
    .select()
    .from(supportRequests)
    .orderBy(desc(supportRequests.createdAt))
    .limit(limit);
}

// ============ Audit log ============

export async function insertAuditLog(entry: {
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
}) {
  await db.insert(auditLog).values({
    actorUserId: entry.actorUserId ?? null,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    before: entry.before ? (entry.before as Record<string, unknown>) : null,
    after: entry.after ? (entry.after as Record<string, unknown>) : null,
  });
}

export async function getAuditLogPage(params: {
  fromDate?: Date;
  toDate?: Date;
  actorUserId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  limit?: number;
  offset?: number;
}) {
  const conditions = [];
  if (params.fromDate) {
    conditions.push(gte(auditLog.createdAt, params.fromDate));
  }
  if (params.toDate) {
    conditions.push(lte(auditLog.createdAt, params.toDate));
  }
  if (params.actorUserId) {
    conditions.push(eq(auditLog.actorUserId, params.actorUserId));
  }
  if (params.action) {
    conditions.push(eq(auditLog.action, params.action));
  }
  if (params.entityType) {
    conditions.push(eq(auditLog.entityType, params.entityType));
  }
  if (params.entityId) {
    conditions.push(eq(auditLog.entityId, params.entityId));
  }
  const where = conditions.length ? and(...conditions) : undefined;
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;
  const rows = await db
    .select({
      id: auditLog.id,
      actorUserId: auditLog.actorUserId,
      actorFullName: userProfile.fullName,
      action: auditLog.action,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      before: auditLog.before,
      after: auditLog.after,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .leftJoin(userProfile, eq(auditLog.actorUserId, userProfile.userId))
    .where(where)
    .orderBy(desc(auditLog.createdAt))
    .limit(limit)
    .offset(offset);
  return rows;
}

export async function getAuditLogCountLast24h() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [r] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(auditLog)
    .where(gte(auditLog.createdAt, since));
  return r?.count ?? 0;
}

export async function getRecentRoleChanges(limit = 10) {
  const rows = await db
    .select({
      id: auditLog.id,
      actorUserId: auditLog.actorUserId,
      action: auditLog.action,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      before: auditLog.before,
      after: auditLog.after,
      createdAt: auditLog.createdAt,
      entityName: userProfile.fullName,
      entityEmail: userProfile.email,
    })
    .from(auditLog)
    .leftJoin(
      userProfile,
      or(
        eq(auditLog.entityId, userProfile.userId),
        sql`${auditLog.entityId} = ${userProfile.id}::text`
      )
    )
    .where(eq(auditLog.action, "ROLE_CHANGE"))
    .orderBy(desc(auditLog.createdAt))
    .limit(limit);
  return rows;
}

// ============ System settings ============

export async function getSystemSetting(key: string) {
  const [row] = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, key))
    .limit(1);
  return row ?? null;
}

export async function upsertSystemSetting(params: {
  key: string;
  value: unknown;
  updatedByUserId?: string | null;
}) {
  const now = new Date();
  const existing = await getSystemSetting(params.key);
  if (existing) {
    await db
      .update(systemSettings)
      .set({
        value: params.value as Record<string, unknown>,
        updatedByUserId: params.updatedByUserId ?? null,
        updatedAt: now,
      })
      .where(eq(systemSettings.key, params.key));
  } else {
    await db.insert(systemSettings).values({
      key: params.key,
      value: params.value as Record<string, unknown>,
      updatedByUserId: params.updatedByUserId ?? null,
      updatedAt: now,
    });
  }
}

// ============ Programs ============

const programsListCols = {
  id: programs.id,
  code: programs.code,
  name: programs.name,
  active: programs.active,
  createdAt: programs.createdAt,
  updatedAt: programs.updatedAt,
};

/** Select programs; uses explicit columns so it works when DB has no description column yet. */
export async function getProgramsList(activeOnly?: boolean) {
  const rows = activeOnly
    ? await db
        .select(programsListCols)
        .from(programs)
        .where(eq(programs.active, true))
        .orderBy(programs.code)
    : await db.select(programsListCols).from(programs).orderBy(programs.code);
  return rows.map((r) => ({ ...r, description: null as string | null }));
}

export async function getProgramById(id: string) {
  const [row] = await db
    .select(programsListCols)
    .from(programs)
    .where(eq(programs.id, id))
    .limit(1);
  return row ? { ...row, description: null as string | null } : null;
}

export async function getProgramsByCodes(codes: string[]) {
  if (codes.length === 0) return [];
  return db
    .select(programsListCols)
    .from(programs)
    .where(inArray(programs.code, codes))
    .orderBy(programs.code);
}

export async function createProgram(params: {
  code: string;
  name: string;
  description?: string | null;
  active?: boolean;
}) {
  await db.insert(programs).values({
    code: params.code,
    name: params.name,
    description: params.description ?? null,
    active: params.active ?? true,
  });
}

export async function updateProgram(
  id: string,
  params: { code?: string; name?: string; description?: string | null; active?: boolean }
) {
  await db
    .update(programs)
    .set({
      ...(params.code !== undefined && { code: params.code }),
      ...(params.name !== undefined && { name: params.name }),
      ...(params.description !== undefined && { description: params.description }),
      ...(params.active !== undefined && { active: params.active }),
      updatedAt: new Date(),
    })
    .where(eq(programs.id, id));
}

export async function toggleProgramActive(id: string, active: boolean) {
  await db
    .update(programs)
    .set({ active, updatedAt: new Date() })
    .where(eq(programs.id, id));
}

export async function deleteProgram(id: string) {
  await db.delete(programs).where(eq(programs.id, id));
}

export async function getProgramHeadAssignmentsByProgramCode(programCode: string) {
  return db
    .select()
    .from(programHeadAssignments)
    .where(eq(programHeadAssignments.programCode, programCode));
}

// ============ Program head assignments ============

export async function getProgramHeadAssignmentsList(filters?: {
  userId?: string;
  programCode?: string;
}) {
  let query = db
    .select()
    .from(programHeadAssignments)
    .orderBy(desc(programHeadAssignments.createdAt));
  if (filters?.userId) {
    const rows = await db
      .select()
      .from(programHeadAssignments)
      .where(eq(programHeadAssignments.userId, filters.userId))
      .orderBy(desc(programHeadAssignments.createdAt));
    return filters.programCode ? rows.filter((r) => r.programCode === filters.programCode) : rows;
  }
  if (filters?.programCode) {
    return db
      .select()
      .from(programHeadAssignments)
      .where(eq(programHeadAssignments.programCode, filters.programCode))
      .orderBy(desc(programHeadAssignments.createdAt));
  }
  return db
    .select()
    .from(programHeadAssignments)
    .orderBy(desc(programHeadAssignments.createdAt));
}

export async function assignProgramHead(userId: string, programCode: string) {
  await db.insert(programHeadAssignments).values({
    userId,
    programCode,
    active: true,
  });
}

export async function unassignProgramHead(assignmentId: string) {
  await db
    .delete(programHeadAssignments)
    .where(eq(programHeadAssignments.id, assignmentId));
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

/** Generates next student ID in format YYYY-NNNN (e.g. 2025-0001). Uses current year by default. */
export async function generateNextStudentCode(year?: number): Promise<string> {
  const y = year ?? new Date().getFullYear();
  const prefix = `${y}-`;
  const rows = await db
    .select({ studentCode: students.studentCode })
    .from(students)
    .where(like(students.studentCode, `${prefix}%`));
  let max = 0;
  for (const r of rows) {
    if (!r.studentCode || !r.studentCode.startsWith(prefix)) continue;
    const num = parseInt(r.studentCode.slice(prefix.length), 10);
    if (!Number.isNaN(num) && num > max) max = num;
  }
  return `${y}-${String(max + 1).padStart(4, "0")}`;
}

export async function insertStudent(values: {
  userProfileId: string;
  studentCode?: string | null;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  email?: string | null;
  contactNo?: string | null;
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

/** Full student profile for /student/profile page: student + address + program */
export async function getMyStudentProfile(studentId: string) {
  const [student] = await db
    .select({
      id: students.id,
      studentCode: students.studentCode,
      firstName: students.firstName,
      middleName: students.middleName,
      lastName: students.lastName,
      suffix: students.suffix,
      email: students.email,
      contactNo: students.contactNo,
      alternateContact: students.alternateContact,
      birthday: students.birthday,
      sex: students.sex,
      gender: students.gender,
      religion: students.religion,
      placeOfBirth: students.placeOfBirth,
      citizenship: students.citizenship,
      civilStatus: students.civilStatus,
      lrn: students.lrn,
      program: students.program,
      yearLevel: students.yearLevel,
      studentType: students.studentType,
      lastSchoolId: students.lastSchoolId,
      lastSchoolYearCompleted: students.lastSchoolYearCompleted,
      shsStrand: students.shsStrand,
      guardianName: students.guardianName,
      guardianRelationship: students.guardianRelationship,
      guardianMobile: students.guardianMobile,
      photoUrl: students.photoUrl,
      programName: programs.name,
    })
    .from(students)
    .leftJoin(programs, eq(students.program, programs.code))
    .where(eq(students.id, studentId))
    .limit(1);

  if (!student) return null;

  const [address] = await db
    .select()
    .from(studentAddresses)
    .where(eq(studentAddresses.studentId, studentId))
    .limit(1);

  // Fallback: 2x2 photo from requirement uploads (e.g. "2x2 ID Photo" requirement)
  const photoFile = await db
    .select({ id: requirementFiles.id, storageKey: requirementFiles.storageKey })
    .from(requirementFiles)
    .innerJoin(
      studentRequirementSubmissions,
      eq(requirementFiles.submissionId, studentRequirementSubmissions.id)
    )
    .innerJoin(
      requirements,
      eq(studentRequirementSubmissions.requirementId, requirements.id)
    )
    .where(
      and(
        eq(studentRequirementSubmissions.studentId, studentId),
        inArray(studentRequirementSubmissions.status, ["submitted", "verified"]),
        or(
          sql`lower(${requirements.code}) like '%photo%'`,
          sql`lower(${requirements.code}) like '%2x2%'`,
          sql`lower(${requirements.name}) like '%2x2%'`,
          sql`lower(${requirements.name}) like '%id photo%'`,
          sql`lower(${requirements.name}) like '%photo%'`
        ),
        sql`${requirementFiles.fileType} like 'image/%'`
      )
    )
    .orderBy(desc(requirementFiles.uploadedAt))
    .limit(1);

  let idPhotoFileId: string | null = null;
  if (photoFile[0]) {
    const { requirementFileExists } = await import("@/lib/uploads");
    if (await requirementFileExists(photoFile[0].storageKey)) {
      idPhotoFileId = photoFile[0].id;
    }
  }

  return {
    student,
    address: address ?? null,
    idPhotoFileId,
  };
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

/** Schedule details for one enrollment (e.g. current term). Uses student_schedule_view (enrollment -> section -> class_schedules). */
export async function getScheduleWithDetailsByEnrollmentId(
  enrollmentId: string,
  limit = 50
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
    .where(eq(studentScheduleView.enrollmentId, enrollmentId))
    .limit(limit);
}

/** Schedule from class enrollments (student_class_enrollments -> class_offerings -> schedule + days). Use when classes are finalized. */
export async function getScheduleFromClassEnrollmentsByEnrollmentId(
  enrollmentId: string,
  limit = 50
) {
  return db
    .select({
      day: scheduleDays.day,
      timeIn: classOfferings.timeStart,
      timeOut: classOfferings.timeEnd,
      room: classOfferings.room,
      subjectCode: subjects.code,
      subjectDescription: subjects.description,
      sectionName: sections.name,
    })
    .from(studentClassEnrollments)
    .innerJoin(classOfferings, eq(studentClassEnrollments.classOfferingId, classOfferings.id))
    .innerJoin(classSchedules, eq(classOfferings.scheduleId, classSchedules.id))
    .innerJoin(scheduleDays, eq(scheduleDays.scheduleId, classSchedules.id))
    .leftJoin(subjects, eq(classOfferings.subjectId, subjects.id))
    .leftJoin(sections, eq(classOfferings.sectionId, sections.id))
    .where(
      and(
        eq(studentClassEnrollments.enrollmentId, enrollmentId),
        eq(studentClassEnrollments.status, "enrolled")
      )
    )
    .limit(limit);
}

/** Planned subjects snapshot (no times) when schedule not yet ready. */
export async function getEnrollmentSubjectsByEnrollmentId(enrollmentId: string) {
  return db
    .select({
      subjectId: enrollmentSubjects.subjectId,
      code: subjects.code,
      title: subjects.title,
      units: subjects.units,
      source: enrollmentSubjects.source,
    })
    .from(enrollmentSubjects)
    .innerJoin(subjects, eq(enrollmentSubjects.subjectId, subjects.id))
    .where(eq(enrollmentSubjects.enrollmentId, enrollmentId));
}

/** Count of classes assigned and whether only curriculum snapshot exists (schedule pending). */
export async function getEnrollmentClassSummary(enrollmentId: string): Promise<{
  classesAssigned: number;
  schedulePending: boolean;
}> {
  const [enrolled] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(studentClassEnrollments)
    .where(
      and(
        eq(studentClassEnrollments.enrollmentId, enrollmentId),
        eq(studentClassEnrollments.status, "enrolled")
      )
    );
  const [subjectsCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(enrollmentSubjects)
    .where(eq(enrollmentSubjects.enrollmentId, enrollmentId));
  const classesAssigned = enrolled?.count ?? 0;
  const schedulePending = (subjectsCount?.count ?? 0) > 0 && classesAssigned === 0;
  return { classesAssigned, schedulePending };
}

/** Batch class summaries for many enrollments (e.g. list view). */
export async function getEnrollmentClassSummaries(
  enrollmentIds: string[]
): Promise<Map<string, { classesAssigned: number; schedulePending: boolean }>> {
  if (enrollmentIds.length === 0) return new Map();
  const enrolled = await db
    .select({
      enrollmentId: studentClassEnrollments.enrollmentId,
      c: sql<number>`count(*)::int`.as("c"),
    })
    .from(studentClassEnrollments)
    .where(
      and(
        inArray(studentClassEnrollments.enrollmentId, enrollmentIds),
        eq(studentClassEnrollments.status, "enrolled"))
    )
    .groupBy(studentClassEnrollments.enrollmentId);
  const subjectsCounts = await db
    .select({
      enrollmentId: enrollmentSubjects.enrollmentId,
      c: sql<number>`count(*)::int`.as("c"),
    })
    .from(enrollmentSubjects)
    .where(inArray(enrollmentSubjects.enrollmentId, enrollmentIds))
    .groupBy(enrollmentSubjects.enrollmentId);
  const enrolledMap = new Map(enrolled.map((r) => [r.enrollmentId, r.c]));
  const subjectsMap = new Map(subjectsCounts.map((r) => [r.enrollmentId, r.c]));
  const out = new Map<string, { classesAssigned: number; schedulePending: boolean }>();
  for (const id of enrollmentIds) {
    const classesAssigned = enrolledMap.get(id) ?? 0;
    const subCount = subjectsMap.get(id) ?? 0;
    out.set(id, { classesAssigned, schedulePending: subCount > 0 && classesAssigned === 0 });
  }
  return out;
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

/** Students who recently completed their profile (new registrations from setup wizard). */
export async function getRecentlyCompletedProfiles(limit = 10) {
  return db
    .select({
      id: students.id,
      studentCode: students.studentCode,
      firstName: students.firstName,
      middleName: students.middleName,
      lastName: students.lastName,
      email: students.email,
      program: students.program,
      yearLevel: students.yearLevel,
      profileCompletedAt: students.profileCompletedAt,
    })
    .from(students)
    .where(and(isNotNull(students.profileCompletedAt), isNull(students.deletedAt)))
    .orderBy(desc(students.profileCompletedAt))
    .limit(limit);
}

/** Count of students who completed profile recently (last 7 days). */
export async function getRecentlyCompletedProfilesCount() {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(students)
    .where(
      and(
        isNotNull(students.profileCompletedAt),
        isNull(students.deletedAt),
        gte(students.profileCompletedAt, weekAgo)
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

/** Grade submissions with status=submitted (awaiting registrar review). */
export async function getGradeSubmissionsAwaitingReviewCount() {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(gradeSubmissions)
    .where(eq(gradeSubmissions.status, "submitted"));
  return row?.count ?? 0;
}

/** Enrollments with finance status=paid but not cleared (read-only for registrar). */
export async function getPendingClearancesCount() {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(enrollmentFinanceStatus)
    .where(eq(enrollmentFinanceStatus.status, "paid"));
  return row?.count ?? 0;
}

/** Recent requirement submissions (status=submitted) for dashboard. */
export async function getRecentRequirementSubmissions(limit = 10) {
  return db
    .select({
      id: studentRequirementSubmissions.id,
      requirementName: requirements.name,
      requirementCode: requirements.code,
      submittedAt: studentRequirementSubmissions.submittedAt,
      firstName: students.firstName,
      lastName: students.lastName,
      studentCode: students.studentCode,
    })
    .from(studentRequirementSubmissions)
    .innerJoin(students, eq(studentRequirementSubmissions.studentId, students.id))
    .innerJoin(requirements, eq(studentRequirementSubmissions.requirementId, requirements.id))
    .where(eq(studentRequirementSubmissions.status, "submitted"))
    .orderBy(desc(studentRequirementSubmissions.submittedAt))
    .limit(limit);
}

/** Recent grade submissions (any status) for dashboard. */
export async function getRecentGradeSubmissions(limit = 10) {
  const rows = await db
    .select({
      id: gradeSubmissions.id,
      status: gradeSubmissions.status,
      submittedAt: gradeSubmissions.submittedAt,
      subjectCode: subjects.code,
      sectionName: sections.name,
      gradingPeriodName: gradingPeriods.name,
      teacherFirstName: sql<string>`COALESCE(SPLIT_PART(COALESCE(${userProfile.fullName},''), ' ', 1), '')`,
      teacherLastName: sql<string>`COALESCE(NULLIF(TRIM(SUBSTRING(COALESCE(${userProfile.fullName},'') FROM POSITION(' ' IN COALESCE(${userProfile.fullName},'')||' ')+1)), ''), '')`,
    })
    .from(gradeSubmissions)
    .innerJoin(classSchedules, eq(gradeSubmissions.scheduleId, classSchedules.id))
    .innerJoin(subjects, eq(classSchedules.subjectId, subjects.id))
    .innerJoin(sections, eq(classSchedules.sectionId, sections.id))
    .innerJoin(gradingPeriods, eq(gradeSubmissions.gradingPeriodId, gradingPeriods.id))
    .innerJoin(userProfile, eq(gradeSubmissions.teacherUserProfileId, userProfile.id))
    .orderBy(desc(gradeSubmissions.submittedAt))
    .limit(limit);
  return rows;
}

export async function getRecentAnnouncements(limit = 5) {
  return db
    .select({
      id: announcements.id,
      title: announcements.title,
      audience: announcements.audience,
      createdAt: announcements.createdAt,
      createdByRole: userProfile.role,
    })
    .from(announcements)
    .leftJoin(userProfile, eq(announcements.createdByUserId, userProfile.userId))
    .orderBy(desc(announcements.createdAt))
    .limit(limit);
}

/** Announcements for student portal: audience 'all' or 'students', optional program scope, pinned first. */
export async function getAnnouncementsForStudent(
  limit = 10,
  program?: string | null
) {
  const conds = [
    or(
      eq(announcements.audience, "all"),
      eq(announcements.audience, "students")
    ),
  ];
  if (program != null && program !== "") {
    conds.push(
      or(isNull(announcements.program), eq(announcements.program, program))
    );
  }
  return db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      pinned: announcements.pinned,
      createdAt: announcements.createdAt,
      createdByRole: userProfile.role,
    })
    .from(announcements)
    .leftJoin(userProfile, eq(announcements.createdByUserId, userProfile.userId))
    .where(and(...conds))
    .orderBy(desc(announcements.pinned), desc(announcements.createdAt))
    .limit(limit);
}

const pendingApprovalsSelect = {
  id: enrollments.id,
  studentId: enrollments.studentId,
  schoolYearId: enrollments.schoolYearId,
  termId: enrollments.termId,
  schoolYearName: schoolYears.name,
  termName: terms.name,
  program: enrollments.program,
  sectionId: enrollments.sectionId,
  yearLevel: enrollments.yearLevel,
  createdAt: enrollments.createdAt,
  firstName: students.firstName,
  middleName: students.middleName,
  lastName: students.lastName,
  studentCode: students.studentCode,
  financeStatus: enrollmentFinanceStatus.status,
  financeBalance: enrollmentFinanceStatus.balance,
};

/** Pending approvals list; works even when enrollments.program_id column does not exist yet. */
export async function getPendingEnrollmentApprovalsList(search?: string) {
  const withProgramJoin = () =>
    db
      .select({
        ...pendingApprovalsSelect,
        programCode: programs.code,
        sectionName: sections.name,
      })
      .from(enrollments)
      .innerJoin(students, eq(enrollments.studentId, students.id))
      .innerJoin(schoolYears, eq(enrollments.schoolYearId, schoolYears.id))
      .innerJoin(terms, eq(enrollments.termId, terms.id))
      .leftJoin(programs, eq(enrollments.programId, programs.id))
      .leftJoin(sections, eq(enrollments.sectionId, sections.id))
      .leftJoin(enrollmentFinanceStatus, eq(enrollments.id, enrollmentFinanceStatus.enrollmentId))
      .where(eq(enrollments.status, "pending_approval"))
      .orderBy(desc(enrollments.createdAt));

  const withoutProgramJoin = () =>
    db
      .select({
        ...pendingApprovalsSelect,
        programCode: enrollments.program,
        sectionName: sections.name,
      })
      .from(enrollments)
      .innerJoin(students, eq(enrollments.studentId, students.id))
      .innerJoin(schoolYears, eq(enrollments.schoolYearId, schoolYears.id))
      .innerJoin(terms, eq(enrollments.termId, terms.id))
      .leftJoin(sections, eq(enrollments.sectionId, sections.id))
      .leftJoin(enrollmentFinanceStatus, eq(enrollments.id, enrollmentFinanceStatus.enrollmentId))
      .where(eq(enrollments.status, "pending_approval"))
      .orderBy(desc(enrollments.createdAt));

  try {
    if (search?.trim()) {
      return await db
        .select({
          ...pendingApprovalsSelect,
          programCode: programs.code,
          sectionName: sections.name,
        })
        .from(enrollments)
        .innerJoin(students, eq(enrollments.studentId, students.id))
        .innerJoin(schoolYears, eq(enrollments.schoolYearId, schoolYears.id))
        .innerJoin(terms, eq(enrollments.termId, terms.id))
        .leftJoin(programs, eq(enrollments.programId, programs.id))
        .leftJoin(sections, eq(enrollments.sectionId, sections.id))
        .leftJoin(enrollmentFinanceStatus, eq(enrollments.id, enrollmentFinanceStatus.enrollmentId))
        .where(
          and(
            eq(enrollments.status, "pending_approval"),
            or(
              like(students.firstName, `%${search.trim()}%`),
              like(students.lastName, `%${search.trim()}%`),
              sql`${students.studentCode}::text ILIKE ${`%${search.trim()}%`}`
            )
          )
        )
        .orderBy(desc(enrollments.createdAt));
    }
    return await withProgramJoin();
  } catch {
    if (search?.trim()) {
      return await db
        .select({
          ...pendingApprovalsSelect,
          programCode: enrollments.program,
          sectionName: sections.name,
        })
        .from(enrollments)
        .innerJoin(students, eq(enrollments.studentId, students.id))
        .innerJoin(schoolYears, eq(enrollments.schoolYearId, schoolYears.id))
        .innerJoin(terms, eq(enrollments.termId, terms.id))
        .leftJoin(sections, eq(enrollments.sectionId, sections.id))
        .leftJoin(enrollmentFinanceStatus, eq(enrollments.id, enrollmentFinanceStatus.enrollmentId))
        .where(
          and(
            eq(enrollments.status, "pending_approval"),
            or(
              like(students.firstName, `%${search.trim()}%`),
              like(students.lastName, `%${search.trim()}%`),
              sql`${students.studentCode}::text ILIKE ${`%${search.trim()}%`}`
            )
          )
        )
        .orderBy(desc(enrollments.createdAt));
    }
    return await withoutProgramJoin();
  }
}

export async function getEnrollmentById(id: string) {
  const [row] = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.id, id))
    .limit(1);
  return row ?? null;
}

/** Returns true if there is an active governance flag of type finance_hold on this enrollment or its student. */
export async function hasActiveFinanceHoldForEnrollment(enrollmentId: string) {
  const [enrollment] = await db
    .select({ studentId: enrollments.studentId })
    .from(enrollments)
    .where(eq(enrollments.id, enrollmentId))
    .limit(1);
  if (!enrollment) return false;
  const [flag] = await db
    .select({ id: governanceFlags.id })
    .from(governanceFlags)
    .where(
      and(
        eq(governanceFlags.status, "active"),
        eq(governanceFlags.flagType, "finance_hold"),
        or(
          eq(governanceFlags.enrollmentId, enrollmentId),
          eq(governanceFlags.studentId, enrollment.studentId)
        )!
      )
    )
    .limit(1);
  return !!flag;
}

/** Returns the set of enrollment IDs that have an active finance_hold (on enrollment or on student). */
export async function getEnrollmentIdsWithActiveFinanceHold(): Promise<Set<string>> {
  const byEnrollment = await db
    .select({ enrollmentId: governanceFlags.enrollmentId })
    .from(governanceFlags)
    .where(
      and(
        eq(governanceFlags.status, "active"),
        eq(governanceFlags.flagType, "finance_hold"),
        sql`${governanceFlags.enrollmentId} IS NOT NULL`
      )
    );
  const byStudent = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .innerJoin(governanceFlags, eq(governanceFlags.studentId, enrollments.studentId))
    .where(
      and(
        eq(governanceFlags.status, "active"),
        eq(governanceFlags.flagType, "finance_hold")
      )
    );
  const set = new Set<string>();
  for (const r of byEnrollment) {
    if (r.enrollmentId) set.add(r.enrollmentId);
  }
  for (const r of byStudent) set.add(r.id);
  return set;
}

export async function approveEnrollmentById(
  enrollmentId: string,
  reviewedByUserId: string,
  remarks?: string
) {
  await db.transaction(async (tx) => {
    await tx
      .update(enrollments)
      .set({ status: "approved", updatedAt: new Date() })
      .where(eq(enrollments.id, enrollmentId));

    const [existing] = await tx
      .select()
      .from(enrollmentApprovals)
      .where(eq(enrollmentApprovals.enrollmentId, enrollmentId))
      .limit(1);

    const now = new Date();
    if (existing) {
      await tx
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
      await tx.insert(enrollmentApprovals).values({
        enrollmentId,
        status: "approved",
        reviewedByUserId,
        reviewedAt: now,
        remarks: remarks ?? null,
      });
    }

    const [efs] = await tx
      .select()
      .from(enrollmentFinanceStatus)
      .where(eq(enrollmentFinanceStatus.enrollmentId, enrollmentId))
      .limit(1);
    if (!efs) {
      await tx.insert(enrollmentFinanceStatus).values({
        enrollmentId,
        status: "unassessed",
        balance: "0",
      });
    }

  });
  const { finalizeEnrollmentClasses } = await import("@/lib/enrollment/finalizeEnrollmentClasses");
  await finalizeEnrollmentClasses(enrollmentId);
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
  programId: string;
  program?: string | null;
  yearLevel?: string | null;
  sectionId?: string | null;
}) {
  return db.insert(enrollments).values({
    studentId: values.studentId,
    schoolYearId: values.schoolYearId,
    termId: values.termId,
    programId: values.programId,
    program: values.program ?? null,
    yearLevel: values.yearLevel ?? null,
    sectionId: values.sectionId ?? null,
    status: "pending_approval",
  });
}

/** Insert enrollment with status preregistered (student draft). Unique on (studentId, schoolYearId, termId). */
export async function insertDraftEnrollment(values: {
  studentId: string;
  schoolYearId: string;
  termId: string;
  programId: string;
  program?: string | null;
  yearLevel?: string | null;
  sectionId?: string | null;
}) {
  const [row] = await db
    .insert(enrollments)
    .values({
      ...values,
      program: values.program ?? null,
      yearLevel: values.yearLevel ?? null,
      sectionId: values.sectionId ?? null,
      status: "preregistered",
    })
    .returning();
  return row ?? null;
}

/** Update program/yearLevel/sectionId only when status is preregistered. */
export async function updateDraftEnrollment(
  enrollmentId: string,
  studentId: string,
  values: {
    programId: string;
    program?: string | null;
    yearLevel?: string | null;
    sectionId?: string | null;
  }
) {
  const conds = [
    eq(enrollments.id, enrollmentId),
    eq(enrollments.studentId, studentId),
    eq(enrollments.status, "preregistered" as const),
  ];
  const [enrollment] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(and(...conds))
    .limit(1);
  if (!enrollment) return null;
  await db
    .update(enrollments)
    .set({
      programId: values.programId,
      program: values.program ?? null,
      yearLevel: values.yearLevel ?? null,
      sectionId: values.sectionId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(enrollments.id, enrollmentId));
  return enrollment.id;
}

/** Set enrollment status to pending_approval (submit). */
export async function setEnrollmentPendingApproval(enrollmentId: string) {
  await db
    .update(enrollments)
    .set({ status: "pending_approval", updatedAt: new Date() })
    .where(eq(enrollments.id, enrollmentId));
}

/** Set enrollment status to cancelled (student cancel). */
export async function setEnrollmentCancelled(enrollmentId: string) {
  await db
    .update(enrollments)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(enrollments.id, enrollmentId));
}

/** Assign section to an enrollment (e.g. approved). Call finalizeEnrollmentClasses after when status is approved. */
export async function updateEnrollmentSection(
  enrollmentId: string,
  sectionId: string | null
) {
  await db
    .update(enrollments)
    .set({ sectionId, updatedAt: new Date() })
    .where(eq(enrollments.id, enrollmentId));
}

/** Reset rejected enrollment to draft so student can fix and resubmit. */
export async function resetRejectedEnrollmentToDraft(enrollmentId: string): Promise<boolean> {
  const [row] = await db
    .update(enrollments)
    .set({ status: "preregistered", updatedAt: new Date() })
    .where(and(eq(enrollments.id, enrollmentId), eq(enrollments.status, "rejected")))
    .returning({ id: enrollments.id });
  return !!row;
}

export async function getEnrollmentApprovalByEnrollmentId(enrollmentId: string) {
  const [row] = await db
    .select({
      status: enrollmentApprovals.status,
      remarks: enrollmentApprovals.remarks,
      reviewedAt: enrollmentApprovals.reviewedAt,
    })
    .from(enrollmentApprovals)
    .where(eq(enrollmentApprovals.enrollmentId, enrollmentId))
    .limit(1);
  return row ?? null;
}

export async function getSchoolYearsList() {
  return db.select().from(schoolYears).orderBy(desc(schoolYears.name));
}

/** School years that have at least one curriculum version (draft, published, or archived). Use for filter dropdown so years don’t show until there’s a curriculum. */
export async function getSchoolYearsWithCurriculumVersions() {
  return db
    .selectDistinct({ id: schoolYears.id, name: schoolYears.name })
    .from(schoolYears)
    .innerJoin(curriculumVersions, eq(curriculumVersions.schoolYearId, schoolYears.id))
    .orderBy(desc(schoolYears.name));
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

export async function getActiveTerm() {
  const sy = await getActiveSchoolYear();
  if (!sy) return null;
  const [row] = await db
    .select()
    .from(terms)
    .where(and(eq(terms.schoolYearId, sy.id), eq(terms.isActive, true)))
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

export async function getEnrollmentsListWithFinanceStatus(filters?: {
  studentId?: string;
  schoolYearId?: string;
  termId?: string;
  programId?: string;
}) {
  const conds: ReturnType<typeof eq>[] = [];
  if (filters?.studentId) conds.push(eq(enrollments.studentId, filters.studentId));
  if (filters?.schoolYearId) conds.push(eq(enrollments.schoolYearId, filters.schoolYearId));
  if (filters?.termId) conds.push(eq(enrollments.termId, filters.termId));
  if (filters?.programId) conds.push(eq(enrollments.programId, filters.programId));

  const baseSelect = {
    id: enrollments.id,
    studentId: enrollments.studentId,
    programId: enrollments.programId,
    schoolYearName: schoolYears.name,
    termName: terms.name,
    program: enrollments.program,
    yearLevel: enrollments.yearLevel,
    sectionId: enrollments.sectionId,
    status: enrollments.status,
    createdAt: enrollments.createdAt,
    firstName: students.firstName,
    middleName: students.middleName,
    lastName: students.lastName,
    studentCode: students.studentCode,
  };

  try {
    const base = db
      .select({
        ...baseSelect,
        programCode: programs.code,
        financeStatus: enrollmentFinanceStatus.status,
        financeBalance: enrollmentFinanceStatus.balance,
      })
      .from(enrollments)
      .innerJoin(students, eq(enrollments.studentId, students.id))
      .innerJoin(schoolYears, eq(enrollments.schoolYearId, schoolYears.id))
      .innerJoin(terms, eq(enrollments.termId, terms.id))
      .leftJoin(programs, eq(enrollments.programId, programs.id))
      .leftJoin(
        enrollmentFinanceStatus,
        eq(enrollments.id, enrollmentFinanceStatus.enrollmentId)
      )
      .orderBy(desc(enrollments.createdAt));
    return conds.length > 0 ? await base.where(and(...conds)) : await base;
  } catch {
    const condsFallback: ReturnType<typeof eq>[] = [];
    if (filters?.studentId) condsFallback.push(eq(enrollments.studentId, filters.studentId));
    if (filters?.schoolYearId) condsFallback.push(eq(enrollments.schoolYearId, filters.schoolYearId));
    if (filters?.termId) condsFallback.push(eq(enrollments.termId, filters.termId));
    const withoutProgramJoin = db
      .select({
        ...baseSelect,
        programCode: enrollments.program,
      })
      .from(enrollments)
      .innerJoin(students, eq(enrollments.studentId, students.id))
      .innerJoin(schoolYears, eq(enrollments.schoolYearId, schoolYears.id))
      .innerJoin(terms, eq(enrollments.termId, terms.id))
      .orderBy(desc(enrollments.createdAt));
    const applied = condsFallback.length > 0 ? withoutProgramJoin.where(and(...condsFallback)) : withoutProgramJoin;
    const rows = await applied;
    return rows.map((r) => ({ ...r, financeStatus: null, financeBalance: null }));
  }
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

/** Fallback when DB lacks is_ge/program_id/title (pre-migration). Returns all subjects with isGe=false, programId=null. */
async function getSubjectsListLegacy(): Promise<
  { id: string; code: string; title: string; description: string | null; units: string | null; programId: string | null; isGe: boolean; active: boolean; programCode: string | null }[]
> {
  const rows = await db
    .select({
      id: subjects.id,
      code: subjects.code,
      description: subjects.description,
      units: subjects.units,
      active: subjects.active,
    })
    .from(subjects)
    .orderBy(subjects.code);
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    title: (r as { title?: string }).title ?? (r.description ?? "") as string,
    description: r.description,
    units: r.units,
    programId: null as string | null,
    isGe: false,
    active: r.active,
    programCode: null as string | null,
  }));
}

export async function getSubjectsList(filters?: { programId?: string | null; geOnly?: boolean }) {
  try {
    if (filters?.geOnly) {
      const rows = await db
        .select({
          id: subjects.id,
          code: subjects.code,
          title: subjects.title,
          description: subjects.description,
          units: subjects.units,
          programId: subjects.programId,
          isGe: subjects.isGe,
          active: subjects.active,
        })
        .from(subjects)
        .where(eq(subjects.isGe, true))
        .orderBy(subjects.code);
      return rows.map((r) => ({ ...r, programCode: null as string | null }));
    }
    const base = db
      .select({
        id: subjects.id,
        code: subjects.code,
        title: subjects.title,
        description: subjects.description,
        units: subjects.units,
        programId: subjects.programId,
        isGe: subjects.isGe,
        active: subjects.active,
        programCode: programs.code,
      })
      .from(subjects)
      .leftJoin(programs, eq(subjects.programId, programs.id))
      .orderBy(subjects.code);
    if (filters?.programId) {
      return base.where(or(eq(subjects.isGe, true), eq(subjects.programId, filters.programId)));
    }
    return base;
  } catch {
    return getSubjectsListLegacy();
  }
}

export async function createSubject(values: {
  type: "GE" | "PROGRAM";
  programId?: string | null;
  code: string;
  title: string;
  description?: string | null;
  units: number;
  active?: boolean;
}) {
  const isGe = values.type === "GE";
  const programId = isGe ? null : (values.programId ?? null);
  const scopeCode = isGe ? `GE:${values.code.trim()}` : `${programId}:${values.code.trim()}`;
  return db.insert(subjects).values({
    code: values.code.trim(),
    title: values.title.trim(),
    description: values.description ?? null,
    units: String(values.units ?? 0),
    programId,
    isGe,
    scopeCode,
    active: values.active ?? true,
  });
}

export async function updateSubject(
  id: string,
  values: {
    code?: string;
    title?: string;
    description?: string | null;
    units?: number;
    active?: boolean;
    type?: "GE" | "PROGRAM";
    programId?: string | null;
  }
) {
  const [row] = await db.select().from(subjects).where(eq(subjects.id, id)).limit(1);
  if (!row) return;
  const isGe = values.type !== undefined ? values.type === "GE" : row.isGe;
  const programId = values.programId !== undefined ? (isGe ? null : values.programId) : row.programId;
  const code = values.code !== undefined ? values.code.trim() : row.code;
  const scopeCode = isGe ? `GE:${code}` : `${programId}:${code}`;
  const payload: {
    code?: string;
    title?: string;
    description?: string | null;
    units?: string;
    active?: boolean;
    scopeCode?: string;
    isGe?: boolean;
    programId?: string | null;
    updatedAt: Date;
  } = { updatedAt: new Date() };
  if (values.code !== undefined) payload.code = code;
  if (values.title !== undefined) payload.title = values.title.trim();
  if (values.description !== undefined) payload.description = values.description;
  if (values.units !== undefined) payload.units = String(values.units);
  if (values.active !== undefined) payload.active = values.active;
  if (values.type !== undefined || values.programId !== undefined || values.code !== undefined) {
    payload.scopeCode = scopeCode;
    payload.isGe = isGe;
    payload.programId = programId;
  }
  await db.update(subjects).set(payload).where(eq(subjects.id, id));
}

export async function toggleSubjectActive(id: string, active: boolean) {
  return db.update(subjects).set({ active, updatedAt: new Date() }).where(eq(subjects.id, id));
}

export async function deleteSubject(id: string) {
  return db.delete(subjects).where(eq(subjects.id, id));
}

export async function getSubjectById(id: string) {
  const [row] = await db.select().from(subjects).where(eq(subjects.id, id)).limit(1);
  return row ?? null;
}

/** Returns true if the subject can be scheduled for the section (GE or same program). */
export async function isSubjectAllowedForSection(subjectId: string, sectionId: string): Promise<{ allowed: boolean; error?: string }> {
  const [sub, sec] = await Promise.all([getSubjectById(subjectId), getSectionById(sectionId)]);
  if (!sub) return { allowed: false, error: "Subject not found" };
  if (!sec) return { allowed: false, error: "Section not found" };
  if (sub.isGe) return { allowed: true };
  if (!sec.programId) return { allowed: false, error: "Section has no program assigned" };
  if (sub.programId !== sec.programId) {
    return { allowed: false, error: "This subject is not available for the selected section's program" };
  }
  return { allowed: true };
}

const sectionsListSelect = {
  id: sections.id,
  name: sections.name,
  gradeLevel: sections.gradeLevel,
  yearLevel: sections.yearLevel,
  program: sections.program,
  status: sections.status,
  active: sections.active,
  createdAt: sections.createdAt,
  updatedAt: sections.updatedAt,
};

/** Sections list; works even when sections.program_id column does not exist yet. */
export async function getSectionsList(filters?: { programId?: string; yearLevel?: string }) {
  const conds: ReturnType<typeof eq>[] = [];
  if (filters?.programId) conds.push(eq(sections.programId, filters.programId));
  if (filters?.yearLevel) conds.push(eq(sections.yearLevel, filters.yearLevel));

  try {
    const base = db
      .select({
        ...sectionsListSelect,
        programId: sections.programId,
        programCode: programs.code,
      })
      .from(sections)
      .leftJoin(programs, eq(sections.programId, programs.id))
      .orderBy(sections.name);
    return conds.length > 0 ? await base.where(and(...conds)) : await base;
  } catch {
    const condsFallback: ReturnType<typeof eq>[] = [];
    if (filters?.yearLevel) condsFallback.push(eq(sections.yearLevel, filters.yearLevel));
    const base = db
      .select({
        ...sectionsListSelect,
        programCode: sections.program,
      })
      .from(sections)
      .orderBy(sections.name);
    const rows = condsFallback.length > 0 ? await base.where(and(...condsFallback)) : await base;
    return rows.map((r) => ({ ...r, programId: null as string | null }));
  }
}

/**
 * Pick a section for an enrollment to keep blocks balanced by size.
 *
 * Strategy:
 * - Consider only sections for the same program + year level.
 * - Count current enrollments for each section in the same school year + term
 *   (pending_approval / preregistered / approved / enrolled).
 * - Return the section with the smallest count (ties break by section name).
 *
 * This means BSIT 1st year A/B stay roughly equal, and we avoid leaving
 * one block half-empty while another is nearly full.
 */
export async function pickBalancedSectionForEnrollment(params: {
  programId: string;
  yearLevel: string | null;
  schoolYearId: string;
  termId: string;
}): Promise<string | null> {
  const { programId, yearLevel, schoolYearId, termId } = params;

  if (!yearLevel) return null;

  const rows = await db
    .select({
      id: sections.id,
      studentCount: sql<number>`count(${enrollments.id})`,
    })
    .from(sections)
    .leftJoin(
      enrollments,
      and(
        eq(enrollments.sectionId, sections.id),
        eq(enrollments.schoolYearId, schoolYearId),
        eq(enrollments.termId, termId),
        inArray(enrollments.status, [
          "pending_approval",
          "preregistered",
          "approved",
          "enrolled",
        ])
      )
    )
    .where(
      and(
        eq(sections.programId, programId),
        eq(sections.yearLevel, yearLevel)
      )
    )
    .groupBy(sections.id)
    .orderBy(sql`count(${enrollments.id})`, asc(sections.name));

  if (!rows.length) return null;
  return rows[0]?.id ?? null;
}

export async function createSection(values: {
  programId: string;
  name: string;
  yearLevel?: string | null;
  active?: boolean;
}) {
  return db.insert(sections).values({
    programId: values.programId,
    name: values.name,
    yearLevel: values.yearLevel ?? null,
    active: values.active ?? true,
  });
}

export async function updateSection(
  id: string,
  values: {
    programId?: string;
    name?: string;
    yearLevel?: string | null;
    active?: boolean;
  }
) {
  return db.update(sections).set({ ...values, updatedAt: new Date() }).where(eq(sections.id, id));
}

export async function toggleSectionActive(id: string, active: boolean) {
  return db.update(sections).set({ active, updatedAt: new Date() }).where(eq(sections.id, id));
}

export async function getSectionById(id: string) {
  const [row] = await db.select().from(sections).where(eq(sections.id, id)).limit(1);
  return row ?? null;
}

// ============ Adviser Assignments (per program, year, block/section) ============

export async function getAdviserAssignmentsList(filters?: {
  programId?: string;
  yearLevel?: string;
  schoolYearId?: string;
}) {
  const conds: ReturnType<typeof eq>[] = [];
  if (filters?.programId) conds.push(eq(sections.programId, filters.programId));
  if (filters?.yearLevel) conds.push(eq(sections.yearLevel, filters.yearLevel));
  if (filters?.schoolYearId) conds.push(eq(adviserAssignments.schoolYearId, filters.schoolYearId));

  const base = db
    .select({
      id: adviserAssignments.id,
      sectionId: adviserAssignments.sectionId,
      schoolYearId: adviserAssignments.schoolYearId,
      teacherUserProfileId: adviserAssignments.teacherUserProfileId,
      sectionName: sections.name,
      sectionYearLevel: sections.yearLevel,
      sectionProgramId: sections.programId,
      programCode: programs.code,
      programName: programs.name,
      adviserName: userProfile.fullName,
      adviserEmail: userProfile.email,
    })
    .from(adviserAssignments)
    .innerJoin(sections, eq(adviserAssignments.sectionId, sections.id))
    .leftJoin(programs, eq(sections.programId, programs.id))
    .innerJoin(userProfile, eq(adviserAssignments.teacherUserProfileId, userProfile.id));

  const q = conds.length > 0 ? base.where(and(...conds)) : base;
  return q.orderBy(programs.code, sections.yearLevel, sections.name);
}

export async function getSectionsWithAdvisers(
  schoolYearId: string,
  filters?: { programId?: string; yearLevel?: string }
) {
  const sectionConds: ReturnType<typeof eq>[] = [];
  if (filters?.programId) sectionConds.push(eq(sections.programId, filters.programId));
  if (filters?.yearLevel) sectionConds.push(eq(sections.yearLevel, filters.yearLevel));

  const sectionsBase = db
    .select({
      id: sections.id,
      name: sections.name,
      yearLevel: sections.yearLevel,
      programId: sections.programId,
      programCode: programs.code,
    })
    .from(sections)
    .leftJoin(programs, eq(sections.programId, programs.id));

  const sectionsList = await (sectionConds.length > 0
    ? sectionsBase.where(and(...sectionConds))
    : sectionsBase
  ).orderBy(programs.code, sections.yearLevel, sections.name);

  const assignments = await db
    .select({
      sectionId: adviserAssignments.sectionId,
      teacherUserProfileId: adviserAssignments.teacherUserProfileId,
      adviserName: userProfile.fullName,
    })
    .from(adviserAssignments)
    .innerJoin(userProfile, eq(adviserAssignments.teacherUserProfileId, userProfile.id))
    .where(eq(adviserAssignments.schoolYearId, schoolYearId));

  const bySection = new Map(assignments.map((a) => [a.sectionId, a]));

  return sectionsList.map((s) => ({
    ...s,
    adviser: bySection.get(s.id) ?? null,
  }));
}

export async function upsertAdviserAssignment(values: {
  sectionId: string;
  schoolYearId: string;
  teacherUserProfileId: string;
}) {
  const existing = await db
    .select({ id: adviserAssignments.id })
    .from(adviserAssignments)
    .where(
      and(
        eq(adviserAssignments.sectionId, values.sectionId),
        eq(adviserAssignments.schoolYearId, values.schoolYearId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(adviserAssignments)
      .set({ teacherUserProfileId: values.teacherUserProfileId, updatedAt: new Date() })
      .where(eq(adviserAssignments.id, existing[0].id));
  } else {
    await db.insert(adviserAssignments).values(values);
  }
}

export async function deleteAdviserAssignment(sectionId: string, schoolYearId: string) {
  await db
    .delete(adviserAssignments)
    .where(
      and(
        eq(adviserAssignments.sectionId, sectionId),
        eq(adviserAssignments.schoolYearId, schoolYearId)
      )
    );
}

export async function getAdviserForSection(sectionId: string, schoolYearId: string) {
  const [row] = await db
    .select({
      teacherUserProfileId: adviserAssignments.teacherUserProfileId,
      adviserName: userProfile.fullName,
      adviserEmail: userProfile.email,
    })
    .from(adviserAssignments)
    .innerJoin(userProfile, eq(adviserAssignments.teacherUserProfileId, userProfile.id))
    .where(
      and(
        eq(adviserAssignments.sectionId, sectionId),
        eq(adviserAssignments.schoolYearId, schoolYearId)
      )
    )
    .limit(1);
  return row ?? null;
}

export async function getRequirementsList(activeOnly = true) {
  if (activeOnly) {
    return db
      .select()
      .from(requirements)
      .where(eq(requirements.isActive, true))
      .orderBy(requirements.name);
  }
  return db.select().from(requirements).orderBy(requirements.name);
}

export async function getAnnouncementsList(limit = 50) {
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
  programId?: string;
}) {
  const conds: ReturnType<typeof eq>[] = [];
  if (filters?.schoolYearId) conds.push(eq(classSchedules.schoolYearId, filters.schoolYearId));
  if (filters?.termId) conds.push(eq(classSchedules.termId, filters.termId));
  if (filters?.sectionId) conds.push(eq(classSchedules.sectionId, filters.sectionId));
  if (filters?.programId) conds.push(eq(sections.programId, filters.programId));

  const base = db
    .select({
      id: classSchedules.id,
      schoolYearName: schoolYears.name,
      termName: terms.name,
      sectionName: sections.name,
      sectionId: classSchedules.sectionId,
      programCode: programs.code,
      sectionProgram: sections.program,
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
    .leftJoin(programs, eq(sections.programId, programs.id))
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
  teacherUserProfileId?: string | null;
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
      teacherUserProfileId: scheduleValues.teacherUserProfileId ?? null,
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
  code: string;
  name: string;
  description?: string | null;
  instructions?: string | null;
  allowedFileTypes?: string[];
  maxFiles?: number;
  isActive?: boolean;
}) {
  return db.insert(requirements).values({
    code: values.code,
    name: values.name,
    description: values.description ?? null,
    instructions: values.instructions ?? null,
    allowedFileTypes: values.allowedFileTypes ?? [],
    maxFiles: values.maxFiles ?? 1,
    isActive: values.isActive ?? true,
  });
}

export async function updateRequirement(
  id: string,
  values: {
    code?: string;
    name?: string;
    description?: string | null;
    instructions?: string | null;
    allowedFileTypes?: string[];
    maxFiles?: number;
    isActive?: boolean;
  }
) {
  return db
    .update(requirements)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(requirements.id, id));
}

export async function deleteRequirement(id: string) {
  return db.delete(requirements).where(eq(requirements.id, id));
}

/** Deletes all data referencing this requirement so the requirement can be removed. Call before deleteRequirement. */
export async function deleteRequirementCascade(requirementId: string) {
  const submissionIds = await db
    .select({ id: studentRequirementSubmissions.id })
    .from(studentRequirementSubmissions)
    .where(eq(studentRequirementSubmissions.requirementId, requirementId));
  const ids = submissionIds.map((s) => s.id);
  if (ids.length > 0) {
    await db.delete(requirementFiles).where(inArray(requirementFiles.submissionId, ids));
  }
  await db
    .delete(studentRequirementSubmissions)
    .where(eq(studentRequirementSubmissions.requirementId, requirementId));
  await db
    .delete(requirementVerifications)
    .where(eq(requirementVerifications.requirementId, requirementId));
  await db.delete(requirementRules).where(eq(requirementRules.requirementId, requirementId));
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

// ---------- Requirement rules (new) ----------
export async function getRequirementRulesForRequirement(requirementId: string) {
  return db
    .select()
    .from(requirementRules)
    .where(eq(requirementRules.requirementId, requirementId))
    .orderBy(requirementRules.sortOrder);
}

export async function getRequirementRulesList() {
  return db
    .select({
      id: requirementRules.id,
      requirementId: requirementRules.requirementId,
      requirementCode: requirements.code,
      requirementName: requirements.name,
      appliesTo: requirementRules.appliesTo,
      program: requirementRules.program,
      yearLevel: requirementRules.yearLevel,
      schoolYearId: requirementRules.schoolYearId,
      termId: requirementRules.termId,
      isRequired: requirementRules.isRequired,
      sortOrder: requirementRules.sortOrder,
    })
    .from(requirementRules)
    .innerJoin(requirements, eq(requirementRules.requirementId, requirements.id))
    .orderBy(requirementRules.sortOrder, requirementRules.id);
}

export async function getRequirementRulesForContext(filters: {
  appliesTo: "enrollment" | "clearance" | "graduation";
  program?: string | null;
  yearLevel?: string | null;
  schoolYearId?: string | null;
  termId?: string | null;
}) {
  try {
    const q = db
      .select()
      .from(requirementRules)
      .where(eq(requirementRules.appliesTo, filters.appliesTo))
      .orderBy(requirementRules.sortOrder);
    const rows = await q;
    return rows.filter((r) => {
      if (filters.program != null && r.program != null && r.program !== filters.program) return false;
      if (filters.yearLevel != null && r.yearLevel != null && r.yearLevel !== filters.yearLevel) return false;
      if (filters.schoolYearId != null && r.schoolYearId != null && r.schoolYearId !== filters.schoolYearId) return false;
      if (filters.termId != null && r.termId != null && r.termId !== filters.termId) return false;
      return true;
    });
  } catch {
    return [];
  }
}

export async function insertRequirementRule(values: {
  requirementId: string;
  appliesTo?: "enrollment" | "clearance" | "graduation";
  program?: string | null;
  yearLevel?: string | null;
  schoolYearId?: string | null;
  termId?: string | null;
  isRequired?: boolean;
  sortOrder?: number;
}) {
  const [row] = await db.insert(requirementRules).values({
    requirementId: values.requirementId,
    appliesTo: values.appliesTo ?? "enrollment",
    program: values.program ?? null,
    yearLevel: values.yearLevel ?? null,
    schoolYearId: values.schoolYearId ?? null,
    termId: values.termId ?? null,
    isRequired: values.isRequired ?? true,
    sortOrder: values.sortOrder ?? 0,
  }).returning();
  return row;
}

export async function updateRequirementRule(
  id: string,
  values: Partial<{
    appliesTo: "enrollment" | "clearance" | "graduation";
    program: string | null;
    yearLevel: string | null;
    schoolYearId: string | null;
    termId: string | null;
    isRequired: boolean;
    sortOrder: number;
  }>
) {
  return db.update(requirementRules).set({ ...values, updatedAt: new Date() }).where(eq(requirementRules.id, id));
}

export async function deleteRequirementRule(id: string) {
  return db.delete(requirementRules).where(eq(requirementRules.id, id));
}

export async function deleteRequirementRulesByRequirementId(requirementId: string) {
  return db.delete(requirementRules).where(eq(requirementRules.requirementId, requirementId));
}

// ---------- Student requirement submissions (new) ----------
export async function getStudentRequirementSubmission(
  studentId: string,
  enrollmentId: string | null,
  requirementId: string
) {
  const subs = await db
    .select()
    .from(studentRequirementSubmissions)
    .where(
      and(
        eq(studentRequirementSubmissions.studentId, studentId),
        enrollmentId ? eq(studentRequirementSubmissions.enrollmentId, enrollmentId) : isNull(studentRequirementSubmissions.enrollmentId),
        eq(studentRequirementSubmissions.requirementId, requirementId)
      )
    )
    .limit(1);
  return subs[0] ?? null;
}

export async function getOrCreateStudentRequirementSubmission(
  studentId: string,
  enrollmentId: string | null,
  requirementId: string
) {
  let sub = await getStudentRequirementSubmission(studentId, enrollmentId, requirementId);
  if (sub) return sub;
  const [created] = await db
    .insert(studentRequirementSubmissions)
    .values({
      studentId,
      enrollmentId,
      requirementId,
      status: "missing",
    })
    .returning();
  return created!;
}

export async function getSubmissionsByEnrollment(enrollmentId: string) {
  return db
    .select()
    .from(studentRequirementSubmissions)
    .where(eq(studentRequirementSubmissions.enrollmentId, enrollmentId));
}

export async function updateStudentRequirementSubmission(
  id: string,
  values: Partial<{
    status: "missing" | "submitted" | "verified" | "rejected";
    submittedAt: Date | null;
    verifiedByUserId: string | null;
    verifiedAt: Date | null;
    registrarRemarks: string | null;
    markAsToFollow: boolean;
  }>
) {
  return db
    .update(studentRequirementSubmissions)
    .set({ ...values, lastUpdatedAt: new Date() })
    .where(eq(studentRequirementSubmissions.id, id));
}

export async function setSubmissionMarkAsToFollow(submissionId: string, markAsToFollow: boolean) {
  return db
    .update(studentRequirementSubmissions)
    .set({ markAsToFollow, lastUpdatedAt: new Date() })
    .where(eq(studentRequirementSubmissions.id, submissionId));
}

export async function verifySubmission(
  submissionId: string,
  verifiedByUserId: string,
  messageToStudent?: string | null
) {
  return db
    .update(studentRequirementSubmissions)
    .set({
      status: "verified",
      verifiedByUserId,
      verifiedAt: new Date(),
      registrarRemarks: messageToStudent ?? null,
      lastUpdatedAt: new Date(),
    })
    .where(eq(studentRequirementSubmissions.id, submissionId));
}

export async function rejectSubmission(submissionId: string, remarks: string) {
  return db
    .update(studentRequirementSubmissions)
    .set({
      status: "rejected",
      registrarRemarks: remarks,
      lastUpdatedAt: new Date(),
    })
    .where(eq(studentRequirementSubmissions.id, submissionId));
}

export async function getRequirementFilesBySubmissionId(submissionId: string) {
  return db
    .select()
    .from(requirementFiles)
    .where(eq(requirementFiles.submissionId, submissionId));
}

export async function insertRequirementFile(values: {
  submissionId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storageKey: string;
  url?: string | null;
}) {
  const [row] = await db.insert(requirementFiles).values(values).returning();
  return row!;
}

export async function deleteRequirementFile(id: string) {
  return db.delete(requirementFiles).where(eq(requirementFiles.id, id));
}

// ============ Requirement requests (registrar requests document from student) ============

export async function createRequirementRequest(values: {
  enrollmentId: string;
  submissionId: string;
  requestedByUserId: string;
  message?: string | null;
}) {
  const [row] = await db.insert(requirementRequests).values(values).returning();
  return row!;
}

export async function getRequirementRequestsByEnrollment(enrollmentId: string) {
  return db
    .select({
      id: requirementRequests.id,
      submissionId: requirementRequests.submissionId,
      requirementId: studentRequirementSubmissions.requirementId,
      requirementCode: requirements.code,
      requirementName: requirements.name,
      requestedAt: requirementRequests.requestedAt,
      message: requirementRequests.message,
      status: requirementRequests.status,
    })
    .from(requirementRequests)
    .innerJoin(studentRequirementSubmissions, eq(requirementRequests.submissionId, studentRequirementSubmissions.id))
    .innerJoin(requirements, eq(studentRequirementSubmissions.requirementId, requirements.id))
    .where(eq(requirementRequests.enrollmentId, enrollmentId))
    .orderBy(desc(requirementRequests.requestedAt));
}

export async function getPendingRequirementRequestsBySubmissionId(submissionId: string) {
  return db
    .select()
    .from(requirementRequests)
    .where(
      and(
        eq(requirementRequests.submissionId, submissionId),
        eq(requirementRequests.status, "pending")
      )
    );
}

export async function getPendingRequirementRequestsForEnrollment(enrollmentId: string) {
  return db
    .select({
      submissionId: requirementRequests.submissionId,
      requirementName: requirements.name,
      requirementCode: requirements.code,
      requestedAt: requirementRequests.requestedAt,
      message: requirementRequests.message,
    })
    .from(requirementRequests)
    .innerJoin(studentRequirementSubmissions, eq(requirementRequests.submissionId, studentRequirementSubmissions.id))
    .innerJoin(requirements, eq(studentRequirementSubmissions.requirementId, requirements.id))
    .where(
      and(
        eq(requirementRequests.enrollmentId, enrollmentId),
        eq(requirementRequests.status, "pending")
      )
    );
}

export async function markRequirementRequestFulfilled(id: string) {
  return db
    .update(requirementRequests)
    .set({ status: "fulfilled", updatedAt: new Date() })
    .where(eq(requirementRequests.id, id));
}

export async function getRequirementSubmissionById(id: string) {
  const [row] = await db
    .select()
    .from(studentRequirementSubmissions)
    .where(eq(studentRequirementSubmissions.id, id))
    .limit(1);
  return row ?? null;
}

/** Verified (passed) forms for a student: submission + requirement name + files, for registrar student detail. */
export async function getStudentVerifiedForms(studentId: string) {
  const rows = await db
    .select({
      submissionId: studentRequirementSubmissions.id,
      requirementId: requirements.id,
      requirementName: requirements.name,
      requirementCode: requirements.code,
      submittedAt: studentRequirementSubmissions.submittedAt,
      verifiedAt: studentRequirementSubmissions.verifiedAt,
      registrarRemarks: studentRequirementSubmissions.registrarRemarks,
      status: studentRequirementSubmissions.status,
    })
    .from(studentRequirementSubmissions)
    .innerJoin(requirements, eq(studentRequirementSubmissions.requirementId, requirements.id))
    .where(eq(studentRequirementSubmissions.studentId, studentId))
    .orderBy(desc(studentRequirementSubmissions.verifiedAt));

  const verified = rows.filter((r) => r.status === "verified");

  const withFiles = await Promise.all(
    verified.map(async (row) => {
      const { status: _s, ...rest } = row;
      const files = await getRequirementFilesBySubmissionId(row.submissionId);
      return {
        ...rest,
        files: files.map((f) => ({
          id: f.id,
          fileName: f.fileName,
          fileType: f.fileType,
          fileSize: f.fileSize,
          url: f.url,
        })),
      };
    })
  );
  return withFiles;
}

export async function getQueueSubmissions(filters?: {
  schoolYearId?: string;
  termId?: string;
  program?: string;
  search?: string;
  enrollmentStatus?: string;
}) {
  const base = db
    .select({
      id: studentRequirementSubmissions.id,
      studentId: students.id,
      requirementId: requirements.id,
      requirementName: requirements.name,
      requirementCode: requirements.code,
      submittedAt: studentRequirementSubmissions.submittedAt,
      status: studentRequirementSubmissions.status,
      firstName: students.firstName,
      lastName: students.lastName,
      studentCode: students.studentCode,
      program: enrollments.program,
      yearLevel: enrollments.yearLevel,
      schoolYearId: enrollments.schoolYearId,
      termId: enrollments.termId,
      enrollmentId: enrollments.id,
      enrollmentStatus: enrollments.status,
    })
    .from(studentRequirementSubmissions)
    .innerJoin(students, eq(studentRequirementSubmissions.studentId, students.id))
    .innerJoin(requirements, eq(studentRequirementSubmissions.requirementId, requirements.id))
    .leftJoin(enrollments, eq(studentRequirementSubmissions.enrollmentId, enrollments.id))
    .where(eq(studentRequirementSubmissions.status, "submitted"))
    .orderBy(desc(studentRequirementSubmissions.submittedAt));
  let rows = await base;
  if (filters?.schoolYearId) rows = rows.filter((r) => r.schoolYearId === filters.schoolYearId);
  if (filters?.termId) rows = rows.filter((r) => r.termId === filters.termId);
  if (filters?.program) rows = rows.filter((r) => r.program === filters.program);
  if (filters?.enrollmentStatus) rows = rows.filter((r) => r.enrollmentStatus === filters.enrollmentStatus);
  if (filters?.search?.trim()) {
    const s = filters.search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        (r.firstName?.toLowerCase().includes(s) ||
          r.lastName?.toLowerCase().includes(s) ||
          r.studentCode?.toLowerCase().includes(s)) ?? false
    );
  }
  return rows;
}

type AnnouncementAudience = "all" | "students" | "teachers" | "registrar" | "finance" | "program_head" | "dean";

export async function createAnnouncement(values: {
  title: string;
  body: string;
  audience?: AnnouncementAudience;
  program?: string | null;
  pinned?: boolean;
  createdByUserId: string;
}) {
  return db.insert(announcements).values({
    title: values.title,
    body: values.body,
    audience: values.audience ?? "all",
    program: values.program ?? null,
    pinned: values.pinned ?? false,
    createdByUserId: values.createdByUserId,
  });
}

export async function updateAnnouncement(
  id: string,
  values: {
    title?: string;
    body?: string;
    audience?: AnnouncementAudience;
    program?: string | null;
    pinned?: boolean;
  }
) {
  const { title, body, audience, program, pinned } = values;
  const set: {
    updatedAt: Date;
    title?: string;
    body?: string;
    audience?: AnnouncementAudience;
    program?: string | null;
    pinned?: boolean;
  } = { updatedAt: new Date() };
  if (title !== undefined) set.title = title;
  if (body !== undefined) set.body = body;
  if (audience !== undefined) set.audience = audience;
  if (program !== undefined) set.program = program;
  if (pinned !== undefined) set.pinned = pinned;
  return db.update(announcements).set(set).where(eq(announcements.id, id));
}

export async function deleteAnnouncement(id: string) {
  return db.delete(announcements).where(eq(announcements.id, id));
}

// ============ Teachers (user_profile with role=teacher, active=true) ============

/** Teacher = user_profile where role='teacher' and active=true */
function teacherShape(up: typeof userProfile.$inferSelect) {
  const parts = (up.fullName ?? "").trim().split(/\s+/);
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ") ?? "";
  return {
    id: up.id,
    userId: up.userId,
    userProfileId: up.id,
    firstName,
    lastName,
    fullName: up.fullName,
    email: up.email,
    employeeNo: up.employeeNo,
    position: up.position,
    departmentProgramId: up.departmentProgramId,
    active: up.active,
    createdAt: up.createdAt,
    updatedAt: up.updatedAt,
  };
}

export async function getTeacherByUserId(userId: string) {
  const [row] = await db
    .select()
    .from(userProfile)
    .where(and(eq(userProfile.userId, userId), eq(userProfile.role, "teacher"), eq(userProfile.active, true)))
    .limit(1);
  return row ? teacherShape(row) : null;
}

export async function getTeacherById(teacherUserProfileId: string) {
  const [row] = await db
    .select()
    .from(userProfile)
    .where(and(eq(userProfile.id, teacherUserProfileId), eq(userProfile.role, "teacher")))
    .limit(1);
  return row ? teacherShape(row) : null;
}

export async function getTeacherByUserProfileId(userProfileId: string) {
  return getTeacherById(userProfileId);
}

export async function createTeacher(values: {
  userId: string;
  userProfileId?: string | null;
  email?: string | null;
  fullName?: string | null;
  firstName?: string;
  lastName?: string;
  employeeNo?: string | null;
  active?: boolean;
}) {
  const fullName = values.fullName ?? ([values.firstName, values.lastName].filter(Boolean).join(" ") || "Teacher");
  // If user_profile exists (e.g. admin-created with different role), update to teacher
  const existing = await db.select().from(userProfile).where(eq(userProfile.userId, values.userId)).limit(1);
  if (existing[0]) {
    const [row] = await db
      .update(userProfile)
      .set({ role: "teacher", fullName, email: values.email ?? existing[0].email, active: values.active ?? true, employeeNo: values.employeeNo ?? existing[0].employeeNo, updatedAt: new Date() })
      .where(eq(userProfile.id, existing[0].id))
      .returning();
    return row ? teacherShape(row) : null;
  }
  const [row] = await db
    .insert(userProfile)
    .values({
      userId: values.userId,
      email: values.email ?? null,
      fullName,
      role: "teacher",
      active: values.active ?? true,
      employeeNo: values.employeeNo ?? null,
    })
    .returning();
  return row ? teacherShape(row) : null;
}

export async function updateTeacherUserId(teacherUserProfileId: string, userId: string) {
  await db
    .update(userProfile)
    .set({ userId, updatedAt: new Date() })
    .where(eq(userProfile.id, teacherUserProfileId));
}

export async function listTeacherAssignmentsForTeacher(
  teacherUserProfileId: string,
  filters: { schoolYearId?: string; termId?: string }
) {
  const conds = [eq(teacherAssignments.teacherUserProfileId, teacherUserProfileId)];
  if (filters.schoolYearId) conds.push(eq(teacherAssignments.schoolYearId, filters.schoolYearId));
  if (filters.termId) conds.push(eq(teacherAssignments.termId, filters.termId));
  return db
    .select({
      id: teacherAssignments.id,
      scheduleId: teacherAssignments.scheduleId,
      schoolYearId: teacherAssignments.schoolYearId,
      termId: teacherAssignments.termId,
      subjectCode: subjects.code,
      subjectDescription: subjects.description,
      sectionName: sections.name,
      timeIn: classSchedules.timeIn,
      timeOut: classSchedules.timeOut,
      room: classSchedules.room,
      schoolYearName: schoolYears.name,
      termName: terms.name,
    })
    .from(teacherAssignments)
    .innerJoin(classSchedules, eq(teacherAssignments.scheduleId, classSchedules.id))
    .innerJoin(schoolYears, eq(teacherAssignments.schoolYearId, schoolYears.id))
    .innerJoin(terms, eq(teacherAssignments.termId, terms.id))
    .innerJoin(subjects, eq(classSchedules.subjectId, subjects.id))
    .innerJoin(sections, eq(classSchedules.sectionId, sections.id))
    .where(and(...conds))
    .orderBy(classSchedules.timeIn);
}

/** Schedules assigned to teacher that meet on the given day (e.g. "Mon", "Tue"). */
export async function getTodaysClassesForTeacher(
  teacherUserProfileId: string,
  dayShort: string,
  filters: { schoolYearId?: string; termId?: string }
) {
  const conds = [
    eq(teacherAssignments.teacherUserProfileId, teacherUserProfileId),
    eq(scheduleDays.day, dayShort),
    eq(scheduleDays.isActive, true),
  ];
  if (filters.schoolYearId) conds.push(eq(teacherAssignments.schoolYearId, filters.schoolYearId));
  if (filters.termId) conds.push(eq(teacherAssignments.termId, filters.termId));
  return db
    .select({
      scheduleId: teacherAssignments.scheduleId,
      subjectCode: subjects.code,
      subjectDescription: subjects.description,
      sectionName: sections.name,
      timeIn: classSchedules.timeIn,
      timeOut: classSchedules.timeOut,
      room: classSchedules.room,
    })
    .from(teacherAssignments)
    .innerJoin(classSchedules, eq(teacherAssignments.scheduleId, classSchedules.id))
    .innerJoin(scheduleDays, eq(scheduleDays.scheduleId, classSchedules.id))
    .innerJoin(subjects, eq(classSchedules.subjectId, subjects.id))
    .innerJoin(sections, eq(classSchedules.sectionId, sections.id))
    .where(and(...conds))
    .orderBy(classSchedules.timeIn);
}

/** Teacher's schedules from class_schedules (source of truth when teacher_assignments is empty). Includes approved and pending_approval so teachers see assigned classes before dean approval. */
export async function listTeacherSchedulesFromClassSchedules(
  teacherUserProfileId: string,
  filters: { schoolYearId?: string; termId?: string }
) {
  const conds = [
    eq(classSchedules.teacherUserProfileId, teacherUserProfileId),
    inArray(classSchedules.status, ["approved", "pending_approval"]),
  ];
  if (filters.schoolYearId) conds.push(eq(classSchedules.schoolYearId, filters.schoolYearId));
  if (filters.termId) conds.push(eq(classSchedules.termId, filters.termId));
  return db
    .select({
      id: classSchedules.id,
      scheduleId: classSchedules.id,
      schoolYearId: classSchedules.schoolYearId,
      termId: classSchedules.termId,
      subjectCode: subjects.code,
      subjectDescription: subjects.description,
      sectionName: sections.name,
      timeIn: classSchedules.timeIn,
      timeOut: classSchedules.timeOut,
      room: classSchedules.room,
      schoolYearName: schoolYears.name,
      termName: terms.name,
    })
    .from(classSchedules)
    .innerJoin(schoolYears, eq(classSchedules.schoolYearId, schoolYears.id))
    .innerJoin(terms, eq(classSchedules.termId, terms.id))
    .innerJoin(subjects, eq(classSchedules.subjectId, subjects.id))
    .innerJoin(sections, eq(classSchedules.sectionId, sections.id))
    .where(and(...conds))
    .orderBy(classSchedules.timeIn);
}

/** Teacher's classes for a given day from class_schedules (source of truth when teacher_assignments is empty). */
export async function getTodaysTeacherClassesFromClassSchedules(
  teacherUserProfileId: string,
  dayShort: string,
  filters: { schoolYearId?: string; termId?: string }
) {
  const conds = [
    eq(classSchedules.teacherUserProfileId, teacherUserProfileId),
    inArray(classSchedules.status, ["approved", "pending_approval"]),
    eq(scheduleDays.day, dayShort),
    eq(scheduleDays.isActive, true),
  ];
  if (filters.schoolYearId) conds.push(eq(classSchedules.schoolYearId, filters.schoolYearId));
  if (filters.termId) conds.push(eq(classSchedules.termId, filters.termId));
  return db
    .select({
      scheduleId: classSchedules.id,
      subjectCode: subjects.code,
      subjectDescription: subjects.description,
      sectionName: sections.name,
      timeIn: classSchedules.timeIn,
      timeOut: classSchedules.timeOut,
      room: classSchedules.room,
    })
    .from(classSchedules)
    .innerJoin(scheduleDays, eq(scheduleDays.scheduleId, classSchedules.id))
    .innerJoin(subjects, eq(classSchedules.subjectId, subjects.id))
    .innerJoin(sections, eq(classSchedules.sectionId, sections.id))
    .where(and(...conds))
    .orderBy(classSchedules.timeIn);
}

/** Teacher's schedule rows with day (one row per schedule per day) for weekly timetable. */
export async function listTeacherScheduleRowsWithDays(
  teacherUserProfileId: string,
  filters: { schoolYearId?: string; termId?: string }
) {
  const conds = [
    eq(classSchedules.teacherUserProfileId, teacherUserProfileId),
    inArray(classSchedules.status, ["approved", "pending_approval"]),
    eq(scheduleDays.isActive, true),
  ];
  if (filters.schoolYearId) conds.push(eq(classSchedules.schoolYearId, filters.schoolYearId));
  if (filters.termId) conds.push(eq(classSchedules.termId, filters.termId));
  return db
    .select({
      scheduleId: classSchedules.id,
      day: scheduleDays.day,
      subjectCode: subjects.code,
      subjectDescription: subjects.description,
      sectionName: sections.name,
      timeIn: classSchedules.timeIn,
      timeOut: classSchedules.timeOut,
      room: classSchedules.room,
    })
    .from(classSchedules)
    .innerJoin(scheduleDays, eq(scheduleDays.scheduleId, classSchedules.id))
    .innerJoin(subjects, eq(classSchedules.subjectId, subjects.id))
    .innerJoin(sections, eq(classSchedules.sectionId, sections.id))
    .where(and(...conds))
    .orderBy(scheduleDays.day, classSchedules.timeIn);
}

export async function getScheduleById(scheduleId: string) {
  const [row] = await db
    .select({
      id: classSchedules.id,
      schoolYearId: classSchedules.schoolYearId,
      termId: classSchedules.termId,
      sectionId: classSchedules.sectionId,
      subjectId: classSchedules.subjectId,
      subjectCode: subjects.code,
      subjectDescription: subjects.description,
      sectionName: sections.name,
      timeIn: classSchedules.timeIn,
      timeOut: classSchedules.timeOut,
      room: classSchedules.room,
      teacherName: classSchedules.teacherName,
    })
    .from(classSchedules)
    .innerJoin(subjects, eq(classSchedules.subjectId, subjects.id))
    .innerJoin(sections, eq(classSchedules.sectionId, sections.id))
    .where(eq(classSchedules.id, scheduleId))
    .limit(1);
  return row ?? null;
}

export async function getEnrollmentsBySectionAndTerm(sectionId: string, termId: string, schoolYearId: string) {
  const q = db
    .select({
      id: enrollments.id,
      studentId: enrollments.studentId,
      firstName: students.firstName,
      middleName: students.middleName,
      lastName: students.lastName,
      studentCode: students.studentCode,
    })
    .from(enrollments)
    .innerJoin(students, eq(enrollments.studentId, students.id))
    .where(
      and(
        eq(enrollments.sectionId, sectionId),
        eq(enrollments.termId, termId),
        eq(enrollments.schoolYearId, schoolYearId),
        eq(enrollments.status, "approved")
      )
    );
  return q.orderBy(students.lastName);
}

/** Roster for a class (schedule) from student_class_enrollments. Use for teacher gradebook when classes are finalized. */
export async function getRosterForClassByScheduleId(scheduleId: string) {
  const [schedule] = await db
    .select({ schoolYearId: classSchedules.schoolYearId, termId: classSchedules.termId })
    .from(classSchedules)
    .where(eq(classSchedules.id, scheduleId))
    .limit(1);
  if (!schedule) return [];
  const [offering] = await db
    .select({ id: classOfferings.id })
    .from(classOfferings)
    .where(
      and(
        eq(classOfferings.scheduleId, scheduleId),
        eq(classOfferings.schoolYearId, schedule.schoolYearId),
        eq(classOfferings.termId, schedule.termId),
        eq(classOfferings.active, true))
    )
    .limit(1);
  if (!offering) return [];
  return db
    .select({
      id: enrollments.id,
      studentId: enrollments.studentId,
      firstName: students.firstName,
      middleName: students.middleName,
      lastName: students.lastName,
      studentCode: students.studentCode,
    })
    .from(studentClassEnrollments)
    .innerJoin(enrollments, eq(studentClassEnrollments.enrollmentId, enrollments.id))
    .innerJoin(students, eq(enrollments.studentId, students.id))
    .where(
      and(
        eq(studentClassEnrollments.classOfferingId, offering.id),
        eq(studentClassEnrollments.status, "enrolled"))
    )
    .orderBy(students.lastName);
}

// ============ Grading Periods ============

export async function getGradingPeriodsBySchoolYearTerm(schoolYearId: string, termId: string) {
  return db
    .select()
    .from(gradingPeriods)
    .where(
      and(
        eq(gradingPeriods.schoolYearId, schoolYearId),
        eq(gradingPeriods.termId, termId),
        eq(gradingPeriods.isActive, true)
      )
    )
    .orderBy(gradingPeriods.sortOrder, gradingPeriods.name);
}

export async function getGradingPeriodById(id: string) {
  const [row] = await db.select().from(gradingPeriods).where(eq(gradingPeriods.id, id)).limit(1);
  return row ?? null;
}

// ============ Grade Submissions & Entries ============

export async function getGradeSubmissionByScheduleAndPeriod(scheduleId: string, gradingPeriodId: string) {
  const [row] = await db
    .select()
    .from(gradeSubmissions)
    .where(
      and(
        eq(gradeSubmissions.scheduleId, scheduleId),
        eq(gradeSubmissions.gradingPeriodId, gradingPeriodId)
      )
    )
    .limit(1);
  return row ?? null;
}

export async function getGradeSubmissionById(id: string) {
  const [row] = await db.select().from(gradeSubmissions).where(eq(gradeSubmissions.id, id)).limit(1);
  return row ?? null;
}

export async function getGradeSubmissionWithDetails(id: string) {
  const [row] = await db
    .select({
      id: gradeSubmissions.id,
      scheduleId: gradeSubmissions.scheduleId,
      schoolYearId: gradeSubmissions.schoolYearId,
      termId: gradeSubmissions.termId,
      gradingPeriodId: gradeSubmissions.gradingPeriodId,
      gradingPeriodName: gradingPeriods.name,
      teacherUserProfileId: gradeSubmissions.teacherUserProfileId,
      status: gradeSubmissions.status,
      submittedAt: gradeSubmissions.submittedAt,
      registrarRemarks: gradeSubmissions.registrarRemarks,
      registrarReviewedAt: gradeSubmissions.registrarReviewedAt,
      subjectCode: subjects.code,
      subjectDescription: subjects.description,
      sectionName: sections.name,
      teacherFirstName: sql<string>`COALESCE(SPLIT_PART(COALESCE(${userProfile.fullName},''), ' ', 1), '')`,
      teacherLastName: sql<string>`COALESCE(NULLIF(TRIM(SUBSTRING(COALESCE(${userProfile.fullName},'') FROM POSITION(' ' IN COALESCE(${userProfile.fullName},'')||' ')+1)), ''), '')`,
    })
    .from(gradeSubmissions)
    .innerJoin(gradingPeriods, eq(gradeSubmissions.gradingPeriodId, gradingPeriods.id))
    .innerJoin(classSchedules, eq(gradeSubmissions.scheduleId, classSchedules.id))
    .innerJoin(subjects, eq(classSchedules.subjectId, subjects.id))
    .innerJoin(sections, eq(classSchedules.sectionId, sections.id))
    .innerJoin(userProfile, eq(gradeSubmissions.teacherUserProfileId, userProfile.id))
    .where(eq(gradeSubmissions.id, id))
    .limit(1);
  return row ?? null;
}

type GradeSubmissionStatus = "draft" | "submitted" | "returned" | "approved" | "released";

export async function listGradeSubmissionsForTeacher(
  teacherUserProfileId: string,
  filters: { schoolYearId?: string; termId?: string; status?: GradeSubmissionStatus }
) {
  const conds = [eq(gradeSubmissions.teacherUserProfileId, teacherUserProfileId)];
  if (filters.schoolYearId) conds.push(eq(gradeSubmissions.schoolYearId, filters.schoolYearId));
  if (filters.termId) conds.push(eq(gradeSubmissions.termId, filters.termId));
  if (filters.status) conds.push(eq(gradeSubmissions.status, filters.status));
  return db
    .select({
      id: gradeSubmissions.id,
      scheduleId: gradeSubmissions.scheduleId,
      gradingPeriodId: gradeSubmissions.gradingPeriodId,
      gradingPeriodName: gradingPeriods.name,
      status: gradeSubmissions.status,
      submittedAt: gradeSubmissions.submittedAt,
      subjectCode: subjects.code,
      subjectDescription: subjects.description,
      sectionName: sections.name,
    })
    .from(gradeSubmissions)
    .innerJoin(gradingPeriods, eq(gradeSubmissions.gradingPeriodId, gradingPeriods.id))
    .innerJoin(classSchedules, eq(gradeSubmissions.scheduleId, classSchedules.id))
    .innerJoin(subjects, eq(classSchedules.subjectId, subjects.id))
    .innerJoin(sections, eq(classSchedules.sectionId, sections.id))
    .where(and(...conds))
    .orderBy(desc(gradeSubmissions.submittedAt));
}

export async function listGradeSubmissionsForRegistrar(filters: {
  schoolYearId?: string;
  termId?: string;
  status?: GradeSubmissionStatus;
}) {
  const conds: ReturnType<typeof eq>[] = [];
  if (filters.schoolYearId) conds.push(eq(gradeSubmissions.schoolYearId, filters.schoolYearId));
  if (filters.termId) conds.push(eq(gradeSubmissions.termId, filters.termId));
  if (filters.status) conds.push(eq(gradeSubmissions.status, filters.status));
  const base = db
    .select({
      id: gradeSubmissions.id,
      scheduleId: gradeSubmissions.scheduleId,
      gradingPeriodId: gradeSubmissions.gradingPeriodId,
      gradingPeriodName: gradingPeriods.name,
      status: gradeSubmissions.status,
      submittedAt: gradeSubmissions.submittedAt,
      subjectCode: subjects.code,
      subjectDescription: subjects.description,
      sectionName: sections.name,
      teacherFirstName: sql<string>`COALESCE(SPLIT_PART(COALESCE(${userProfile.fullName},''), ' ', 1), '')`,
      teacherLastName: sql<string>`COALESCE(NULLIF(TRIM(SUBSTRING(COALESCE(${userProfile.fullName},'') FROM POSITION(' ' IN COALESCE(${userProfile.fullName},'')||' ')+1)), ''), '')`,
    })
    .from(gradeSubmissions)
    .innerJoin(gradingPeriods, eq(gradeSubmissions.gradingPeriodId, gradingPeriods.id))
    .innerJoin(classSchedules, eq(gradeSubmissions.scheduleId, classSchedules.id))
    .innerJoin(subjects, eq(classSchedules.subjectId, subjects.id))
    .innerJoin(sections, eq(classSchedules.sectionId, sections.id))
    .innerJoin(userProfile, eq(gradeSubmissions.teacherUserProfileId, userProfile.id))
    .orderBy(desc(gradeSubmissions.submittedAt));
  if (conds.length > 0) return base.where(and(...conds));
  return base;
}

export async function getGradeEntriesBySubmissionId(submissionId: string) {
  return db
    .select({
      id: gradeEntries.id,
      studentId: gradeEntries.studentId,
      enrollmentId: gradeEntries.enrollmentId,
      firstName: students.firstName,
      middleName: students.middleName,
      lastName: students.lastName,
      studentCode: students.studentCode,
      numericGrade: gradeEntries.numericGrade,
      letterGrade: gradeEntries.letterGrade,
      remarks: gradeEntries.remarks,
    })
    .from(gradeEntries)
    .innerJoin(students, eq(gradeEntries.studentId, students.id))
    .where(eq(gradeEntries.submissionId, submissionId))
    .orderBy(students.lastName);
}

export async function isTeacherAssignedToSchedule(teacherUserProfileId: string, scheduleId: string) {
  const [row] = await db
    .select({ id: teacherAssignments.id })
    .from(teacherAssignments)
    .where(
      and(
        eq(teacherAssignments.teacherUserProfileId, teacherUserProfileId),
        eq(teacherAssignments.scheduleId, scheduleId)
      )
    )
    .limit(1);
  return !!row;
}

export async function isTeacherOwnerOfSchedule(teacherUserProfileId: string, scheduleId: string) {
  const [byAssignment] = await db
    .select({ id: teacherAssignments.id })
    .from(teacherAssignments)
    .where(
      and(
        eq(teacherAssignments.teacherUserProfileId, teacherUserProfileId),
        eq(teacherAssignments.scheduleId, scheduleId)
      )
    )
    .limit(1);
  if (byAssignment) return true;
  const [bySchedule] = await db
    .select({ id: classSchedules.id })
    .from(classSchedules)
    .where(
      and(
        eq(classSchedules.id, scheduleId),
        eq(classSchedules.teacherUserProfileId, teacherUserProfileId)
      )
    )
    .limit(1);
  return !!bySchedule;
}

export async function createGradeSubmission(values: {
  scheduleId: string;
  schoolYearId: string;
  termId: string;
  gradingPeriodId: string;
  teacherUserProfileId: string;
}) {
  const [row] = await db
    .insert(gradeSubmissions)
    .values({ ...values, status: "draft" })
    .returning();
  return row ?? null;
}

export type GradeEntryInput = {
  studentId: string;
  enrollmentId: string;
  numericGrade?: string | null;
  letterGrade?: string | null;
  remarks?: string | null;
};

export async function upsertGradeEntries(
  submissionId: string,
  entries: GradeEntryInput[]
) {
  for (const e of entries) {
    const existing = await db
      .select({ id: gradeEntries.id })
      .from(gradeEntries)
      .where(
        and(
          eq(gradeEntries.submissionId, submissionId),
          eq(gradeEntries.studentId, e.studentId)
        )
      )
      .limit(1);
    if (existing.length > 0) {
      await db
        .update(gradeEntries)
        .set({
          enrollmentId: e.enrollmentId,
          numericGrade: e.numericGrade ?? null,
          letterGrade: e.letterGrade ?? null,
          remarks: e.remarks ?? null,
          updatedAt: new Date(),
        })
        .where(eq(gradeEntries.id, existing[0].id));
    } else {
      await db.insert(gradeEntries).values({
        submissionId,
        studentId: e.studentId,
        enrollmentId: e.enrollmentId,
        numericGrade: e.numericGrade ?? null,
        letterGrade: e.letterGrade ?? null,
        remarks: e.remarks ?? null,
      });
    }
  }
}

export async function submitGradesForApproval(submissionId: string) {
  return db
    .update(gradeSubmissions)
    .set({ status: "submitted", submittedAt: new Date(), updatedAt: new Date() })
    .where(eq(gradeSubmissions.id, submissionId));
}

export async function returnGradeSubmission(
  submissionId: string,
  registrarUserId: string,
  remarks: string
) {
  return db
    .update(gradeSubmissions)
    .set({
      status: "returned",
      registrarReviewedByUserId: registrarUserId,
      registrarReviewedAt: new Date(),
      registrarRemarks: remarks,
      updatedAt: new Date(),
    })
    .where(eq(gradeSubmissions.id, submissionId));
}

export async function approveGradeSubmission(submissionId: string, registrarUserId: string) {
  return db
    .update(gradeSubmissions)
    .set({
      status: "approved",
      registrarReviewedByUserId: registrarUserId,
      registrarReviewedAt: new Date(),
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(gradeSubmissions.id, submissionId));
}

export async function releaseGradeSubmission(submissionId: string) {
  return db
    .update(gradeSubmissions)
    .set({
      status: "released",
      releasedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(gradeSubmissions.id, submissionId));
}

export async function getReleasedGradesByStudentAndEnrollment(
  studentId: string,
  enrollmentId: string
) {
  return db
    .select({
      subjectCode: subjects.code,
      subjectDescription: subjects.description,
      gradingPeriodName: gradingPeriods.name,
      numericGrade: gradeEntries.numericGrade,
      letterGrade: gradeEntries.letterGrade,
      remarks: gradeEntries.remarks,
    })
    .from(gradeEntries)
    .innerJoin(gradeSubmissions, eq(gradeEntries.submissionId, gradeSubmissions.id))
    .innerJoin(gradingPeriods, eq(gradeSubmissions.gradingPeriodId, gradingPeriods.id))
    .innerJoin(classSchedules, eq(gradeSubmissions.scheduleId, classSchedules.id))
    .innerJoin(subjects, eq(classSchedules.subjectId, subjects.id))
    .where(
      and(
        eq(gradeEntries.studentId, studentId),
        eq(gradeEntries.enrollmentId, enrollmentId),
        eq(gradeSubmissions.status, "released")
      )
    )
    .orderBy(gradingPeriods.sortOrder, gradingPeriods.name);
}

export async function getCurrentEnrollmentForStudent(studentId: string) {
  const sy = await getActiveSchoolYear();
  const term = await getActiveTerm();
  if (!sy || !term) return null;
  const list = await getEnrollmentsList({
    studentId,
    schoolYearId: sy.id,
    termId: term.id,
  });
  const [first] = list;
  return first ? { id: first.id } : null;
}

/** Full enrollment row for the active school year/term for a student (for student portal). */
export async function getEnrollmentForStudentActiveTerm(studentId: string) {
  if (!studentId || typeof studentId !== "string" || studentId.trim() === "") return null;
  const sy = await getActiveSchoolYear();
  const term = await getActiveTerm();
  if (!sy || !term) return null;
  const [row] = await db
    .select({
      id: enrollments.id,
      studentId: enrollments.studentId,
      schoolYearId: enrollments.schoolYearId,
      termId: enrollments.termId,
      programId: enrollments.programId,
      program: enrollments.program,
      yearLevel: enrollments.yearLevel,
      sectionId: enrollments.sectionId,
      status: enrollments.status,
      createdAt: enrollments.createdAt,
      updatedAt: enrollments.updatedAt,
      schoolYearName: schoolYears.name,
      termName: terms.name,
    })
    .from(enrollments)
    .innerJoin(schoolYears, eq(enrollments.schoolYearId, schoolYears.id))
    .innerJoin(terms, eq(enrollments.termId, terms.id))
    .where(
      and(
        eq(enrollments.studentId, studentId),
        eq(enrollments.schoolYearId, sy.id),
        eq(enrollments.termId, term.id)
      )
    )
    .limit(1);
  return row ?? null;
}

// ============ Fee Setups ============

export async function getFeeSetupsList(filters?: {
  programId?: string;
  yearLevel?: string;
  schoolYearId?: string;
  termId?: string;
  status?: string;
}) {
  const conds: ReturnType<typeof eq>[] = [];
  if (filters?.programId) conds.push(eq(feeSetups.programId, filters.programId));
  if (filters?.yearLevel) conds.push(eq(feeSetups.yearLevel, filters.yearLevel));
  if (filters?.schoolYearId) conds.push(eq(feeSetups.schoolYearId, filters.schoolYearId));
  if (filters?.termId) conds.push(eq(feeSetups.termId, filters.termId));
  if (filters?.status) conds.push(eq(feeSetups.status, filters.status as "draft" | "approved"));

  let q = db
    .select({
      id: feeSetups.id,
      programId: feeSetups.programId,
      yearLevel: feeSetups.yearLevel,
      schoolYearId: feeSetups.schoolYearId,
      termId: feeSetups.termId,
      status: feeSetups.status,
      tuitionPerUnit: feeSetups.tuitionPerUnit,
      notes: feeSetups.notes,
      createdAt: feeSetups.createdAt,
      programCode: programs.code,
      programName: programs.name,
      schoolYearName: schoolYears.name,
      termName: terms.name,
    })
    .from(feeSetups)
    .leftJoin(programs, eq(feeSetups.programId, programs.id))
    .leftJoin(schoolYears, eq(feeSetups.schoolYearId, schoolYears.id))
    .leftJoin(terms, eq(feeSetups.termId, terms.id))
    .orderBy(desc(feeSetups.updatedAt));
  if (conds.length > 0) {
    q = q.where(and(...conds)) as typeof q;
  }
  return q;
}

export async function getFeeSetupById(id: string) {
  const [row] = await db
    .select()
    .from(feeSetups)
    .where(eq(feeSetups.id, id))
    .limit(1);
  return row ?? null;
}

export async function getFeeSetupWithDetails(id: string) {
  const [setup] = await db
    .select({
      id: feeSetups.id,
      programId: feeSetups.programId,
      yearLevel: feeSetups.yearLevel,
      schoolYearId: feeSetups.schoolYearId,
      termId: feeSetups.termId,
      status: feeSetups.status,
      tuitionPerUnit: feeSetups.tuitionPerUnit,
      notes: feeSetups.notes,
      createdAt: feeSetups.createdAt,
      programCode: programs.code,
      programName: programs.name,
      schoolYearName: schoolYears.name,
      termName: terms.name,
    })
    .from(feeSetups)
    .leftJoin(programs, eq(feeSetups.programId, programs.id))
    .leftJoin(schoolYears, eq(feeSetups.schoolYearId, schoolYears.id))
    .leftJoin(terms, eq(feeSetups.termId, terms.id))
    .where(eq(feeSetups.id, id))
    .limit(1);
  if (!setup) return null;

  const lines = await db
    .select()
    .from(feeSetupLines)
    .where(eq(feeSetupLines.feeSetupId, id))
    .orderBy(feeSetupLines.sortOrder);

  const [approval] = await db
    .select()
    .from(feeSetupApprovals)
    .where(eq(feeSetupApprovals.feeSetupId, id))
    .limit(1);

  return { setup, lines, approval: approval ?? null };
}

export async function createFeeSetup(values: {
  programId: string;
  yearLevel?: string | null;
  schoolYearId?: string | null;
  termId?: string | null;
  tuitionPerUnit?: string;
  notes?: string | null;
  createdByUserId?: string | null;
}) {
  const [row] = await db
    .insert(feeSetups)
    .values({
      programId: values.programId,
      yearLevel: values.yearLevel ?? null,
      schoolYearId: values.schoolYearId ?? null,
      termId: values.termId ?? null,
      status: "draft",
      tuitionPerUnit: values.tuitionPerUnit ?? "0",
      notes: values.notes ?? null,
      createdByUserId: values.createdByUserId ?? null,
    })
    .returning();
  return row;
}

export async function updateFeeSetup(
  id: string,
  values: {
    programId?: string;
    yearLevel?: string | null;
    schoolYearId?: string | null;
    termId?: string | null;
    tuitionPerUnit?: string;
    notes?: string | null;
    status?:
      | "draft"
      | "pending_program_head"
      | "pending_dean"
      | "approved"
      | "rejected"
      | "archived";
  }
) {
  await db
    .update(feeSetups)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(feeSetups.id, id));
}

export async function addFeeSetupLine(values: {
  feeSetupId: string;
  lineType: "tuition_component" | "lab_fee" | "misc_fee" | "other_fee";
  label: string;
  amount: string;
  qty?: number;
  perUnit?: boolean;
  sortOrder?: number;
}) {
  const [row] = await db
    .insert(feeSetupLines)
    .values({
      feeSetupId: values.feeSetupId,
      lineType: values.lineType,
      label: values.label,
      amount: values.amount,
      qty: values.qty ?? 1,
      perUnit: values.perUnit ?? false,
      sortOrder: values.sortOrder ?? 0,
    })
    .returning();
  return row;
}

export async function updateFeeSetupLine(
  lineId: string,
  values: {
    label?: string;
    amount?: string;
    qty?: number;
    perUnit?: boolean;
    sortOrder?: number;
  }
) {
  await db
    .update(feeSetupLines)
    .set(values)
    .where(eq(feeSetupLines.id, lineId));
}

export async function deleteFeeSetupLine(lineId: string) {
  await db.delete(feeSetupLines).where(eq(feeSetupLines.id, lineId));
}

export async function getFeeSetupApprovalByFeeSetupId(feeSetupId: string) {
  const [row] = await db
    .select()
    .from(feeSetupApprovals)
    .where(eq(feeSetupApprovals.feeSetupId, feeSetupId))
    .limit(1);
  return row ?? null;
}

export async function upsertFeeSetupApproval(
  feeSetupId: string,
  values: {
    programHeadStatus?: "pending" | "approved" | "rejected";
    programHeadByUserId?: string | null;
    programHeadAt?: Date | null;
    programHeadRemarks?: string | null;
    deanStatus?: "pending" | "approved" | "rejected";
    deanByUserId?: string | null;
    deanAt?: Date | null;
    deanRemarks?: string | null;
  }
) {
  const existing = await getFeeSetupApprovalByFeeSetupId(feeSetupId);
  if (existing) {
    await db
      .update(feeSetupApprovals)
      .set(values)
      .where(eq(feeSetupApprovals.feeSetupId, feeSetupId));
  } else {
    await db.insert(feeSetupApprovals).values({
      feeSetupId,
      programHeadStatus: values.programHeadStatus ?? "pending",
      programHeadByUserId: values.programHeadByUserId ?? null,
      programHeadAt: values.programHeadAt ?? null,
      programHeadRemarks: values.programHeadRemarks ?? null,
      deanStatus: values.deanStatus ?? "pending",
      deanByUserId: values.deanByUserId ?? null,
      deanAt: values.deanAt ?? null,
      deanRemarks: values.deanRemarks ?? null,
    });
  }
}

export async function getFeeSetupLinesByFeeSetupId(feeSetupId: string) {
  return db
    .select()
    .from(feeSetupLines)
    .where(eq(feeSetupLines.feeSetupId, feeSetupId))
    .orderBy(feeSetupLines.sortOrder);
}

// ============ Curriculum ============

export async function getCurriculumVersionsList(filters?: {
  programId?: string;
  schoolYearId?: string;
  status?: "draft" | "published" | "archived";
}) {
  const conds: ReturnType<typeof eq>[] = [];
  if (filters?.programId) conds.push(eq(curriculumVersions.programId, filters.programId));
  if (filters?.schoolYearId)
    conds.push(eq(curriculumVersions.schoolYearId, filters.schoolYearId));
  if (filters?.status) conds.push(eq(curriculumVersions.status, filters.status));
  const base = db
    .select({
      id: curriculumVersions.id,
      programId: curriculumVersions.programId,
      schoolYearId: curriculumVersions.schoolYearId,
      name: curriculumVersions.name,
      status: curriculumVersions.status,
      createdAt: curriculumVersions.createdAt,
      updatedAt: curriculumVersions.updatedAt,
      programCode: programs.code,
      programName: programs.name,
      schoolYearName: schoolYears.name,
    })
    .from(curriculumVersions)
    .innerJoin(programs, eq(curriculumVersions.programId, programs.id))
    .innerJoin(schoolYears, eq(curriculumVersions.schoolYearId, schoolYears.id))
    .orderBy(desc(curriculumVersions.updatedAt));
  if (conds.length) return base.where(and(...conds));
  return base;
}

export async function getCurriculumVersionById(id: string) {
  const [row] = await db
    .select()
    .from(curriculumVersions)
    .where(eq(curriculumVersions.id, id))
    .limit(1);
  return row ?? null;
}

export async function createCurriculumVersion(values: {
  programId: string;
  schoolYearId: string;
  name: string;
  createdByUserId?: string | null;
}) {
  const [row] = await db
    .insert(curriculumVersions)
    .values({
      programId: values.programId,
      schoolYearId: values.schoolYearId,
      name: values.name,
      status: "draft",
      createdByUserId: values.createdByUserId ?? null,
    })
    .returning();
  return row ?? null;
}

export async function updateCurriculumVersionStatus(
  id: string,
  status: "draft" | "published" | "archived"
) {
  await db
    .update(curriculumVersions)
    .set({ status, updatedAt: new Date() })
    .where(eq(curriculumVersions.id, id));
}

/** Permanently delete a curriculum version. Blocks and block subjects cascade. */
export async function deleteCurriculumVersion(id: string) {
  await db.delete(curriculumVersions).where(eq(curriculumVersions.id, id));
}

/** True if there is another published version for the same program + school year (excluding given id). */
export async function hasOtherPublishedCurriculumForProgramYear(
  programId: string,
  schoolYearId: string,
  excludeVersionId: string
): Promise<boolean> {
  const rows = await db
    .select({ id: curriculumVersions.id })
    .from(curriculumVersions)
    .where(
      and(
        eq(curriculumVersions.programId, programId),
        eq(curriculumVersions.schoolYearId, schoolYearId),
        eq(curriculumVersions.status, "published")
      )
    );
  return rows.some((r) => r.id !== excludeVersionId);
}

export async function getCurriculumBlocksByVersionId(curriculumVersionId: string) {
  return db
    .select({
      id: curriculumBlocks.id,
      curriculumVersionId: curriculumBlocks.curriculumVersionId,
      yearLevel: curriculumBlocks.yearLevel,
      termId: curriculumBlocks.termId,
      sortOrder: curriculumBlocks.sortOrder,
      termName: terms.name,
    })
    .from(curriculumBlocks)
    .innerJoin(terms, eq(curriculumBlocks.termId, terms.id))
    .where(eq(curriculumBlocks.curriculumVersionId, curriculumVersionId))
    .orderBy(asc(curriculumBlocks.sortOrder), asc(curriculumBlocks.yearLevel));
}

export async function getCurriculumBlockById(id: string) {
  const [row] = await db
    .select()
    .from(curriculumBlocks)
    .where(eq(curriculumBlocks.id, id))
    .limit(1);
  return row ?? null;
}

export async function createCurriculumBlock(values: {
  curriculumVersionId: string;
  yearLevel: string;
  termId: string;
  sortOrder?: number;
}) {
  const [row] = await db
    .insert(curriculumBlocks)
    .values({
      curriculumVersionId: values.curriculumVersionId,
      yearLevel: values.yearLevel,
      termId: values.termId,
      sortOrder: values.sortOrder ?? 0,
    })
    .returning();
  return row ?? null;
}

export async function getOrCreateCurriculumBlock(values: {
  curriculumVersionId: string;
  yearLevel: string;
  termId: string;
  sortOrder?: number;
}) {
  const existing = await db
    .select()
    .from(curriculumBlocks)
    .where(
      and(
        eq(curriculumBlocks.curriculumVersionId, values.curriculumVersionId),
        eq(curriculumBlocks.yearLevel, values.yearLevel),
        eq(curriculumBlocks.termId, values.termId)
      )
    )
    .limit(1);
  if (existing[0]) return existing[0];
  const created = await createCurriculumBlock(values);
  return created;
}

export async function getCurriculumBlockSubjectsByBlockId(curriculumBlockId: string) {
  return db
    .select({
      id: curriculumBlockSubjects.id,
      subjectId: curriculumBlockSubjects.subjectId,
      isRequired: curriculumBlockSubjects.isRequired,
      sortOrder: curriculumBlockSubjects.sortOrder,
      prereqText: curriculumBlockSubjects.prereqText,
      withLab: curriculumBlockSubjects.withLab,
      code: subjects.code,
      title: subjects.title,
      units: subjects.units,
      isGe: subjects.isGe,
    })
    .from(curriculumBlockSubjects)
    .innerJoin(subjects, eq(curriculumBlockSubjects.subjectId, subjects.id))
    .where(eq(curriculumBlockSubjects.curriculumBlockId, curriculumBlockId))
    .orderBy(curriculumBlockSubjects.sortOrder);
}

export async function addCurriculumBlockSubject(values: {
  curriculumBlockId: string;
  subjectId: string;
  isRequired?: boolean;
  sortOrder?: number;
  prereqText?: string | null;
  withLab?: boolean;
}) {
  const [row] = await db
    .insert(curriculumBlockSubjects)
    .values({
      curriculumBlockId: values.curriculumBlockId,
      subjectId: values.subjectId,
      isRequired: values.isRequired ?? true,
      sortOrder: values.sortOrder ?? 0,
      prereqText: values.prereqText ?? null,
      withLab: values.withLab ?? false,
    })
    .returning();
  return row ?? null;
}

export async function updateCurriculumBlockSubject(
  id: string,
  values: { prereqText?: string | null; withLab?: boolean; sortOrder?: number }
) {
  const set: Record<string, unknown> = {};
  if (values.prereqText !== undefined) set.prereqText = values.prereqText;
  if (values.withLab !== undefined) set.withLab = values.withLab;
  if (values.sortOrder !== undefined) set.sortOrder = values.sortOrder;
  if (Object.keys(set).length === 0) return;
  await db
    .update(curriculumBlockSubjects)
    .set(set as Record<string, string | number | boolean | null>)
    .where(eq(curriculumBlockSubjects.id, id));
}

export async function removeCurriculumBlockSubject(id: string) {
  await db
    .delete(curriculumBlockSubjects)
    .where(eq(curriculumBlockSubjects.id, id));
}

export async function getCurriculumBlockSubjectById(id: string) {
  const [row] = await db
    .select({
      id: curriculumBlockSubjects.id,
      subjectId: curriculumBlockSubjects.subjectId,
      curriculumBlockId: curriculumBlockSubjects.curriculumBlockId,
      withLab: curriculumBlockSubjects.withLab,
      prereqText: curriculumBlockSubjects.prereqText,
      sortOrder: curriculumBlockSubjects.sortOrder,
      curriculumVersionId: curriculumBlocks.curriculumVersionId,
      yearLevel: curriculumBlocks.yearLevel,
      termId: curriculumBlocks.termId,
    })
    .from(curriculumBlockSubjects)
    .innerJoin(curriculumBlocks, eq(curriculumBlockSubjects.curriculumBlockId, curriculumBlocks.id))
    .where(eq(curriculumBlockSubjects.id, id))
    .limit(1);
  return row ?? null;
}

/** Clone a curriculum version: create new version and copy all blocks + block_subjects. */
export async function cloneCurriculumVersion(params: {
  fromVersionId: string;
  programId: string;
  schoolYearId: string;
  name: string;
  createdByUserId?: string | null;
}) {
  const fromVersion = await getCurriculumVersionById(params.fromVersionId);
  if (!fromVersion) return null;
  const newVersion = await createCurriculumVersion({
    programId: params.programId,
    schoolYearId: params.schoolYearId,
    name: params.name,
    createdByUserId: params.createdByUserId,
  });
  if (!newVersion) return null;
  const blocks = await db
    .select()
    .from(curriculumBlocks)
    .where(eq(curriculumBlocks.curriculumVersionId, params.fromVersionId));
  for (const block of blocks) {
    const [newBlock] = await db
      .insert(curriculumBlocks)
      .values({
        curriculumVersionId: newVersion.id,
        yearLevel: block.yearLevel,
        termId: block.termId,
        sortOrder: block.sortOrder,
      })
      .returning();
    if (!newBlock) continue;
    const subjRows = await db
      .select()
      .from(curriculumBlockSubjects)
      .where(eq(curriculumBlockSubjects.curriculumBlockId, block.id));
    for (const s of subjRows) {
      await db.insert(curriculumBlockSubjects).values({
        curriculumBlockId: newBlock.id,
        subjectId: s.subjectId,
        isRequired: s.isRequired,
        sortOrder: s.sortOrder,
        prereqText: s.prereqText,
        withLab: s.withLab,
      });
    }
  }
  return newVersion;
}

/** Prefer curriculum-based total units when published curriculum exists for enrollment. */
export async function getTotalUnitsForEnrollment(enrollmentId: string): Promise<number> {
  const [enrollment] = await db
    .select({
      programId: enrollments.programId,
      schoolYearId: enrollments.schoolYearId,
      termId: enrollments.termId,
      yearLevel: enrollments.yearLevel,
      sectionId: enrollments.sectionId,
    })
    .from(enrollments)
    .where(eq(enrollments.id, enrollmentId))
    .limit(1);
  if (!enrollment) return 0;
  const { getCurriculumSubjectsAndTotalUnitsForEnrollment } = await import(
    "@/lib/curriculum/queries"
  );
  const curriculum = await getCurriculumSubjectsAndTotalUnitsForEnrollment({
    programId: enrollment.programId,
    schoolYearId: enrollment.schoolYearId,
    termId: enrollment.termId,
    yearLevel: enrollment.yearLevel,
  });
  if (curriculum) return curriculum.totalUnits;
  if (!enrollment.sectionId) return 0;
  const rows = await db
    .select({ units: subjects.units })
    .from(classSchedules)
    .innerJoin(subjects, eq(classSchedules.subjectId, subjects.id))
    .where(
      and(
        eq(classSchedules.sectionId, enrollment.sectionId),
        eq(classSchedules.schoolYearId, enrollment.schoolYearId),
        eq(classSchedules.termId, enrollment.termId)
      )
    );
  return rows.reduce((sum, r) => sum + parseFloat(String(r.units ?? 0)), 0);
}

export async function createAssessmentFromFeeSetup(params: {
  enrollmentId: string;
  feeSetupId: string;
  totalUnits: number;
  tuitionPerUnit: string;
  tuitionAmount: string;
  labTotal: string;
  miscTotal: string;
  otherTotal: string;
  subtotal: string;
  discounts: string;
  total: string;
  lines: Array<{
    sourceFeeSetupLineId?: string | null;
    description: string;
    category: "tuition" | "lab" | "misc" | "other";
    amount: string;
    qty: number;
    lineTotal: string;
    sortOrder: number;
  }>;
}) {
  const [assessment] = await db
    .insert(assessments)
    .values({
      enrollmentId: params.enrollmentId,
      feeSetupId: params.feeSetupId,
      status: "draft",
      totalUnits: params.totalUnits,
      tuitionRate: params.tuitionPerUnit,
      tuitionAmount: params.tuitionAmount,
      labTotal: params.labTotal,
      miscTotal: params.miscTotal,
      otherTotal: params.otherTotal,
      subtotal: params.subtotal,
      discounts: params.discounts,
      total: params.total,
    })
    .returning();
  if (!assessment) return null;
  for (const l of params.lines) {
    await db.insert(assessmentLines).values({
      assessmentId: assessment.id,
      sourceFeeSetupLineId: l.sourceFeeSetupLineId ?? null,
      description: l.description,
      category: l.category,
      amount: l.amount,
      qty: l.qty,
      lineTotal: l.lineTotal,
      sortOrder: l.sortOrder,
    });
  }
  return assessment;
}

export async function getAssessmentFormData(assessmentId: string) {
  const [row] = await db
    .select({
      assessmentId: assessments.id,
      enrollmentId: assessments.enrollmentId,
      feeSetupId: assessments.feeSetupId,
      totalUnits: assessments.totalUnits,
      tuitionRate: assessments.tuitionRate,
      tuitionAmount: assessments.tuitionAmount,
      labTotal: assessments.labTotal,
      miscTotal: assessments.miscTotal,
      otherTotal: assessments.otherTotal,
      subtotal: assessments.subtotal,
      discounts: assessments.discounts,
      total: assessments.total,
      status: assessments.status,
      assessedAt: assessments.assessedAt,
      assessedByUserId: assessments.assessedByUserId,
      studentId: students.id,
      studentCode: students.studentCode,
      firstName: students.firstName,
      middleName: students.middleName,
      lastName: students.lastName,
      sectionId: enrollments.sectionId,
      programId: enrollments.programId,
      program: enrollments.program,
      yearLevel: enrollments.yearLevel,
      schoolYearId: enrollments.schoolYearId,
      termId: enrollments.termId,
      schoolYearName: schoolYears.name,
      termName: terms.name,
      programName: programs.name,
      efsBalance: enrollmentFinanceStatus.balance,
    })
    .from(assessments)
    .innerJoin(enrollments, eq(assessments.enrollmentId, enrollments.id))
    .innerJoin(students, eq(enrollments.studentId, students.id))
    .innerJoin(schoolYears, eq(enrollments.schoolYearId, schoolYears.id))
    .innerJoin(terms, eq(enrollments.termId, terms.id))
    .leftJoin(programs, eq(enrollments.programId, programs.id))
    .leftJoin(enrollmentFinanceStatus, eq(assessments.enrollmentId, enrollmentFinanceStatus.enrollmentId))
    .where(eq(assessments.id, assessmentId))
    .limit(1);
  if (!row) return null;

  const lines = await db
    .select({
      id: assessmentLines.id,
      description: assessmentLines.description,
      category: assessmentLines.category,
      amount: assessmentLines.amount,
      qty: assessmentLines.qty,
      lineTotal: assessmentLines.lineTotal,
      sortOrder: assessmentLines.sortOrder,
    })
    .from(assessmentLines)
    .where(eq(assessmentLines.assessmentId, assessmentId))
    .orderBy(assessmentLines.sortOrder);

  let scheduleSubjects: Array<{
    code: string;
    title: string;
    units: string;
    prereq?: string;
    withLab?: boolean;
  }> = [];
  const enrollmentId = row.enrollmentId;

  // Prefer curriculum subjects (what the assessment is based on) over schedule/enrollments.
  // The assessment fees are computed from curriculum (total units, lab count); Part I should list those same subjects.
  const { getCurriculumSubjectsAndTotalUnitsForEnrollment } = await import(
    "@/lib/curriculum/queries"
  );
  const curriculumData = await getCurriculumSubjectsAndTotalUnitsForEnrollment({
    programId: row.programId ?? null,
    schoolYearId: row.schoolYearId,
    termId: row.termId,
    yearLevel: row.yearLevel ?? null,
  });
  if (curriculumData) {
    scheduleSubjects = curriculumData.subjects.map((s) => ({
      code: s.code,
      title: s.title,
      units: s.units,
      prereq: s.prereqText ?? undefined,
      withLab: s.withLab,
    }));
  } else {
    // Fallback: class enrollments, enrollment_subjects, or section schedule when no curriculum
    let fromOfferings: Array<{ code: string; title: string | null; units: string | null }> = [];
    try {
      const fromOfferingsRaw = await db
        .select({
          code: subjects.code,
          title: subjects.title,
          units: subjects.units,
        })
        .from(studentClassEnrollments)
        .innerJoin(classOfferings, eq(studentClassEnrollments.classOfferingId, classOfferings.id))
        .innerJoin(subjects, eq(classOfferings.subjectId, subjects.id))
        .where(
          and(
            eq(studentClassEnrollments.enrollmentId, enrollmentId),
            eq(studentClassEnrollments.status, "enrolled"))
        );
      fromOfferings = fromOfferingsRaw.filter(
        (s, i, arr) => arr.findIndex((x) => x.code === s.code) === i
      );
    } catch {
      // student_class_enrollments may not exist
    }
    if (fromOfferings.length > 0) {
      scheduleSubjects = fromOfferings.map((s) => ({
        code: s.code,
        title: s.title ?? "",
        units: String(s.units ?? 0),
        prereq: undefined,
        withLab: undefined,
      }));
    } else {
      let fromSnapshot: Array<{ code: string; title: string | null; units: string | null }> = [];
      try {
        fromSnapshot = await db
          .select({
            code: subjects.code,
            title: subjects.title,
            units: subjects.units,
          })
          .from(enrollmentSubjects)
          .innerJoin(subjects, eq(enrollmentSubjects.subjectId, subjects.id))
          .where(eq(enrollmentSubjects.enrollmentId, enrollmentId));
      } catch {
        // enrollment_subjects may not exist
      }
      if (fromSnapshot.length > 0) {
        scheduleSubjects = fromSnapshot.map((s) => ({
          code: s.code,
          title: s.title ?? "",
          units: String(s.units ?? 0),
          prereq: undefined,
          withLab: undefined,
        }));
      } else if (row.sectionId) {
        try {
          const sched = await db
            .select({
              subjectCode: subjects.code,
              subjectTitle: subjects.title,
              units: subjects.units,
            })
            .from(classSchedules)
            .innerJoin(subjects, eq(classSchedules.subjectId, subjects.id))
            .where(
              and(
                eq(classSchedules.sectionId, row.sectionId),
                eq(classSchedules.schoolYearId, row.schoolYearId),
                eq(classSchedules.termId, row.termId)
              )
            );
          scheduleSubjects = sched.map((s) => ({
            code: s.subjectCode,
            title: s.subjectTitle ?? "",
            units: String(s.units ?? 0),
            prereq: undefined,
            withLab: undefined,
          }));
        } catch {
          // class_schedules query may fail
        }
      }
    }
  }

  return {
    assessment: {
      id: row.assessmentId,
      totalUnits: row.totalUnits,
      tuitionRate: row.tuitionRate,
      tuitionAmount: row.tuitionAmount,
      labTotal: row.labTotal,
      miscTotal: row.miscTotal,
      otherTotal: row.otherTotal,
      subtotal: row.subtotal,
      discounts: row.discounts,
      total: row.total,
      status: row.status,
      assessedAt: row.assessedAt,
      assessedByUserId: row.assessedByUserId,
      efsBalance: row.efsBalance,
    },
    studentId: row.studentId,
    student: {
      studentCode: row.studentCode,
      fullName: [row.firstName, row.middleName, row.lastName]
        .filter(Boolean)
        .join(" "),
      firstName: row.firstName,
      middleName: row.middleName,
      lastName: row.lastName,
    },
    program: row.program,
    programName: row.programName,
    yearLevel: row.yearLevel,
    schoolYearName: row.schoolYearName,
    termName: row.termName,
    lines,
    scheduleSubjects,
  };
}

export async function getFeeSetupsPendingProgramHead(programCodes: string[] | null) {
  const rows = await db
    .select({
      id: feeSetups.id,
      programId: feeSetups.programId,
      yearLevel: feeSetups.yearLevel,
      schoolYearId: feeSetups.schoolYearId,
      termId: feeSetups.termId,
      tuitionPerUnit: feeSetups.tuitionPerUnit,
      programCode: programs.code,
      programName: programs.name,
      schoolYearName: schoolYears.name,
      termName: terms.name,
    })
    .from(feeSetups)
    .innerJoin(
      feeSetupApprovals,
      eq(feeSetups.id, feeSetupApprovals.feeSetupId)
    )
    .leftJoin(programs, eq(feeSetups.programId, programs.id))
    .leftJoin(schoolYears, eq(feeSetups.schoolYearId, schoolYears.id))
    .leftJoin(terms, eq(feeSetups.termId, terms.id))
    .where(
      and(
        eq(feeSetups.status, "pending_program_head"),
        eq(feeSetupApprovals.programHeadStatus, "pending")
      )
    )
    .orderBy(desc(feeSetups.updatedAt));

  if (programCodes === null) return rows;
  return rows.filter(
    (r) => r.programCode && programCodes.includes(r.programCode)
  );
}

export async function getFeeSetupsPendingDean() {
  return db
    .select({
      id: feeSetups.id,
      programId: feeSetups.programId,
      yearLevel: feeSetups.yearLevel,
      schoolYearId: feeSetups.schoolYearId,
      termId: feeSetups.termId,
      tuitionPerUnit: feeSetups.tuitionPerUnit,
      programCode: programs.code,
      programName: programs.name,
      schoolYearName: schoolYears.name,
      termName: terms.name,
    })
    .from(feeSetups)
    .innerJoin(
      feeSetupApprovals,
      eq(feeSetups.id, feeSetupApprovals.feeSetupId)
    )
    .leftJoin(programs, eq(feeSetups.programId, programs.id))
    .leftJoin(schoolYears, eq(feeSetups.schoolYearId, schoolYears.id))
    .leftJoin(terms, eq(feeSetups.termId, terms.id))
    .where(
      and(
        eq(feeSetups.status, "pending_dean"),
        eq(feeSetupApprovals.deanStatus, "pending")
      )
    )
    .orderBy(desc(feeSetups.updatedAt));
}

// ============ Teacher Subject Permissions ============

export async function listTeacherSubjectPermissions(teacherUserProfileId: string) {
  return db.select({
    id: teacherSubjectPermissions.id,
    subjectId: teacherSubjectPermissions.subjectId,
    subjectCode: subjects.code,
    subjectTitle: subjects.title,
    units: subjects.units,
    programId: subjects.programId,
    isGe: subjects.isGe,
    canTeach: teacherSubjectPermissions.canTeach,
    notes: teacherSubjectPermissions.notes,
  })
  .from(teacherSubjectPermissions)
  .innerJoin(subjects, eq(teacherSubjectPermissions.subjectId, subjects.id))
  .where(eq(teacherSubjectPermissions.teacherUserProfileId, teacherUserProfileId))
  .orderBy(subjects.code);
}

export async function addTeacherSubjectPermissions(values: {
  teacherUserProfileId: string;
  subjectIds: string[];
  notes?: string | null;
  createdByUserId: string;
}) {
  const rows = values.subjectIds.map((subjectId) => ({
    teacherUserProfileId: values.teacherUserProfileId,
    subjectId,
    notes: values.notes,
    createdByUserId: values.createdByUserId,
    canTeach: true,
  }));
  return db.insert(teacherSubjectPermissions).values(rows).onConflictDoNothing();
}

export async function removeTeacherSubjectPermission(teacherUserProfileId: string, subjectId: string) {
  return db.delete(teacherSubjectPermissions)
    .where(and(
      eq(teacherSubjectPermissions.teacherUserProfileId, teacherUserProfileId),
      eq(teacherSubjectPermissions.subjectId, subjectId)
    ));
}

export async function updateTeacherSubjectPermission(teacherUserProfileId: string, subjectId: string, updates: {
  notes?: string;
  canTeach?: boolean;
}) {
  return db.update(teacherSubjectPermissions)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(
      eq(teacherSubjectPermissions.teacherUserProfileId, teacherUserProfileId),
      eq(teacherSubjectPermissions.subjectId, subjectId)
    ));
}

export async function validateTeacherCanTeach(teacherUserProfileId: string, subjectId: string): Promise<boolean> {
  const [perm] = await db.select()
    .from(teacherSubjectPermissions)
    .where(and(
      eq(teacherSubjectPermissions.teacherUserProfileId, teacherUserProfileId),
      eq(teacherSubjectPermissions.subjectId, subjectId),
      eq(teacherSubjectPermissions.canTeach, true)
    ))
    .limit(1);
  return !!perm;
}

export async function listAuthorizedTeachersForSubject(subjectId: string) {
  return db.select({
    teacherId: userProfile.id,
    teacherName: sql<string>`COALESCE(${userProfile.fullName}, '')`,
    email: userProfile.email,
    position: userProfile.position,
    permissionId: teacherSubjectPermissions.id,
  })
  .from(teacherSubjectPermissions)
  .innerJoin(userProfile, eq(teacherSubjectPermissions.teacherUserProfileId, userProfile.id))
  .where(and(
    eq(teacherSubjectPermissions.subjectId, subjectId),
    eq(teacherSubjectPermissions.canTeach, true),
    eq(userProfile.active, true),
    eq(userProfile.role, "teacher")
  ))
  .orderBy(userProfile.fullName);
}

/** Teachers = user_profile where role='teacher' and active=true */
export async function listTeachersFromUserProfile() {
  return db.select({
    id: userProfile.id,
    firstName: sql<string>`COALESCE(SPLIT_PART(COALESCE(${userProfile.fullName},''), ' ', 1), '')`,
    lastName: sql<string>`COALESCE(NULLIF(TRIM(SUBSTRING(COALESCE(${userProfile.fullName},'') FROM POSITION(' ' IN COALESCE(${userProfile.fullName},'')||' ')+1)), ''), '')`,
    fullName: userProfile.fullName,
    email: userProfile.email,
    position: userProfile.position,
    active: userProfile.active,
    departmentProgramId: userProfile.departmentProgramId,
    employeeNo: userProfile.employeeNo,
  })
  .from(userProfile)
  .where(and(eq(userProfile.role, "teacher"), eq(userProfile.active, true)))
  .orderBy(userProfile.fullName);
}

export async function getTeachersListForRegistrar() {
  return db.select({
    id: userProfile.id,
    firstName: sql<string>`COALESCE(SPLIT_PART(COALESCE(${userProfile.fullName},''), ' ', 1), '')`,
    lastName: sql<string>`COALESCE(NULLIF(TRIM(SUBSTRING(COALESCE(${userProfile.fullName},'') FROM POSITION(' ' IN COALESCE(${userProfile.fullName},'')||' ')+1)), ''), '')`,
    email: userProfile.email,
    position: userProfile.position,
    active: userProfile.active,
    permissionCount: sql<number>`count(${teacherSubjectPermissions.id})::int`,
  })
  .from(userProfile)
  .leftJoin(teacherSubjectPermissions, eq(userProfile.id, teacherSubjectPermissions.teacherUserProfileId))
  .where(and(eq(userProfile.role, "teacher"), eq(userProfile.active, true)))
  .groupBy(userProfile.id)
  .orderBy(userProfile.fullName);
}

// ============ Schedule Approvals ============

export async function createScheduleApproval(values: {
  scheduleId: string;
  schoolYearId: string;
  termId: string;
  submittedByUserId: string;
  hasTeacherOverride: boolean;
  overrideReason?: string | null;
}) {
  return db.insert(scheduleApprovals).values({
    ...values,
    submittedAt: new Date(),
    status: "pending",
  }).returning();
}

export async function listPendingScheduleApprovalsForDean(schoolYearId?: string, termId?: string) {
  const conditions = [eq(scheduleApprovals.status, "pending")];
  if (schoolYearId) conditions.push(eq(scheduleApprovals.schoolYearId, schoolYearId));
  if (termId) conditions.push(eq(scheduleApprovals.termId, termId));
  
  return db.select({
    approvalId: scheduleApprovals.id,
    scheduleId: classSchedules.id,
    subjectCode: subjects.code,
    subjectTitle: subjects.title,
    sectionName: sections.name,
    teacherName: sql<string>`COALESCE(${userProfile.fullName}, '')`,
    timeIn: classSchedules.timeIn,
    timeOut: classSchedules.timeOut,
    room: classSchedules.room,
    hasTeacherOverride: scheduleApprovals.hasTeacherOverride,
    overrideReason: scheduleApprovals.overrideReason,
    submittedAt: scheduleApprovals.submittedAt,
  })
  .from(scheduleApprovals)
  .innerJoin(classSchedules, eq(scheduleApprovals.scheduleId, classSchedules.id))
  .innerJoin(subjects, eq(classSchedules.subjectId, subjects.id))
  .innerJoin(sections, eq(classSchedules.sectionId, sections.id))
  .leftJoin(userProfile, eq(classSchedules.teacherUserProfileId, userProfile.id))
  .where(and(...conditions))
  .orderBy(scheduleApprovals.submittedAt);
}

export async function getScheduleApprovalDetails(approvalId: string) {
  const [row] = await db.select({
    approvalId: scheduleApprovals.id,
    scheduleId: classSchedules.id,
    subjectCode: subjects.code,
    subjectTitle: subjects.title,
    sectionName: sections.name,
    teacherId: userProfile.id,
    teacherName: sql<string>`COALESCE(${userProfile.fullName}, '')`,
    timeIn: classSchedules.timeIn,
    timeOut: classSchedules.timeOut,
    room: classSchedules.room,
    hasTeacherOverride: scheduleApprovals.hasTeacherOverride,
    overrideReason: scheduleApprovals.overrideReason,
    status: scheduleApprovals.status,
    deanRemarks: scheduleApprovals.deanRemarks,
    submittedAt: scheduleApprovals.submittedAt,
  })
  .from(scheduleApprovals)
  .innerJoin(classSchedules, eq(scheduleApprovals.scheduleId, classSchedules.id))
  .innerJoin(subjects, eq(classSchedules.subjectId, subjects.id))
  .innerJoin(sections, eq(classSchedules.sectionId, sections.id))
  .leftJoin(userProfile, eq(classSchedules.teacherUserProfileId, userProfile.id))
  .where(eq(scheduleApprovals.id, approvalId))
  .limit(1);
  
  if (!row) return null;
  
  // Get days for the schedule
  const days = await db.select({ day: scheduleDays.day })
    .from(scheduleDays)
    .where(eq(scheduleDays.scheduleId, row.scheduleId));
  
  return { ...row, days: days.map(d => d.day) };
}

export async function approveSchedule(approvalId: string, deanUserId: string, remarks?: string) {
  await db.update(scheduleApprovals)
    .set({
      status: "approved",
      deanUserId,
      deanRemarks: remarks,
      reviewedAt: new Date(),
    })
    .where(eq(scheduleApprovals.id, approvalId));
    
  const [approval] = await db.select({ scheduleId: scheduleApprovals.scheduleId })
    .from(scheduleApprovals)
    .where(eq(scheduleApprovals.id, approvalId))
    .limit(1);
    
  if (approval) {
    await db.update(classSchedules)
      .set({ status: "approved" })
      .where(eq(classSchedules.id, approval.scheduleId));
  }
}

export async function rejectSchedule(approvalId: string, deanUserId: string, remarks: string) {
  await db.update(scheduleApprovals)
    .set({
      status: "rejected",
      deanUserId,
      deanRemarks: remarks,
      reviewedAt: new Date(),
    })
    .where(eq(scheduleApprovals.id, approvalId));
    
  const [approval] = await db.select({ scheduleId: scheduleApprovals.scheduleId })
    .from(scheduleApprovals)
    .where(eq(scheduleApprovals.id, approvalId))
    .limit(1);
    
  if (approval) {
    await db.update(classSchedules)
      .set({ status: "rejected" })
      .where(eq(classSchedules.id, approval.scheduleId));
  }
}

// ============ Teacher Capabilities ============

export async function updateTeacherDepartment(teacherUserProfileId: string, departmentProgramId: string | null) {
  await db
    .update(userProfile)
    .set({ departmentProgramId, updatedAt: new Date() })
    .where(eq(userProfile.id, teacherUserProfileId));
}

export async function hasActiveCapability(teacherUserProfileId: string, subjectId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: teacherSubjectCapabilities.id })
    .from(teacherSubjectCapabilities)
    .where(
      and(
        eq(teacherSubjectCapabilities.teacherUserProfileId, teacherUserProfileId),
        eq(teacherSubjectCapabilities.subjectId, subjectId),
        eq(teacherSubjectCapabilities.status, "active")
      )
    )
    .limit(1);
  return !!row;
}

export async function listTeachersWithActiveCapabilityForSubject(subjectId: string) {
  return db
    .select({
      teacherId: userProfile.id,
      teacherName: sql<string>`COALESCE(${userProfile.fullName}, '')`,
      email: userProfile.email,
      departmentProgramId: userProfile.departmentProgramId,
    })
    .from(teacherSubjectCapabilities)
    .innerJoin(userProfile, eq(teacherSubjectCapabilities.teacherUserProfileId, userProfile.id))
    .where(
      and(
        eq(teacherSubjectCapabilities.subjectId, subjectId),
        eq(teacherSubjectCapabilities.status, "active"),
        eq(userProfile.active, true),
        eq(userProfile.role, "teacher")
      )
    )
    .orderBy(userProfile.fullName);
}

export async function listTeachersInDepartment(departmentProgramId: string) {
  return db
    .select({
      id: userProfile.id,
      firstName: sql<string>`COALESCE(SPLIT_PART(COALESCE(${userProfile.fullName},''), ' ', 1), '')`,
      lastName: sql<string>`COALESCE(NULLIF(TRIM(SUBSTRING(COALESCE(${userProfile.fullName},'') FROM POSITION(' ' IN COALESCE(${userProfile.fullName},'')||' ')+1)), ''), '')`,
      email: userProfile.email,
      departmentProgramId: userProfile.departmentProgramId,
    })
    .from(userProfile)
    .where(and(eq(userProfile.role, "teacher"), eq(userProfile.active, true), eq(userProfile.departmentProgramId, departmentProgramId)))
    .orderBy(userProfile.fullName);
}

/** Teachers = user_profile where role='teacher' and active=true */
export async function listTeachersWithDepartmentAndCapabilityCount(search?: string) {
  const base = db
    .select({
      id: userProfile.id,
      firstName: sql<string>`COALESCE(SPLIT_PART(COALESCE(${userProfile.fullName},''), ' ', 1), '')`,
      lastName: sql<string>`COALESCE(NULLIF(TRIM(SUBSTRING(COALESCE(${userProfile.fullName},'') FROM POSITION(' ' IN COALESCE(${userProfile.fullName},'')||' ')+1)), ''), '')`,
      email: userProfile.email,
      position: userProfile.position,
      active: userProfile.active,
      departmentProgramId: userProfile.departmentProgramId,
      departmentCode: programs.code,
      departmentName: programs.name,
      activeCapabilityCount: sql<number>`count(
        case when ${teacherSubjectCapabilities.status} = 'active' then 1 end
      )::int`,
    })
    .from(userProfile)
    .leftJoin(programs, eq(userProfile.departmentProgramId, programs.id))
    .leftJoin(teacherSubjectCapabilities, eq(userProfile.id, teacherSubjectCapabilities.teacherUserProfileId))
    .where(and(eq(userProfile.role, "teacher"), eq(userProfile.active, true)))
    .groupBy(userProfile.id, programs.code, programs.name)
    .orderBy(userProfile.fullName);

  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    return db
      .select({
        id: userProfile.id,
        firstName: sql<string>`COALESCE(SPLIT_PART(COALESCE(${userProfile.fullName},''), ' ', 1), '')`,
        lastName: sql<string>`COALESCE(NULLIF(TRIM(SUBSTRING(COALESCE(${userProfile.fullName},'') FROM POSITION(' ' IN COALESCE(${userProfile.fullName},'')||' ')+1)), ''), '')`,
        email: userProfile.email,
        position: userProfile.position,
        active: userProfile.active,
        departmentProgramId: userProfile.departmentProgramId,
        departmentCode: programs.code,
        departmentName: programs.name,
        activeCapabilityCount: sql<number>`count(
          case when ${teacherSubjectCapabilities.status} = 'active' then 1 end
        )::int`,
      })
      .from(userProfile)
      .leftJoin(programs, eq(userProfile.departmentProgramId, programs.id))
      .leftJoin(teacherSubjectCapabilities, eq(userProfile.id, teacherSubjectCapabilities.teacherUserProfileId))
      .where(
        and(
          eq(userProfile.role, "teacher"),
          eq(userProfile.active, true),
          or(
            like(userProfile.fullName ?? "", term),
            like(userProfile.email ?? "", term)
          )
        )
      )
      .groupBy(userProfile.id, programs.code, programs.name)
      .orderBy(userProfile.fullName);
  }
  return base;
}

export async function listActiveCapabilitiesByTeacher(teacherId: string) {
  return db
    .select({
      id: teacherSubjectCapabilities.id,
      subjectId: subjects.id,
      subjectCode: subjects.code,
      subjectTitle: subjects.title,
      units: subjects.units,
      capabilityType: teacherSubjectCapabilities.capabilityType,
      status: teacherSubjectCapabilities.status,
      notes: teacherSubjectCapabilities.notes,
      subjectProgramId: subjects.programId,
      subjectIsGe: subjects.isGe,
    })
    .from(teacherSubjectCapabilities)
    .innerJoin(subjects, eq(teacherSubjectCapabilities.subjectId, subjects.id))
    .where(
      and(
        eq(teacherSubjectCapabilities.teacherUserProfileId, teacherId),
        eq(teacherSubjectCapabilities.status, "active")
      )
    )
    .orderBy(subjects.code);
}

// ============ Capability Packages ============

export async function listCapabilityPackages(filters: {
  programId: string;
  schoolYearId?: string | null;
  termId?: string | null;
}) {
  const conds = [eq(teacherCapabilityPackages.programId, filters.programId)];
  if (filters.schoolYearId) conds.push(eq(teacherCapabilityPackages.schoolYearId, filters.schoolYearId));
  if (filters.termId) conds.push(eq(teacherCapabilityPackages.termId, filters.termId));
  return db
    .select({
      id: teacherCapabilityPackages.id,
      programId: teacherCapabilityPackages.programId,
      schoolYearId: teacherCapabilityPackages.schoolYearId,
      termId: teacherCapabilityPackages.termId,
      title: teacherCapabilityPackages.title,
      status: teacherCapabilityPackages.status,
      createdByUserId: teacherCapabilityPackages.createdByUserId,
      submittedAt: teacherCapabilityPackages.submittedAt,
      reviewedByUserId: teacherCapabilityPackages.reviewedByUserId,
      reviewedAt: teacherCapabilityPackages.reviewedAt,
      deanRemarks: teacherCapabilityPackages.deanRemarks,
      programCode: programs.code,
      programName: programs.name,
      schoolYearName: schoolYears.name,
      termName: terms.name,
    })
    .from(teacherCapabilityPackages)
    .leftJoin(programs, eq(teacherCapabilityPackages.programId, programs.id))
    .leftJoin(schoolYears, eq(teacherCapabilityPackages.schoolYearId, schoolYears.id))
    .leftJoin(terms, eq(teacherCapabilityPackages.termId, terms.id))
    .where(and(...conds))
    .orderBy(desc(teacherCapabilityPackages.updatedAt));
}

export async function listCapabilityPackagesByStatus(status: "submitted" | "approved" | "rejected") {
  return db
    .select({
      id: teacherCapabilityPackages.id,
      programId: teacherCapabilityPackages.programId,
      title: teacherCapabilityPackages.title,
      status: teacherCapabilityPackages.status,
      createdByUserId: teacherCapabilityPackages.createdByUserId,
      submittedAt: teacherCapabilityPackages.submittedAt,
      programCode: programs.code,
      programName: programs.name,
      schoolYearName: schoolYears.name,
      termName: terms.name,
    })
    .from(teacherCapabilityPackages)
    .leftJoin(programs, eq(teacherCapabilityPackages.programId, programs.id))
    .leftJoin(schoolYears, eq(teacherCapabilityPackages.schoolYearId, schoolYears.id))
    .leftJoin(terms, eq(teacherCapabilityPackages.termId, terms.id))
    .where(eq(teacherCapabilityPackages.status, status))
    .orderBy(desc(teacherCapabilityPackages.submittedAt));
}

export async function getCapabilityPackageById(packageId: string) {
  const [row] = await db
    .select({
      id: teacherCapabilityPackages.id,
      programId: teacherCapabilityPackages.programId,
      schoolYearId: teacherCapabilityPackages.schoolYearId,
      termId: teacherCapabilityPackages.termId,
      title: teacherCapabilityPackages.title,
      status: teacherCapabilityPackages.status,
      createdByUserId: teacherCapabilityPackages.createdByUserId,
      submittedAt: teacherCapabilityPackages.submittedAt,
      reviewedByUserId: teacherCapabilityPackages.reviewedByUserId,
      reviewedAt: teacherCapabilityPackages.reviewedAt,
      deanRemarks: teacherCapabilityPackages.deanRemarks,
      programCode: programs.code,
      programName: programs.name,
      schoolYearName: schoolYears.name,
      termName: terms.name,
    })
    .from(teacherCapabilityPackages)
    .leftJoin(programs, eq(teacherCapabilityPackages.programId, programs.id))
    .leftJoin(schoolYears, eq(teacherCapabilityPackages.schoolYearId, schoolYears.id))
    .leftJoin(terms, eq(teacherCapabilityPackages.termId, terms.id))
    .where(eq(teacherCapabilityPackages.id, packageId))
    .limit(1);
  return row ?? null;
}

export async function createCapabilityPackage(values: {
  programId: string;
  schoolYearId?: string | null;
  termId?: string | null;
  title: string;
  createdByUserId: string;
}) {
  const [row] = await db
    .insert(teacherCapabilityPackages)
    .values({
      ...values,
      status: "draft",
    })
    .returning();
  return row;
}

export async function submitCapabilityPackage(packageId: string) {
  await db
    .update(teacherCapabilityPackages)
    .set({ status: "submitted", submittedAt: new Date(), updatedAt: new Date() })
    .where(eq(teacherCapabilityPackages.id, packageId));
}

export async function approveCapabilityPackageDb(packageId: string, deanUserId: string) {
  const lines = await db
    .select({ teacherId: teacherSubjectCapabilities.teacherUserProfileId, subjectId: teacherSubjectCapabilities.subjectId })
    .from(teacherSubjectCapabilities)
    .where(eq(teacherSubjectCapabilities.packageId, packageId));
  for (const line of lines) {
    await db
      .update(teacherSubjectCapabilities)
      .set({ status: "inactive", updatedAt: new Date() })
      .where(
        and(
          eq(teacherSubjectCapabilities.teacherUserProfileId, line.teacherId),
          eq(teacherSubjectCapabilities.subjectId, line.subjectId),
          eq(teacherSubjectCapabilities.status, "active"),
          ne(teacherSubjectCapabilities.packageId, packageId)
        )
      );
  }
  await db
    .update(teacherSubjectCapabilities)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(teacherSubjectCapabilities.packageId, packageId));
  await db
    .update(teacherCapabilityPackages)
    .set({
      status: "approved",
      reviewedByUserId: deanUserId,
      reviewedAt: new Date(),
      deanRemarks: null,
      updatedAt: new Date(),
    })
    .where(eq(teacherCapabilityPackages.id, packageId));
}

export async function rejectCapabilityPackageDb(packageId: string, deanUserId: string, remarks: string) {
  await db
    .update(teacherCapabilityPackages)
    .set({
      status: "rejected",
      reviewedByUserId: deanUserId,
      reviewedAt: new Date(),
      deanRemarks: remarks,
      updatedAt: new Date(),
    })
    .where(eq(teacherCapabilityPackages.id, packageId));
}

// ============ Capability Lines ============

export async function listCapabilityLines(packageId: string) {
  return db
    .select({
      id: teacherSubjectCapabilities.id,
      packageId: teacherSubjectCapabilities.packageId,
      teacherId: teacherSubjectCapabilities.teacherUserProfileId,
      subjectId: teacherSubjectCapabilities.subjectId,
      capabilityType: teacherSubjectCapabilities.capabilityType,
      status: teacherSubjectCapabilities.status,
      notes: teacherSubjectCapabilities.notes,
      teacherFirstName: sql<string>`COALESCE(SPLIT_PART(COALESCE(${userProfile.fullName},''), ' ', 1), '')`,
      teacherLastName: sql<string>`COALESCE(NULLIF(TRIM(SUBSTRING(COALESCE(${userProfile.fullName},'') FROM POSITION(' ' IN COALESCE(${userProfile.fullName},'')||' ')+1)), ''), '')`,
      teacherDepartmentProgramId: userProfile.departmentProgramId,
      subjectCode: subjects.code,
      subjectTitle: subjects.title,
      subjectProgramId: subjects.programId,
      subjectIsGe: subjects.isGe,
    })
    .from(teacherSubjectCapabilities)
    .innerJoin(userProfile, eq(teacherSubjectCapabilities.teacherUserProfileId, userProfile.id))
    .innerJoin(subjects, eq(teacherSubjectCapabilities.subjectId, subjects.id))
    .where(eq(teacherSubjectCapabilities.packageId, packageId))
    .orderBy(userProfile.fullName, subjects.code);
}

export async function addCapabilityLines(
  packageId: string,
  lines: { teacherId: string; subjectId: string; capabilityType: "major_department" | "ge" | "cross_department"; notes?: string | null }[]
) {
  if (lines.length === 0) return [];
  const rows = lines.map((l) => ({
    packageId,
    teacherUserProfileId: l.teacherId,
    subjectId: l.subjectId,
    capabilityType: l.capabilityType,
    status: "pending" as const,
    notes: l.notes ?? null,
  }));
  return db.insert(teacherSubjectCapabilities).values(rows).returning();
}

export async function removeCapabilityLine(lineId: string) {
  await db.delete(teacherSubjectCapabilities).where(eq(teacherSubjectCapabilities.id, lineId));
}

export async function updateCapabilityLineNotes(lineId: string, notes: string | null) {
  await db
    .update(teacherSubjectCapabilities)
    .set({ notes, updatedAt: new Date() })
    .where(eq(teacherSubjectCapabilities.id, lineId));
}

export type CapabilityIssue = {
  type: "duplicate" | "invalid_type";
  lineId?: string;
  teacherId: string;
  subjectId: string;
  message: string;
};

export async function detectCapabilityIssues(packageId: string): Promise<CapabilityIssue[]> {
  const lines = await listCapabilityLines(packageId);
  const issues: CapabilityIssue[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const key = `${line.teacherId}:${line.subjectId}`;
    if (seen.has(key)) {
      issues.push({
        type: "duplicate",
        lineId: line.id,
        teacherId: line.teacherId,
        subjectId: line.subjectId,
        message: `Duplicate: teacher already in package for subject ${line.subjectCode}.`,
      });
    }
    seen.add(key);

    const teacher = await getTeacherById(line.teacherId);
    const deptProgramId = teacher?.departmentProgramId ?? null;
    const isGe = line.subjectIsGe;
    const subjProgramId = line.subjectProgramId;
    const expectedType: "major_department" | "ge" | "cross_department" = isGe
      ? "ge"
      : deptProgramId && subjProgramId === deptProgramId
        ? "major_department"
        : "cross_department";
    if (line.capabilityType !== expectedType) {
      issues.push({
        type: "invalid_type",
        lineId: line.id,
        teacherId: line.teacherId,
        subjectId: line.subjectId,
        message: `Capability type should be ${expectedType} for teacher's department and subject.`,
      });
    }
  }
  return issues;
}

// Schedule Time Configurations
export async function createScheduleTimeConfig(values: {
  programId: string;
  title: string;
  startHour: number;
  endHour: number;
  timeIncrement: number;
  createdByUserId: string;
  schoolYearId?: string | null;
  termId?: string | null;
}) {
  const [config] = await db
    .insert(scheduleTimeConfigs)
    .values({
      ...values,
      status: "draft",
    })
    .returning();
  return config;
}

export async function listScheduleTimeConfigs(filters?: {
  programId?: string;
  status?: "draft" | "submitted" | "approved" | "rejected";
}) {
  let query = db
    .select({
      id: scheduleTimeConfigs.id,
      programId: scheduleTimeConfigs.programId,
      programCode: programs.code,
      programName: programs.name,
      title: scheduleTimeConfigs.title,
      startHour: scheduleTimeConfigs.startHour,
      endHour: scheduleTimeConfigs.endHour,
      timeIncrement: scheduleTimeConfigs.timeIncrement,
      status: scheduleTimeConfigs.status,
      createdAt: scheduleTimeConfigs.createdAt,
      submittedAt: scheduleTimeConfigs.submittedAt,
    })
    .from(scheduleTimeConfigs)
    .leftJoin(programs, eq(scheduleTimeConfigs.programId, programs.id))
    .orderBy(desc(scheduleTimeConfigs.createdAt));

  if (filters?.programId) {
    query = query.where(eq(scheduleTimeConfigs.programId, filters.programId)) as typeof query;
  }
  if (filters?.status) {
    query = query.where(eq(scheduleTimeConfigs.status, filters.status)) as typeof query;
  }

  return query;
}

export async function getApprovedTimeConfigForProgram(programId: string) {
  const [config] = await db
    .select()
    .from(scheduleTimeConfigs)
    .where(
      and(
        eq(scheduleTimeConfigs.programId, programId),
        eq(scheduleTimeConfigs.status, "approved")
      )
    )
    .orderBy(desc(scheduleTimeConfigs.createdAt))
    .limit(1);
  return config ?? null;
}

export async function submitScheduleTimeConfig(configId: string) {
  await db
    .update(scheduleTimeConfigs)
    .set({
      status: "submitted",
      submittedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(scheduleTimeConfigs.id, configId));
}

export async function approveScheduleTimeConfig(configId: string, deanUserId: string) {
  await db
    .update(scheduleTimeConfigs)
    .set({
      status: "approved",
      reviewedByUserId: deanUserId,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(scheduleTimeConfigs.id, configId));
}

export async function rejectScheduleTimeConfig(
  configId: string,
  deanUserId: string,
  remarks: string
) {
  await db
    .update(scheduleTimeConfigs)
    .set({
      status: "rejected",
      reviewedByUserId: deanUserId,
      reviewedAt: new Date(),
      remarks,
      updatedAt: new Date(),
    })
    .where(eq(scheduleTimeConfigs.id, configId));
}
