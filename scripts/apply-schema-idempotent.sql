-- Apply all schema changes idempotently (safe to run multiple times).
-- Run with: psql $DATABASE_URL -f scripts/apply-schema-idempotent.sql
-- Or use your DB client to execute this file.

-- ============ 0002 ============
DO $$ BEGIN
  CREATE TYPE "public"."grade_level" AS ENUM('jhs', 'shs');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TYPE "public"."pending_application_status" AS ENUM('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "grades" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "student_id" uuid NOT NULL,
  "school_year_id" uuid NOT NULL,
  "term_id" uuid,
  "subject_id" uuid NOT NULL,
  "level" "grade_level" NOT NULL,
  "grade" numeric(4, 2),
  "status" varchar(32),
  "created_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "pending_student_applications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_profile_id" uuid NOT NULL,
  "first_name" varchar(128) NOT NULL,
  "middle_name" varchar(128),
  "last_name" varchar(128) NOT NULL,
  "birthday" date,
  "program" varchar(64),
  "year_level" varchar(32),
  "street" varchar(255),
  "province" varchar(128),
  "municipality" varchar(128),
  "barangay" varchar(128),
  "notes" text,
  "status" "pending_application_status" DEFAULT 'pending' NOT NULL,
  "action_by" uuid,
  "action_date" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "student_addresses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "student_id" uuid NOT NULL,
  "street" varchar(255),
  "province" varchar(128),
  "municipality" varchar(128),
  "barangay" varchar(128),
  "created_at" timestamp with time zone DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE "grades" ADD CONSTRAINT "grades_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "grades" ADD CONSTRAINT "grades_school_year_id_school_years_id_fk" FOREIGN KEY ("school_year_id") REFERENCES "public"."school_years"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "grades" ADD CONSTRAINT "grades_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "grades" ADD CONSTRAINT "grades_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "pending_student_applications" ADD CONSTRAINT "pending_student_applications_user_profile_id_user_profile_id_fk" FOREIGN KEY ("user_profile_id") REFERENCES "public"."user_profile"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "pending_student_applications" ADD CONSTRAINT "pending_student_applications_action_by_user_profile_id_fk" FOREIGN KEY ("action_by") REFERENCES "public"."user_profile"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "student_addresses" ADD CONSTRAINT "student_addresses_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============ 0003 ============
DO $$ BEGIN
  CREATE TYPE "public"."announcement_audience" AS ENUM('all', 'students', 'teachers', 'registrar', 'finance', 'program_head', 'dean');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TYPE "public"."enrollment_approval_status" AS ENUM('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TYPE "public"."requirement_status" AS ENUM('missing', 'submitted', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TYPE "public"."enrollment_status" ADD VALUE IF NOT EXISTS 'preregistered' BEFORE 'pending';
ALTER TYPE "public"."enrollment_status" ADD VALUE IF NOT EXISTS 'pending_approval' BEFORE 'pending';

CREATE TABLE IF NOT EXISTS "announcements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" varchar(255) NOT NULL,
  "body" text NOT NULL,
  "audience" "announcement_audience" DEFAULT 'all' NOT NULL,
  "created_by_user_id" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "requirement_verifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "student_id" uuid NOT NULL,
  "school_year_id" uuid,
  "term_id" uuid,
  "requirement_id" uuid NOT NULL,
  "status" "requirement_status" DEFAULT 'missing' NOT NULL,
  "verified_by_user_id" text,
  "verified_at" timestamp with time zone,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "requirements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(128) NOT NULL,
  "description" text,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

DO $$ BEGIN ALTER TABLE "enrollment_approvals" ALTER COLUMN "status" DROP DEFAULT; EXCEPTION WHEN OTHERS THEN null; END $$;
DO $$ BEGIN ALTER TABLE "enrollment_approvals" ALTER COLUMN "status" SET DATA TYPE "public"."enrollment_approval_status" USING "status"::text::"public"."enrollment_approval_status"; EXCEPTION WHEN OTHERS THEN null; END $$;
DO $$ BEGIN ALTER TABLE "enrollment_approvals" ALTER COLUMN "status" SET DEFAULT 'pending'; EXCEPTION WHEN OTHERS THEN null; END $$;
DO $$ BEGIN ALTER TABLE "enrollments" ALTER COLUMN "status" SET DEFAULT 'pending_approval'; EXCEPTION WHEN OTHERS THEN null; END $$;

ALTER TABLE "class_schedules" ADD COLUMN IF NOT EXISTS "teacher_name" varchar(128);
ALTER TABLE "enrollment_approvals" ADD COLUMN IF NOT EXISTS "reviewed_by_user_id" text;
ALTER TABLE "enrollment_approvals" ADD COLUMN IF NOT EXISTS "reviewed_at" timestamp with time zone;
ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "program" varchar(64);
ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();
ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();
ALTER TABLE "sections" ADD COLUMN IF NOT EXISTS "year_level" varchar(32);
ALTER TABLE "sections" ADD COLUMN IF NOT EXISTS "program" varchar(64);
ALTER TABLE "sections" ADD COLUMN IF NOT EXISTS "active" boolean DEFAULT true NOT NULL;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "email" varchar(255);
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "contact_no" varchar(32);
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp with time zone;
ALTER TABLE "subjects" ADD COLUMN IF NOT EXISTS "active" boolean DEFAULT true NOT NULL;
ALTER TABLE "terms" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT false NOT NULL;

DO $$ BEGIN
  ALTER TABLE "requirement_verifications" ADD CONSTRAINT "requirement_verifications_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "requirement_verifications" ADD CONSTRAINT "requirement_verifications_school_year_id_school_years_id_fk" FOREIGN KEY ("school_year_id") REFERENCES "public"."school_years"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "requirement_verifications" ADD CONSTRAINT "requirement_verifications_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "requirement_verifications" ADD CONSTRAINT "requirement_verifications_requirement_id_requirements_id_fk" FOREIGN KEY ("requirement_id") REFERENCES "public"."requirements"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "requirement_verifications_student_req_sy_term_unique" ON "requirement_verifications" USING btree ("student_id","requirement_id","school_year_id","term_id");
CREATE UNIQUE INDEX IF NOT EXISTS "requirements_name_unique" ON "requirements" USING btree ("name");
CREATE UNIQUE INDEX IF NOT EXISTS "enrollment_approvals_enrollment_id_unique" ON "enrollment_approvals" USING btree ("enrollment_id");
CREATE UNIQUE INDEX IF NOT EXISTS "enrollments_student_sy_term_unique" ON "enrollments" USING btree ("student_id","school_year_id","term_id");
CREATE UNIQUE INDEX IF NOT EXISTS "subjects_code_unique" ON "subjects" USING btree ("code");

-- ============ Finance: payment_method, payment_status, payments ============
DO $$ BEGIN
  CREATE TYPE "public"."payment_method" AS ENUM('cash', 'gcash', 'bank', 'card', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TYPE "public"."payment_status" AS ENUM('posted', 'void');
EXCEPTION WHEN duplicate_object THEN null; END $$;
CREATE TABLE IF NOT EXISTS "payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "student_id" uuid NOT NULL,
  "enrollment_id" uuid NOT NULL,
  "received_by_user_id" text,
  "received_at" timestamp with time zone DEFAULT now(),
  "method" "payment_method" NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "reference_no" varchar(128),
  "remarks" text,
  "status" "payment_status" DEFAULT 'posted' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);
DO $$ BEGIN
  ALTER TABLE "payments" ADD CONSTRAINT "payments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "payments" ADD CONSTRAINT "payments_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============ Finance: efs (enrollment finance status) ============
-- Table name "efs" avoids conflict with type enrollment_finance_status in PostgreSQL.
DO $$ BEGIN
  CREATE TYPE "public"."efs_status" AS ENUM('unassessed', 'assessed', 'partially_paid', 'paid', 'cleared', 'hold');
EXCEPTION WHEN duplicate_object THEN null; END $$;
-- One-time rename for existing DBs that had the old table name (avoids type name conflict on push).
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'enrollment_finance_status') THEN
    ALTER TABLE "enrollment_finance_status" RENAME TO "efs";
  END IF;
EXCEPTION WHEN OTHERS THEN null; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'efs') THEN
    CREATE TABLE "efs" (
      "enrollment_id" uuid PRIMARY KEY,
      "status" "efs_status" DEFAULT 'unassessed' NOT NULL,
      "balance" numeric(12, 2) DEFAULT '0' NOT NULL,
      "updated_by_user_id" text,
      "updated_at" timestamp with time zone DEFAULT now()
    );
  END IF;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'efs') AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'efs_enrollment_id_enrollments_id_fk') THEN
    ALTER TABLE "efs" ADD CONSTRAINT "efs_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE no action ON UPDATE no action;
  END IF;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============ 0004 ============
