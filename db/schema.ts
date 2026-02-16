import {
  pgTable,
  pgView,
  uuid,
  text,
  timestamp,
  uniqueIndex,
  index,
  varchar,
  date,
  boolean,
  integer,
  numeric,
  jsonb,
} from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Identity / Auth
 */

export const roleEnum = pgEnum("role", [
  "student",
  "teacher",
  "registrar",
  "finance",
  "program_head",
  "dean",
  "admin",
]);

export type Role = (typeof roleEnum.enumValues)[number];

export const userProfile = pgTable(
  "user_profile",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /**
     * ID from Neon Auth / Better Auth
     */
    userId: text("user_id").notNull(),
    email: varchar("email", { length: 255 }),
    fullName: varchar("full_name", { length: 255 }),
    role: roleEnum("role").notNull(),
    /**
     * When true, treat user as verified (e.g. admin-created test accounts).
     * Only set for users created via admin panel.
     */
    emailVerificationBypassed: boolean("email_verification_bypassed").notNull().default(false),
    active: boolean("active").notNull().default(true),
    /** Program head scope: which program this user oversees (null = not set; use Settings to set or "ALL") */
    program: varchar("program", { length: 64 }),
    department: varchar("department", { length: 64 }),
    /** Teacher-specific (when role = teacher) */
    employeeNo: varchar("employee_no", { length: 32 }),
    position: varchar("position", { length: 128 }),
    departmentProgramId: uuid("department_program_id").references(() => programs.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userIdUnique: uniqueIndex("user_profile_user_id_unique").on(table.userId),
    emailUnique: uniqueIndex("user_profile_email_unique").on(table.email),
  })
);

export type UserProfile = typeof userProfile.$inferSelect;
export type NewUserProfile = typeof userProfile.$inferInsert;

/** Optional: multi-role grants (for future use) */
export const userRoleGrants = pgTable(
  "user_role_grants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    role: roleEnum("role").notNull(),
    grantedByUserId: text("granted_by_user_id"),
    grantedAt: timestamp("granted_at", { withTimezone: true }).defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    index("user_role_grants_user_id_idx").on(table.userId),
    index("user_role_grants_role_idx").on(table.role),
  ]
);

export const programs = pgTable(
  "programs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    codeUnique: uniqueIndex("programs_code_unique").on(table.code),
  })
);

export const programHeadAssignments = pgTable(
  "program_head_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    programCode: varchar("program_code", { length: 64 }).notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userProgramUnique: uniqueIndex("program_head_assignments_user_program_unique").on(
      table.userId,
      table.programCode
    ),
  })
);

export const systemSettings = pgTable("system_settings", {
  key: varchar("key", { length: 128 }).primaryKey(),
  value: jsonb("value"),
  updatedByUserId: text("updated_by_user_id"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorUserId: text("actor_user_id"),
  action: varchar("action", { length: 64 }).notNull(),
  entityType: varchar("entity_type", { length: 64 }).notNull(),
  entityId: text("entity_id"),
  before: jsonb("before"),
  after: jsonb("after"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/**
 * Academic calendar / setup
 */

export const schoolYears = pgTable("school_years", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 32 }).notNull(), // e.g. 2025-2026
  startDate: date("start_date"),
  endDate: date("end_date"),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const termStatusEnum = pgEnum("term_status", ["draft", "enrollment", "classes", "closed"]);

export const terms = pgTable("terms", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolYearId: uuid("school_year_id")
    .notNull()
    .references(() => schoolYears.id),
  name: varchar("name", { length: 32 }).notNull(), // e.g. 1st Sem
  status: termStatusEnum("status").notNull().default("draft"),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/**
 * People
 */

export const students = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  userProfileId: uuid("user_profile_id").references(() => userProfile.id),
  studentCode: varchar("student_code", { length: 32 }), // student_no
  firstName: varchar("first_name", { length: 128 }).notNull(),
  middleName: varchar("middle_name", { length: 128 }),
  lastName: varchar("last_name", { length: 128 }).notNull(),
  email: varchar("email", { length: 255 }),
  contactNo: varchar("contact_no", { length: 32 }),
  birthday: date("birthday"),
  program: varchar("program", { length: 64 }), // e.g. BSIT
  yearLevel: varchar("year_level", { length: 32 }),
  lastSchoolId: varchar("last_school_id", { length: 64 }),
  lastSchoolYearCompleted: varchar("last_school_year_completed", {
    length: 32,
  }),
  guardianName: varchar("guardian_name", { length: 255 }),
  guardianRelationship: varchar("guardian_relationship", { length: 64 }),
  guardianMobile: varchar("guardian_mobile", { length: 32 }),
  photoUrl: varchar("photo_url", { length: 512 }),
  studentType: varchar("student_type", { length: 32 }), // New / Transferee / Returnee
  profileCompletedAt: timestamp("profile_completed_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const teacherAssignments = pgTable(
  "teacher_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teacherUserProfileId: uuid("teacher_user_profile_id")
      .notNull()
      .references(() => userProfile.id),
    scheduleId: uuid("schedule_id")
      .notNull()
      .references(() => classSchedules.id),
    schoolYearId: uuid("school_year_id")
      .notNull()
      .references(() => schoolYears.id),
    termId: uuid("term_id")
      .notNull()
      .references(() => terms.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    teacherScheduleUnique: uniqueIndex("teacher_assignments_teacher_schedule_unique").on(
      table.teacherUserProfileId,
      table.scheduleId
    ),
  })
);

export const capabilityPackageStatusEnum = pgEnum("capability_package_status", [
  "draft",
  "submitted",
  "approved",
  "rejected",
  "archived",
]);

export const capabilityTypeEnum = pgEnum("capability_type", [
  "major_department",
  "ge",
  "cross_department",
]);

export const capabilityLineStatusEnum = pgEnum("capability_line_status", [
  "pending",
  "active",
  "inactive",
]);

export const teacherSubjectPermissions = pgTable(
  "teacher_subject_permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teacherUserProfileId: uuid("teacher_user_profile_id")
      .notNull()
      .references(() => userProfile.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    canTeach: boolean("can_teach").notNull().default(true),
    notes: text("notes"),
    createdByUserId: text("created_by_user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    teacherSubjectUnique: uniqueIndex("teacher_subject_permissions_teacher_subject_unique").on(
      table.teacherUserProfileId,
      table.subjectId
    ),
  })
);

export const gradingPeriods = pgTable(
  "grading_periods",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolYearId: uuid("school_year_id")
      .notNull()
      .references(() => schoolYears.id),
    termId: uuid("term_id")
      .notNull()
      .references(() => terms.id),
    name: varchar("name", { length: 64 }).notNull(), // Prelim, Midterm, Final
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    syTermNameUnique: uniqueIndex("grading_periods_sy_term_name_unique").on(
      table.schoolYearId,
      table.termId,
      table.name
    ),
  })
);

