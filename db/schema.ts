import {
  pgTable,
  pgView,
  uuid,
  text,
  timestamp,
  uniqueIndex,
  varchar,
  date,
  boolean,
  integer,
  numeric,
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
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const teachers = pgTable("teachers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userProfileId: uuid("user_profile_id").references(() => userProfile.id),
  teacherCode: varchar("teacher_code", { length: 32 }), // legacy teacher_id
  firstName: varchar("first_name", { length: 128 }).notNull(),
  lastName: varchar("last_name", { length: 128 }).notNull(),
  email: varchar("email", { length: 255 }),
  position: varchar("position", { length: 128 }),
  status: varchar("status", { length: 32 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/**
 * Curriculum & classes
 */

export const subjects = pgTable("subjects", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 32 }).notNull(), // subject_code
  description: varchar("description", { length: 255 }).notNull(),
  units: numeric("units", { precision: 4, scale: 1 }).default("0"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  codeUnique: uniqueIndex("subjects_code_unique").on(table.code),
}));

export const sections = pgTable("sections", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 64 }).notNull(), // section
  gradeLevel: varchar("grade_level", { length: 32 }),
  yearLevel: varchar("year_level", { length: 32 }),
  program: varchar("program", { length: 64 }),
  status: varchar("status", { length: 32 }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

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
  teacherId: uuid("teacher_id").references(() => teachers.id),
  teacherName: varchar("teacher_name", { length: 128 }),
  timeIn: varchar("time_in", { length: 16 }), // e.g. 08:00
  timeOut: varchar("time_out", { length: 16 }),
  room: varchar("room", { length: 64 }),
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

export const enrollments = pgTable("enrollments", {
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
  course: varchar("course", { length: 64 }),
  program: varchar("program", { length: 64 }),
  yearLevel: varchar("year_level", { length: 32 }),
  sectionId: uuid("section_id").references(() => sections.id),
  status: enrollmentStatusEnum("status").notNull().default("pending_approval"),
  dateEnrolled: timestamp("date_enrolled", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  studentSyTermUnique: uniqueIndex("enrollments_student_sy_term_unique").on(
    table.studentId,
    table.schoolYearId,
    table.termId
  ),
}));

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
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  nameUnique: uniqueIndex("requirements_name_unique").on(table.name),
}));

export const requirementStatusEnum = pgEnum("requirement_status", [
  "missing",
  "submitted",
  "verified",
  "rejected",
]);

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
  createdByUserId: text("created_by_user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
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
        teacherId: classSchedules.teacherId,
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