ALTER TABLE "user_profile" ADD COLUMN IF NOT EXISTS "email_verification_bypassed" boolean DEFAULT false NOT NULL;

-- ============ Program head scope ============
ALTER TABLE "user_profile" ADD COLUMN IF NOT EXISTS "program" varchar(64);
ALTER TABLE "user_profile" ADD COLUMN IF NOT EXISTS "department" varchar(64);

-- ============ Admin: user_profile.active ============
ALTER TABLE "user_profile" ADD COLUMN IF NOT EXISTS "active" boolean DEFAULT true NOT NULL;

-- ============ 0005 (teachers + grade flow) ============
ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "user_id" text;
ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "employee_no" varchar(32);
ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "active" boolean DEFAULT true NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "teachers_user_id_unique" ON "teachers" USING btree ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "teachers_employee_no_unique" ON "teachers" USING btree ("employee_no");

CREATE TABLE IF NOT EXISTS "teacher_assignments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "teacher_id" uuid NOT NULL,
  "schedule_id" uuid NOT NULL,
  "school_year_id" uuid NOT NULL,
  "term_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "teacher_assignments_teacher_schedule_unique" ON "teacher_assignments" USING btree ("teacher_id","schedule_id");

CREATE TABLE IF NOT EXISTS "grading_periods" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "school_year_id" uuid NOT NULL,
  "term_id" uuid NOT NULL,
  "name" varchar(64) NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "grading_periods_sy_term_name_unique" ON "grading_periods" USING btree ("school_year_id","term_id","name");

