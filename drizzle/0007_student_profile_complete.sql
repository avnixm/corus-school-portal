-- Add guardian and profile completion columns to students
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "guardian_name" varchar(255);
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "guardian_relationship" varchar(64);
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "guardian_mobile" varchar(32);
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "student_type" varchar(32);
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "profile_completed_at" timestamp with time zone;