export const gradeSubmissionStatusEnum = pgEnum("grade_submission_status", [
  "draft",
  "submitted",
  "returned",
  "approved",
  "released",
]);

export const gradeSubmissions = pgTable(
  "grade_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    scheduleId: uuid("schedule_id")
      .notNull()
      .references(() => classSchedules.id),
    schoolYearId: uuid("school_year_id")
      .notNull()
      .references(() => schoolYears.id),
    termId: uuid("term_id")
      .notNull()
      .references(() => terms.id),
    gradingPeriodId: uuid("grading_period_id")
      .notNull()
      .references(() => gradingPeriods.id),
    teacherUserProfileId: uuid("teacher_user_profile_id")
      .notNull()
      .references(() => userProfile.id),
    status: gradeSubmissionStatusEnum("status").notNull().default("draft"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    registrarReviewedByUserId: text("registrar_reviewed_by_user_id"),
    registrarReviewedAt: timestamp("registrar_reviewed_at", { withTimezone: true }),
    registrarRemarks: text("registrar_remarks"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    releasedAt: timestamp("released_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    schedulePeriodUnique: uniqueIndex("grade_submissions_schedule_period_unique").on(
      table.scheduleId,
      table.gradingPeriodId
    ),
  })
);

export const gradeEntries = pgTable(
  "grade_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => gradeSubmissions.id),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => enrollments.id),
    numericGrade: numeric("numeric_grade", { precision: 5, scale: 2 }),
    letterGrade: varchar("letter_grade", { length: 16 }),
    remarks: text("remarks"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    submissionStudentUnique: uniqueIndex("grade_entries_submission_student_unique").on(
      table.submissionId,
      table.studentId
    ),
  })
);

/**
 * Curriculum & classes
 */

export const subjects = pgTable(
  "subjects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull(),
    title: text("title").notNull().default(""),
    description: varchar("description", { length: 255 }),
    units: numeric("units", { precision: 4, scale: 1 }).default("0"),
    programId: uuid("program_id").references(() => programs.id),
    isGe: boolean("is_ge").notNull().default(false),
    scopeCode: text("scope_code"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    scopeCodeUnique: uniqueIndex("subjects_scope_code_unique").on(table.scopeCode),
  })
);

export const teacherCapabilityPackages = pgTable(
  "teacher_capability_packages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    programId: uuid("program_id")
      .notNull()
      .references(() => programs.id),
    schoolYearId: uuid("school_year_id").references(() => schoolYears.id),
    termId: uuid("term_id").references(() => terms.id),
    title: text("title").notNull(),
    status: capabilityPackageStatusEnum("status").notNull().default("draft"),
    createdByUserId: text("created_by_user_id").notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    reviewedByUserId: text("reviewed_by_user_id"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    deanRemarks: text("dean_remarks"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }
);

export const teacherSubjectCapabilities = pgTable(
  "teacher_subject_capabilities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    packageId: uuid("package_id")
      .notNull()
      .references(() => teacherCapabilityPackages.id, { onDelete: "cascade" }),
    teacherUserProfileId: uuid("teacher_user_profile_id")
      .notNull()
      .references(() => userProfile.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    capabilityType: capabilityTypeEnum("capability_type").notNull(),
    status: capabilityLineStatusEnum("status").notNull().default("pending"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("teacher_subject_capabilities_teacher_subject_idx").on(
      table.teacherUserProfileId,
      table.subjectId
    ),
    index("teacher_subject_capabilities_status_idx").on(table.status),
  ]
);

export const sections = pgTable(
  "sections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    programId: uuid("program_id").references(() => programs.id),
    name: varchar("name", { length: 64 }).notNull(),
    gradeLevel: varchar("grade_level", { length: 32 }),
    yearLevel: varchar("year_level", { length: 32 }),
    /** Legacy/denormalized; prefer programId. Kept so db:push does not drop existing data. */
    program: varchar("program", { length: 64 }),
    status: varchar("status", { length: 32 }),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    programYearNameUnique: uniqueIndex("sections_program_year_name_unique").on(
      table.programId,
      table.yearLevel,
      table.name
    ),
  })
);