DO $$ BEGIN
  CREATE TYPE "public"."grade_submission_status" AS ENUM('draft', 'submitted', 'returned', 'approved', 'released');
EXCEPTION WHEN duplicate_object THEN null; WHEN OTHERS THEN null; END $$;

CREATE TABLE IF NOT EXISTS "grade_submissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "schedule_id" uuid NOT NULL,
  "school_year_id" uuid NOT NULL,
  "term_id" uuid NOT NULL,
  "grading_period_id" uuid NOT NULL,
  "teacher_id" uuid NOT NULL,
  "status" "grade_submission_status" DEFAULT 'draft' NOT NULL,
  "submitted_at" timestamp with time zone,
  "registrar_reviewed_by_user_id" text,
  "registrar_reviewed_at" timestamp with time zone,
  "registrar_remarks" text,
  "approved_at" timestamp with time zone,
  "released_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "grade_submissions_schedule_period_unique" ON "grade_submissions" USING btree ("schedule_id","grading_period_id");

CREATE TABLE IF NOT EXISTS "grade_entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "submission_id" uuid NOT NULL,
  "student_id" uuid NOT NULL,
  "enrollment_id" uuid NOT NULL,
  "numeric_grade" numeric(5, 2),
  "letter_grade" varchar(16),
  "remarks" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "grade_entries_submission_student_unique" ON "grade_entries" USING btree ("submission_id","student_id");

