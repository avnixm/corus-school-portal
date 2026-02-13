CREATE TYPE "public"."announcement_audience" AS ENUM('all', 'students', 'teachers', 'registrar', 'finance', 'program_head', 'dean');--> statement-breakpoint
CREATE TYPE "public"."enrollment_approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."requirement_status" AS ENUM('missing', 'submitted', 'verified', 'rejected');--> statement-breakpoint
ALTER TYPE "public"."enrollment_status" ADD VALUE 'preregistered' BEFORE 'pending';--> statement-breakpoint
ALTER TYPE "public"."enrollment_status" ADD VALUE 'pending_approval' BEFORE 'pending';--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"audience" "announcement_audience" DEFAULT 'all' NOT NULL,
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "requirement_verifications" (
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
--> statement-breakpoint
CREATE TABLE "requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(128) NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "enrollment_approvals" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "enrollment_approvals" ALTER COLUMN "status" SET DATA TYPE "public"."enrollment_approval_status" USING "status"::text::"public"."enrollment_approval_status";--> statement-breakpoint
ALTER TABLE "enrollment_approvals" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "enrollments" ALTER COLUMN "status" SET DEFAULT 'pending_approval';--> statement-breakpoint
ALTER TABLE "class_schedules" ADD COLUMN "teacher_name" varchar(128);--> statement-breakpoint
ALTER TABLE "enrollment_approvals" ADD COLUMN "reviewed_by_user_id" text;--> statement-breakpoint
ALTER TABLE "enrollment_approvals" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "program" varchar(64);--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "created_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "sections" ADD COLUMN "year_level" varchar(32);--> statement-breakpoint
ALTER TABLE "sections" ADD COLUMN "program" varchar(64);--> statement-breakpoint
ALTER TABLE "sections" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "email" varchar(255);--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "contact_no" varchar(32);--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "terms" ADD COLUMN "is_active" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "requirement_verifications" ADD CONSTRAINT "requirement_verifications_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirement_verifications" ADD CONSTRAINT "requirement_verifications_school_year_id_school_years_id_fk" FOREIGN KEY ("school_year_id") REFERENCES "public"."school_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirement_verifications" ADD CONSTRAINT "requirement_verifications_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirement_verifications" ADD CONSTRAINT "requirement_verifications_requirement_id_requirements_id_fk" FOREIGN KEY ("requirement_id") REFERENCES "public"."requirements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "requirement_verifications_student_req_sy_term_unique" ON "requirement_verifications" USING btree ("student_id","requirement_id","school_year_id","term_id");--> statement-breakpoint
CREATE UNIQUE INDEX "requirements_name_unique" ON "requirements" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "enrollment_approvals_enrollment_id_unique" ON "enrollment_approvals" USING btree ("enrollment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "enrollments_student_sy_term_unique" ON "enrollments" USING btree ("student_id","school_year_id","term_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subjects_code_unique" ON "subjects" USING btree ("code");