/**
 * Adviser assignments: per program, year level, and block (section).
 * One adviser per section per school year.
 */
export const adviserAssignments = pgTable(
  "adviser_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sectionId: uuid("section_id")
      .notNull()
      .references(() => sections.id, { onDelete: "cascade" }),
    schoolYearId: uuid("school_year_id")
      .notNull()
      .references(() => schoolYears.id, { onDelete: "cascade" }),
    teacherUserProfileId: uuid("teacher_user_profile_id")
      .notNull()
      .references(() => userProfile.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    sectionYearUnique: uniqueIndex("adviser_assignments_section_year_unique").on(
      table.sectionId,
      table.schoolYearId
    ),
  })
);

export const classSchedules = pgTable("class_schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolYearId: uuid("school_year_id")
    .notNull()
    .references(() => schoolYears.id),
  termId: uuid("term_id")
    .notNull()
    .references(() => terms.id),
  sectionId: uuid("section_id")
    .notNull()
    .references(() => sections.id),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id),
  teacherUserProfileId: uuid("teacher_user_profile_id").references(() => userProfile.id),
  teacherName: varchar("teacher_name", { length: 128 }),
  timeIn: varchar("time_in", { length: 16 }), // e.g. 08:00
  timeOut: varchar("time_out", { length: 16 }),
  room: varchar("room", { length: 64 }),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const scheduleDays = pgTable("schedule_days", {
  id: uuid("id").primaryKey().defaultRandom(),
  scheduleId: uuid("schedule_id")
    .notNull()
    .references(() => classSchedules.id),
  day: varchar("day", { length: 16 }).notNull(), // Mon, Tue, etc.
  isActive: boolean("is_active").notNull().default(true),
});

export const scheduleApprovals = pgTable("schedule_approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  scheduleId: uuid("schedule_id")
    .notNull()
    .references(() => classSchedules.id, { onDelete: "cascade" }),
  schoolYearId: uuid("school_year_id")
    .notNull()
    .references(() => schoolYears.id),
  termId: uuid("term_id")
    .notNull()
    .references(() => terms.id),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  submittedByUserId: text("submitted_by_user_id").notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull(),
  deanUserId: text("dean_user_id"),
  deanRemarks: text("dean_remarks"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  hasTeacherOverride: boolean("has_teacher_override").notNull().default(false),
  overrideReason: text("override_reason"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/**
 * Class offerings – per scheduled class/section/term instance students enroll into.
 */
export const classOfferings = pgTable(
  "class_offerings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    scheduleId: uuid("schedule_id")
      .notNull()
      .references(() => classSchedules.id),
    schoolYearId: uuid("school_year_id")
      .notNull()
      .references(() => schoolYears.id),
    termId: uuid("term_id")
      .notNull()
      .references(() => terms.id),
    sectionId: uuid("section_id")
      .notNull()
      .references(() => sections.id),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id),
    teacherUserProfileId: uuid("teacher_user_profile_id").references(() => userProfile.id),
    teacherName: varchar("teacher_name", { length: 128 }),
    room: varchar("room", { length: 64 }),
    timeStart: varchar("time_start", { length: 16 }),
    timeEnd: varchar("time_end", { length: 16 }),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    scheduleSyTermUnique: uniqueIndex("class_offerings_schedule_sy_term_unique").on(
      table.scheduleId,
      table.schoolYearId,
      table.termId
    ),
  })
);

export const studentClassEnrollmentStatusEnum = pgEnum(
  "student_class_enrollment_status",
  ["enrolled", "dropped", "completed"]
);

/**
 * Student -> class offering join (class enrollment).
 */
export const studentClassEnrollments = pgTable(
  "student_class_enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => enrollments.id),
    classOfferingId: uuid("class_offering_id")
      .notNull()
      .references(() => classOfferings.id),
    status: studentClassEnrollmentStatusEnum("status").notNull().default("enrolled"),
    enrolledAt: timestamp("enrolled_at", { withTimezone: true }).defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    studentEnrollmentOfferingUnique: uniqueIndex(
      "student_class_enrollments_student_enrollment_offering_unique"
    ).on(table.studentId, table.enrollmentId, table.classOfferingId),
  })
);