DO $$ BEGIN
  ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_schedule_id_class_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."class_schedules"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_school_year_id_school_years_id_fk" FOREIGN KEY ("school_year_id") REFERENCES "public"."school_years"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "grading_periods" ADD CONSTRAINT "grading_periods_school_year_id_school_years_id_fk" FOREIGN KEY ("school_year_id") REFERENCES "public"."school_years"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "grading_periods" ADD CONSTRAINT "grading_periods_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "grade_submissions" ADD CONSTRAINT "grade_submissions_schedule_id_class_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."class_schedules"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "grade_submissions" ADD CONSTRAINT "grade_submissions_school_year_id_school_years_id_fk" FOREIGN KEY ("school_year_id") REFERENCES "public"."school_years"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "grade_submissions" ADD CONSTRAINT "grade_submissions_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "grade_submissions" ADD CONSTRAINT "grade_submissions_grading_period_id_grading_periods_id_fk" FOREIGN KEY ("grading_period_id") REFERENCES "public"."grading_periods"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "grade_submissions" ADD CONSTRAINT "grade_submissions_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "grade_entries" ADD CONSTRAINT "grade_entries_submission_id_grade_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."grade_submissions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "grade_entries" ADD CONSTRAINT "grade_entries_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "grade_entries" ADD CONSTRAINT "grade_entries_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============ Dean: announcements program/pinned ============
ALTER TABLE "announcements" ADD COLUMN IF NOT EXISTS "program" varchar(64);
ALTER TABLE "announcements" ADD COLUMN IF NOT EXISTS "pinned" boolean DEFAULT false NOT NULL;

-- ============ Dean: governance_flags ============
DO $$ BEGIN
  CREATE TYPE "public"."governance_flag_type" AS ENUM('finance_hold', 'academic_hold', 'disciplinary_hold', 'exception');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TYPE "public"."governance_flag_status" AS ENUM('active', 'resolved');
EXCEPTION WHEN duplicate_object THEN null; END $$;
CREATE TABLE IF NOT EXISTS "governance_flags" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "enrollment_id" uuid REFERENCES "public"."enrollments"("id"),
  "student_id" uuid REFERENCES "public"."students"("id"),
  "flag_type" "governance_flag_type" NOT NULL,
  "status" "governance_flag_status" DEFAULT 'active' NOT NULL,
  "created_by_user_id" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "resolved_by_user_id" text,
  "resolved_at" timestamp with time zone,
  "notes" text
);

-- ============ Admin portal: role enum + tables ============
DO $$ BEGIN
  ALTER TYPE "public"."role" ADD VALUE 'admin';
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "programs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "code" varchar(32) NOT NULL,
  "name" varchar(255) NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "programs_code_unique" ON "programs" USING btree ("code");

CREATE TABLE IF NOT EXISTS "program_head_assignments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "program_code" varchar(64) NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "program_head_assignments_user_program_unique" ON "program_head_assignments" USING btree ("user_id", "program_code");
CREATE INDEX IF NOT EXISTS "program_head_assignments_user_id_idx" ON "program_head_assignments" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "program_head_assignments_program_code_idx" ON "program_head_assignments" USING btree ("program_code");

CREATE TABLE IF NOT EXISTS "system_settings" (
  "key" varchar(128) PRIMARY KEY NOT NULL,
  "value" jsonb,
  "updated_by_user_id" text,
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "audit_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "actor_user_id" text,
  "action" varchar(64) NOT NULL,
  "entity_type" varchar(64) NOT NULL,
  "entity_id" text,
  "before" jsonb,
  "after" jsonb,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "user_role_grants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "role" "role" NOT NULL,
  "granted_by_user_id" text,
  "granted_at" timestamp with time zone DEFAULT now(),
  "revoked_at" timestamp with time zone
);
CREATE INDEX IF NOT EXISTS "user_role_grants_user_id_idx" ON "user_role_grants" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "user_role_grants_role_idx" ON "user_role_grants" USING btree ("role");

