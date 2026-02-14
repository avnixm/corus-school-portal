-- Add program_id and related columns (fixes "Failed query" on enrollments).
-- Run in Neon SQL Editor or: psql $DATABASE_URL -f scripts/migrate-program-id.sql

-- programs: optional description
ALTER TABLE "programs" ADD COLUMN IF NOT EXISTS "description" text;

-- sections: program_id FK
ALTER TABLE "sections" ADD COLUMN IF NOT EXISTS "program_id" uuid;
DO $$ BEGIN
  ALTER TABLE "sections" ADD CONSTRAINT "sections_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id");
EXCEPTION WHEN duplicate_object THEN null; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "sections_program_year_name_unique" ON "sections" ("program_id", "year_level", "name");

-- enrollments: program_id FK (fixes getEnrollmentByStudentId)
ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "program_id" uuid;
DO $$ BEGIN
  ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id");
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- program_fee_rules: program_id FK
ALTER TABLE "program_fee_rules" ADD COLUMN IF NOT EXISTS "program_id" uuid;
DO $$ BEGIN
  ALTER TABLE "program_fee_rules" ADD CONSTRAINT "program_fee_rules_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id");
EXCEPTION WHEN duplicate_object THEN null; END $$;