export const enrollmentSubjectSourceEnum = pgEnum("enrollment_subject_source", [
  "curriculum",
  "schedule",
  "manual",
]);

/**
 * Snapshot of subjects enrolled (for printing / when schedule not yet ready).
 */
export const enrollmentSubjects = pgTable(
  "enrollment_subjects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => enrollments.id),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id),
    source: enrollmentSubjectSourceEnum("source").notNull().default("curriculum"),
    units: integer("units").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    enrollmentSubjectUnique: uniqueIndex("enrollment_subjects_enrollment_subject_unique").on(
      table.enrollmentId,
      table.subjectId
    ),
  })
);

/**
 * Curriculum (program/year/term subject plans, versioned per school year)
 */
export const curriculumVersionStatusEnum = pgEnum("curriculum_version_status", [
  "draft",
  "published",
  "archived",
]);

export const curriculumVersions = pgTable(
  "curriculum_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    programId: uuid("program_id")
      .notNull()
      .references(() => programs.id),
    schoolYearId: uuid("school_year_id")
      .notNull()
      .references(() => schoolYears.id),
    name: text("name").notNull(),
    status: curriculumVersionStatusEnum("status").notNull().default("draft"),
    createdByUserId: text("created_by_user_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => []
);

export const curriculumBlocks = pgTable(
  "curriculum_blocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    curriculumVersionId: uuid("curriculum_version_id")
      .notNull()
      .references(() => curriculumVersions.id, { onDelete: "cascade" }),
    yearLevel: text("year_level").notNull(),
    termId: uuid("term_id")
      .notNull()
      .references(() => terms.id),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => ({
    versionYearTermUnique: uniqueIndex("curriculum_blocks_version_year_term_unique").on(
      table.curriculumVersionId,
      table.yearLevel,
      table.termId
    ),
  })
);

export const curriculumBlockSubjects = pgTable(
  "curriculum_block_subjects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    curriculumBlockId: uuid("curriculum_block_id")
      .notNull()
      .references(() => curriculumBlocks.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id),
    isRequired: boolean("is_required").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    prereqText: text("prereq_text"),
    withLab: boolean("with_lab").notNull().default(false),
  },
  (table) => ({
    blockSubjectUnique: uniqueIndex("curriculum_block_subjects_block_subject_unique").on(
      table.curriculumBlockId,
      table.subjectId
    ),
  })
);

/**
 * Enrollment
 */

export const enrollmentStatusEnum = pgEnum("enrollment_status", [
  "preregistered",
  "pending_approval",
  "pending",
  "approved",
  "rejected",
  "enrolled",
  "cancelled",
]);

export const enrollments = pgTable(
  "enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id),
    schoolYearId: uuid("school_year_id")
      .notNull()
      .references(() => schoolYears.id),
    termId: uuid("term_id")
      .notNull()
      .references(() => terms.id),
    programId: uuid("program_id").references(() => programs.id),
    course: varchar("course", { length: 64 }),
    program: varchar("program", { length: 64 }),
    yearLevel: varchar("year_level", { length: 32 }),
    sectionId: uuid("section_id").references(() => sections.id),
    status: enrollmentStatusEnum("status").notNull().default("pending_approval"),
    dateEnrolled: timestamp("date_enrolled", { withTimezone: true }).defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    studentSyTermUnique: uniqueIndex("enrollments_student_sy_term_unique").on(
      table.studentId,
      table.schoolYearId,
      table.termId
    ),
  })
);

export const enrollmentApprovalStatusEnum = pgEnum("enrollment_approval_status", [
  "pending",
  "approved",
  "rejected",
]);

export const enrollmentApprovals = pgTable("enrollment_approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  enrollmentId: uuid("enrollment_id")
    .notNull()
    .references(() => enrollments.id),
  status: enrollmentApprovalStatusEnum("status").notNull().default("pending"),
  actionBy: uuid("action_by").references(() => userProfile.id),
  reviewedByUserId: text("reviewed_by_user_id"),
  actionDate: timestamp("action_date", { withTimezone: true }).defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  remarks: text("remarks"),
}, (table) => ({
  enrollmentIdUnique: uniqueIndex("enrollment_approvals_enrollment_id_unique").on(table.enrollmentId),
}));

/**
 * Finance
 */

export const feeCategoryEnum = pgEnum("fee_category", ["tuition", "lab", "misc", "other"]);

export const feeItems = pgTable(
  "fee_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 32 }).notNull(),
    name: varchar("name", { length: 128 }).notNull(),
    category: feeCategoryEnum("category").notNull(),
    defaultAmount: numeric("default_amount", { precision: 12, scale: 2 }),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    codeUnique: uniqueIndex("fee_items_code_unique").on(table.code),
  })
);