-- ============ Requirements: code, instructions, rules, submissions, files ============
ALTER TABLE "requirements" ADD COLUMN IF NOT EXISTS "code" varchar(64) DEFAULT ('LEGACY-' || gen_random_uuid()::text) NOT NULL;
ALTER TABLE "requirements" ADD COLUMN IF NOT EXISTS "instructions" text;
ALTER TABLE "requirements" ADD COLUMN IF NOT EXISTS "allowed_file_types" jsonb DEFAULT '[]';
ALTER TABLE "requirements" ADD COLUMN IF NOT EXISTS "max_files" integer DEFAULT 1 NOT NULL;
ALTER TABLE "requirements" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS "requirements_code_unique" ON "requirements" USING btree ("code");

DO $$ BEGIN
  CREATE TYPE "public"."requirement_applies_to" AS ENUM('enrollment', 'clearance', 'graduation');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "requirement_rules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "requirement_id" uuid NOT NULL,
  "applies_to" "requirement_applies_to" DEFAULT 'enrollment' NOT NULL,
  "program" varchar(64),
  "year_level" varchar(32),
  "school_year_id" uuid,
  "term_id" uuid,
  "is_required" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "requirement_rules_unique" ON "requirement_rules" USING btree ("requirement_id", "applies_to", "program", "year_level", "school_year_id", "term_id");
DO $$ BEGIN
  ALTER TABLE "requirement_rules" ADD CONSTRAINT "requirement_rules_requirement_id_requirements_id_fk" FOREIGN KEY ("requirement_id") REFERENCES "public"."requirements"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "requirement_rules" ADD CONSTRAINT "requirement_rules_school_year_id_school_years_id_fk" FOREIGN KEY ("school_year_id") REFERENCES "public"."school_years"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "requirement_rules" ADD CONSTRAINT "requirement_rules_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "student_requirement_submissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "student_id" uuid NOT NULL,
  "enrollment_id" uuid,
  "requirement_id" uuid NOT NULL,
  "status" "requirement_status" DEFAULT 'missing' NOT NULL,
  "submitted_at" timestamp with time zone,
  "verified_by_user_id" text,
  "verified_at" timestamp with time zone,
  "registrar_remarks" text,
  "last_updated_at" timestamp with time zone DEFAULT now(),
  "created_at" timestamp with time zone DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "student_requirement_submissions_student_enrollment_req_unique" ON "student_requirement_submissions" USING btree ("student_id", "enrollment_id", "requirement_id");
DO $$ BEGIN
  ALTER TABLE "student_requirement_submissions" ADD CONSTRAINT "student_requirement_submissions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "student_requirement_submissions" ADD CONSTRAINT "student_requirement_submissions_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "student_requirement_submissions" ADD CONSTRAINT "student_requirement_submissions_requirement_id_requirements_id_fk" FOREIGN KEY ("requirement_id") REFERENCES "public"."requirements"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "requirement_files" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "submission_id" uuid NOT NULL,
  "file_name" varchar(255) NOT NULL,
  "file_type" varchar(64) NOT NULL,
  "file_size" integer NOT NULL,
  "storage_key" text NOT NULL,
  "url" text,
  "uploaded_at" timestamp with time zone DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "requirement_files_submission_storage_unique" ON "requirement_files" USING btree ("submission_id", "storage_key");
DO $$ BEGIN
  ALTER TABLE "requirement_files" ADD CONSTRAINT "requirement_files_submission_id_student_requirement_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."student_requirement_submissions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============ Programs / program_id (sections, enrollments, fee rules) ============
DO $$ BEGIN
  ALTER TABLE "programs" ADD COLUMN IF NOT EXISTS "description" text;
EXCEPTION WHEN duplicate_column THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "sections" ADD COLUMN IF NOT EXISTS "program_id" uuid;
EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "sections" ADD CONSTRAINT "sections_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "sections_program_year_name_unique" ON "sections" USING btree ("program_id", "year_level", "name");

DO $$ BEGIN
  ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "program_id" uuid;
EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "program_fee_rules" ADD COLUMN IF NOT EXISTS "program_id" uuid;
EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "program_fee_rules" ADD CONSTRAINT "program_fee_rules_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