export const programFeeRules = pgTable(
  "program_fee_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    programId: uuid("program_id").references(() => programs.id),
    program: varchar("program", { length: 64 }),
    yearLevel: varchar("year_level", { length: 32 }),
    schoolYearId: uuid("school_year_id").references(() => schoolYears.id),
    termId: uuid("term_id").references(() => terms.id),
    feeItemId: uuid("fee_item_id")
      .notNull()
      .references(() => feeItems.id),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    programYearFeeUnique: uniqueIndex(
      "program_fee_rules_program_year_fee_unique"
    ).on(
      table.programId,
      table.yearLevel,
      table.schoolYearId,
      table.termId,
      table.feeItemId
    ),
  })
);

export const feeSetupStatusEnum = pgEnum("fee_setup_status", [
  "draft",
  "pending_program_head",
  "pending_dean",
  "approved",
  "rejected",
  "archived",
]);

export const feeSetupLineTypeEnum = pgEnum("fee_setup_line_type", [
  "tuition_component",
  "lab_fee",
  "misc_fee",
  "other_fee",
]);

export const feeSetupApprovalStatusEnum = pgEnum("fee_setup_approval_status", [
  "pending",
  "approved",
  "rejected",
]);

export const feeSetups = pgTable("fee_setups", {
  id: uuid("id").primaryKey().defaultRandom(),
  programId: uuid("program_id").references(() => programs.id),
  yearLevel: varchar("year_level", { length: 32 }),
  schoolYearId: uuid("school_year_id").references(() => schoolYears.id),
  termId: uuid("term_id").references(() => terms.id),
  status: feeSetupStatusEnum("status").notNull().default("draft"),
  tuitionPerUnit: numeric("tuition_per_unit", { precision: 12, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  createdByUserId: text("created_by_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const feeSetupLines = pgTable("fee_setup_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  feeSetupId: uuid("fee_setup_id")
    .notNull()
    .references(() => feeSetups.id, { onDelete: "cascade" }),
  lineType: feeSetupLineTypeEnum("line_type").notNull(),
  label: text("label").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  qty: integer("qty").notNull().default(1),
  perUnit: boolean("per_unit").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const feeSetupApprovals = pgTable(
  "fee_setup_approvals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    feeSetupId: uuid("fee_setup_id")
      .notNull()
      .references(() => feeSetups.id, { onDelete: "cascade" }),
    programHeadStatus: feeSetupApprovalStatusEnum("program_head_status").notNull().default("pending"),
    programHeadByUserId: text("program_head_by_user_id"),
    programHeadAt: timestamp("program_head_at", { withTimezone: true }),
    programHeadRemarks: text("program_head_remarks"),
    deanStatus: feeSetupApprovalStatusEnum("dean_status").notNull().default("pending"),
    deanByUserId: text("dean_by_user_id"),
    deanAt: timestamp("dean_at", { withTimezone: true }),
    deanRemarks: text("dean_remarks"),
  },
  (table) => ({
    feeSetupIdUnique: uniqueIndex("fee_setup_approvals_fee_setup_id_unique").on(table.feeSetupId),
  })
);

export const assessmentStatusEnum = pgEnum("assessment_status", [
  "draft",
  "posted",
  "void",
]);

export const assessments = pgTable(
  "assessments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => enrollments.id),
    feeSetupId: uuid("fee_setup_id").references(() => feeSetups.id),
    assessedByUserId: text("assessed_by_user_id"),
    assessedAt: timestamp("assessed_at", { withTimezone: true }).defaultNow(),
    status: assessmentStatusEnum("status").notNull().default("draft"),
    totalUnits: integer("total_units"),
    tuitionRate: numeric("tuition_rate", { precision: 12, scale: 2 }),
    tuitionAmount: numeric("tuition_amount", { precision: 12, scale: 2 }),
    labTotal: numeric("lab_total", { precision: 12, scale: 2 }),
    miscTotal: numeric("misc_total", { precision: 12, scale: 2 }),
    otherTotal: numeric("other_total", { precision: 12, scale: 2 }),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
    discounts: numeric("discounts", { precision: 12, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 12, scale: 2 }).notNull().default("0"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    enrollmentIdUnique: uniqueIndex("assessments_enrollment_id_unique").on(
      table.enrollmentId
    ),
  })
);

export const assessmentLines = pgTable("assessment_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  assessmentId: uuid("assessment_id")
    .notNull()
    .references(() => assessments.id),
  feeItemId: uuid("fee_item_id").references(() => feeItems.id),
  sourceFeeSetupLineId: uuid("source_fee_setup_line_id").references(() => feeSetupLines.id),
  description: text("description").notNull(),
  category: feeCategoryEnum("category").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  qty: integer("qty").notNull().default(1),
  lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const ledgerEntryTypeEnum = pgEnum("ledger_entry_type", [
  "charge",
  "payment",
  "adjustment",
  "refund",
]);

export const ledgerReferenceTypeEnum = pgEnum("ledger_reference_type", [
  "assessment",
  "payment",
  "manual",
]);

export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => enrollments.id),
    entryType: ledgerEntryTypeEnum("entry_type").notNull(),
    referenceType: ledgerReferenceTypeEnum("reference_type").notNull(),
    referenceId: uuid("reference_id"),
    description: text("description").notNull(),
    debit: numeric("debit", { precision: 12, scale: 2 }).notNull().default("0"),
    credit: numeric("credit", { precision: 12, scale: 2 }).notNull().default("0"),
    postedByUserId: text("posted_by_user_id"),
    postedAt: timestamp("posted_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    studentPostedIdx: index("ledger_entries_student_posted_idx").on(
      table.studentId,
      table.postedAt
    ),
    enrollmentPostedIdx: index("ledger_entries_enrollment_posted_idx").on(
      table.enrollmentId,
      table.postedAt
    ),
  })
);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "gcash",
  "bank",
  "card",
  "other",
]);

export const paymentStatusEnum = pgEnum("payment_status", ["posted", "void"]);

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id),
  enrollmentId: uuid("enrollment_id")
    .notNull()
    .references(() => enrollments.id),
  receivedByUserId: text("received_by_user_id"),
  receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow(),
  method: paymentMethodEnum("method").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  referenceNo: varchar("reference_no", { length: 128 }),
  remarks: text("remarks"),
  status: paymentStatusEnum("status").notNull().default("posted"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const paymentAllocations = pgTable("payment_allocations", {
  id: uuid("id").primaryKey().defaultRandom(),
  paymentId: uuid("payment_id")
    .notNull()
    .references(() => payments.id),
  ledgerEntryId: uuid("ledger_entry_id").references(() => ledgerEntries.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
});

export const enrollmentFinanceStatusEnum = pgEnum("efs_status", [
  "unassessed",
  "assessed",
  "partially_paid",
  "paid",
  "cleared",
  "hold",
]);

/** Table name "efs" avoids conflict with composite type enrollment_finance_status in DB. */
export const enrollmentFinanceStatus = pgTable(
  "efs",
  {
    enrollmentId: uuid("enrollment_id")
      .primaryKey()
      .references(() => enrollments.id),
    status: enrollmentFinanceStatusEnum("status")
      .notNull()
      .default("unassessed"),
    balance: numeric("balance", { precision: 12, scale: 2 }).notNull().default("0"),
    updatedByUserId: text("updated_by_user_id"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }
);

export const studentShifts = pgTable("student_shifts", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id),
  fromCourse: varchar("from_course", { length: 64 }),
  toCourse: varchar("to_course", { length: 64 }),
  schoolYearId: uuid("school_year_id").references(() => schoolYears.id),
  actionDate: timestamp("action_date", { withTimezone: true }).defaultNow(),
});

export const requirements = pgTable("requirements", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 64 })
    .notNull()
    .default(sql`'LEGACY-' || gen_random_uuid()::text`),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  instructions: text("instructions"),
  allowedFileTypes: jsonb("allowed_file_types").$type<string[]>().default([]),
  maxFiles: integer("max_files").notNull().default(1),
  /** Maps to existing DB column "active" to avoid data loss on push */
  isActive: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  codeUnique: uniqueIndex("requirements_code_unique").on(table.code),
}));

export const requirementAppliesToEnum = pgEnum("requirement_applies_to", [
  "enrollment",
  "clearance",
  "graduation",
]);

export const requirementRules = pgTable(
  "requirement_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requirementId: uuid("requirement_id")
      .notNull()
      .references(() => requirements.id),
    appliesTo: requirementAppliesToEnum("applies_to").notNull().default("enrollment"),
    program: varchar("program", { length: 64 }),
    yearLevel: varchar("year_level", { length: 32 }),
    schoolYearId: uuid("school_year_id").references(() => schoolYears.id),
    termId: uuid("term_id").references(() => terms.id),
    isRequired: boolean("is_required").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    ruleUnique: uniqueIndex("requirement_rules_unique").on(
      table.requirementId,
      table.appliesTo,
      table.program,
      table.yearLevel,
      table.schoolYearId,
      table.termId
    ),
  })
);

export const requirementStatusEnum = pgEnum("requirement_status", [
  "missing",
  "submitted",
  "verified",
  "rejected",
]);

export const studentRequirementSubmissions = pgTable(
  "student_requirement_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id),
    enrollmentId: uuid("enrollment_id").references(() => enrollments.id),
    requirementId: uuid("requirement_id")
      .notNull()
      .references(() => requirements.id),
    status: requirementStatusEnum("status").notNull().default("missing"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    verifiedByUserId: text("verified_by_user_id"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    registrarRemarks: text("registrar_remarks"),
    /** When true, student indicated they will submit this document later; allows enrollment submit without file */
    markAsToFollow: boolean("mark_as_to_follow").notNull().default(false),
    lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true }).defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    studentEnrollmentReqUnique: uniqueIndex(
      "student_requirement_submissions_student_enrollment_req_unique"
    ).on(table.studentId, table.enrollmentId, table.requirementId),
  })
);

export const requirementRequestStatusEnum = pgEnum("requirement_request_status", [
  "pending",
  "fulfilled",
  "cancelled",
]);

export const requirementRequests = pgTable("requirement_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  enrollmentId: uuid("enrollment_id")
    .notNull()
    .references(() => enrollments.id),
  submissionId: uuid("submission_id")
    .notNull()
    .references(() => studentRequirementSubmissions.id),
  requestedByUserId: text("requested_by_user_id").notNull(),
  requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow(),
  message: text("message"),
  status: requirementRequestStatusEnum("status").notNull().default("pending"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const requirementFiles = pgTable(
  "requirement_files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => studentRequirementSubmissions.id),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileType: varchar("file_type", { length: 64 }).notNull(),
    fileSize: integer("file_size").notNull(),
    storageKey: text("storage_key").notNull(),
    url: text("url"),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    submissionStorageUnique: uniqueIndex("requirement_files_submission_storage_unique").on(
      table.submissionId,
      table.storageKey
    ),
  })
);

export const studentRequirements = pgTable("student_requirements", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id),
  schoolYearId: uuid("school_year_id")
    .notNull()
    .references(() => schoolYears.id),
  termId: uuid("term_id")
    .notNull()
    .references(() => terms.id),
  requirementName: varchar("requirement_name", { length: 128 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  actionDate: timestamp("action_date", { withTimezone: true }).defaultNow(),
});

export const requirementVerifications = pgTable("requirement_verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id),
  schoolYearId: uuid("school_year_id").references(() => schoolYears.id),
  termId: uuid("term_id").references(() => terms.id),
  requirementId: uuid("requirement_id")
    .notNull()
    .references(() => requirements.id),
  status: requirementStatusEnum("status").notNull().default("missing"),
  verifiedByUserId: text("verified_by_user_id"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  studentReqSyTermIdx: uniqueIndex("requirement_verifications_student_req_sy_term_unique").on(
    table.studentId,
    table.requirementId,
    table.schoolYearId,
    table.termId
  ),
}));

export const announcementAudienceEnum = pgEnum("announcement_audience", [
  "all",
  "students",
  "teachers",
  "registrar",
  "finance",
  "program_head",
  "dean",
]);

export const announcements = pgTable("announcements", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  audience: announcementAudienceEnum("audience").notNull().default("all"),
  program: varchar("program", { length: 64 }),
  pinned: boolean("pinned").notNull().default(false),
  createdByUserId: text("created_by_user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const governanceFlagTypeEnum = pgEnum("governance_flag_type", [
  "finance_hold",
  "academic_hold",
  "disciplinary_hold",
  "exception",
]);
export const governanceFlagStatusEnum = pgEnum("governance_flag_status", [
  "active",
  "resolved",
]);

export const governanceFlags = pgTable("governance_flags", {
  id: uuid("id").primaryKey().defaultRandom(),
  enrollmentId: uuid("enrollment_id").references(() => enrollments.id),
  studentId: uuid("student_id").references(() => students.id),
  flagType: governanceFlagTypeEnum("flag_type").notNull(),
  status: governanceFlagStatusEnum("status").notNull().default("active"),
  createdByUserId: text("created_by_user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  resolvedByUserId: text("resolved_by_user_id"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  notes: text("notes"),
});

export const pendingApplicationStatusEnum = pgEnum(
  "pending_application_status",
  ["pending", "approved", "rejected"]
);

export const pendingStudentApplications = pgTable(
  "pending_student_applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userProfileId: uuid("user_profile_id")
      .notNull()
      .references(() => userProfile.id),
    firstName: varchar("first_name", { length: 128 }).notNull(),
    middleName: varchar("middle_name", { length: 128 }),
    lastName: varchar("last_name", { length: 128 }).notNull(),
    birthday: date("birthday"),
    program: varchar("program", { length: 64 }),
    yearLevel: varchar("year_level", { length: 32 }),
    street: varchar("street", { length: 255 }),
    province: varchar("province", { length: 128 }),
    municipality: varchar("municipality", { length: 128 }),
    barangay: varchar("barangay", { length: 128 }),
    notes: text("notes"),
    status: pendingApplicationStatusEnum("status").notNull().default("pending"),
    actionBy: uuid("action_by").references(() => userProfile.id),
    actionDate: timestamp("action_date", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }
);

export const studentAddresses = pgTable("student_addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id),
  street: varchar("street", { length: 255 }),
  province: varchar("province", { length: 128 }),
  municipality: varchar("municipality", { length: 128 }),
  barangay: varchar("barangay", { length: 128 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/**
 * Grades
 */

export const gradeTypes = pgTable("grade_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 64 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("active"),
});

export const gradeLevelEnum = pgEnum("grade_level", ["jhs", "shs"]);

/** Legacy tables – actual DB has these; student_grades_view unions them */
export const jhsGrades = pgTable("jhs_grades", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id),
  schoolYearId: uuid("school_year_id")
    .notNull()
    .references(() => schoolYears.id),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id),
  grade: numeric("grade", { precision: 4, scale: 2 }),
  status: varchar("status", { length: 32 }),
});

export const shsGrades = pgTable("shs_grades", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id),
  schoolYearId: uuid("school_year_id")
    .notNull()
    .references(() => schoolYears.id),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id),
  grade: numeric("grade", { precision: 4, scale: 2 }),
  status: varchar("status", { length: 32 }),
});

export const grades = pgTable("grades", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id),
  schoolYearId: uuid("school_year_id")
    .notNull()
    .references(() => schoolYears.id),
  termId: uuid("term_id").references(() => terms.id),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id),
  level: gradeLevelEnum("level").notNull(),
  grade: numeric("grade", { precision: 4, scale: 2 }),
  status: varchar("status", { length: 32 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const gradeCertifications = pgTable("grade_certifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id),
  schoolYearId: uuid("school_year_id").references(() => schoolYears.id),
  remarks: text("remarks"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/**
 * Billing
 */

export const programFees = pgTable("program_fees", {
  id: uuid("id").primaryKey().defaultRandom(),
  program: varchar("program", { length: 64 }).notNull(),
  schoolYearId: uuid("school_year_id")
    .notNull()
    .references(() => schoolYears.id),
  baseFee: numeric("base_fee", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const studentFeeLedgers = pgTable("student_fee_ledgers", {
  id: uuid("id").primaryKey().defaultRandom(),
  enrollmentId: uuid("enrollment_id")
    .notNull()
    .references(() => enrollments.id),
  totalFee: numeric("total_fee", { precision: 10, scale: 2 }).notNull(),
  totalAmountDue: numeric("total_amount_due", {
    precision: 10,
    scale: 2,
  }).notNull(),
  balance: numeric("balance", { precision: 10, scale: 2 }).notNull(),
  tuitionFeeBalance: numeric("tuition_fee_balance", {
    precision: 10,
    scale: 2,
  }),
  miscFeeBalance: numeric("misc_fee_balance", {
    precision: 10,
    scale: 2,
  }),
  amountPaid: numeric("amount_paid", { precision: 10, scale: 2 }).default("0"),
  actionDate: timestamp("action_date", { withTimezone: true }).defaultNow(),
});

export const preregistrationFeeLedgers = pgTable(
  "preregistration_fee_ledgers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id),
    schoolYearId: uuid("school_year_id")
      .notNull()
      .references(() => schoolYears.id),
    totalFee: numeric("total_fee", { precision: 10, scale: 2 }).notNull(),
    totalAmountDue: numeric("total_amount_due", {
      precision: 10,
      scale: 2,
    }).notNull(),
    balance: numeric("balance", { precision: 10, scale: 2 }).notNull(),
    amountPaid: numeric("amount_paid", { precision: 10, scale: 2 }).default(
      "0"
    ),
    actionDate: timestamp("action_date", { withTimezone: true }).defaultNow(),
  }
);

/**
 * Convenience views for portal queries
 */

// Active enrollments – for now this view simply exposes all enrollments.
// You can later restrict by the active school year / term in SQL.
export const currentEnrollmentsView = pgView("current_enrollments_view").as(
  (qb) =>
    qb
      .select({
        id: enrollments.id,
        studentId: enrollments.studentId,
        schoolYearId: enrollments.schoolYearId,
        termId: enrollments.termId,
        status: enrollments.status,
      })
      .from(enrollments)
);

// Student schedule view – joins enrollments to class schedules and days.
export const studentScheduleView = pgView("student_schedule_view").as(
  (qb) =>
    qb
      .select({
        enrollmentId: enrollments.id,
        studentId: enrollments.studentId,
        schoolYearId: enrollments.schoolYearId,
        termId: enrollments.termId,
        sectionId: classSchedules.sectionId,
        subjectId: classSchedules.subjectId,
        teacherUserProfileId: classSchedules.teacherUserProfileId,
        timeIn: classSchedules.timeIn,
        timeOut: classSchedules.timeOut,
        room: classSchedules.room,
        day: scheduleDays.day,
      })
      .from(enrollments)
      .innerJoin(
        classSchedules,
        sql`${classSchedules.sectionId} = ${enrollments.sectionId}`
      )
      .innerJoin(
        scheduleDays,
        sql`${scheduleDays.scheduleId} = ${classSchedules.id}`
      )
);

// Student grades view – union of jhs_grades and shs_grades (level_type in DB).
export const studentGradesView = pgView(
  "student_grades_view",
  {
    id: uuid("id"),
    studentId: uuid("student_id"),
    schoolYearId: uuid("school_year_id"),
    subjectId: uuid("subject_id"),
    grade: numeric("grade", { precision: 4, scale: 2 }),
    status: varchar("status", { length: 32 }),
    levelType: varchar("level_type", { length: 8 }),
  }
).existing();

// Billing summary per enrollment.
export const studentBillingView = pgView("student_billing_view").as((qb) =>
  qb
    .select({
      enrollmentId: studentFeeLedgers.enrollmentId,
      totalFee: studentFeeLedgers.totalFee,
      totalAmountDue: studentFeeLedgers.totalAmountDue,
      balance: studentFeeLedgers.balance,
      tuitionFeeBalance: studentFeeLedgers.tuitionFeeBalance,
      miscFeeBalance: studentFeeLedgers.miscFeeBalance,
      amountPaid: studentFeeLedgers.amountPaid,
    })
    .from(studentFeeLedgers)
);


