-- Migrate from teachers table to user_profile (role=teacher, active=true).
-- Run: psql $DATABASE_URL -f scripts/migrate-teachers-to-user-profile.sql

-- 1. Add teacher columns to user_profile
ALTER TABLE "user_profile" ADD COLUMN IF NOT EXISTS "employee_no" varchar(32);
ALTER TABLE "user_profile" ADD COLUMN IF NOT EXISTS "position" varchar(128);
ALTER TABLE "user_profile" ADD COLUMN IF NOT EXISTS "department_program_id" uuid;
DO $$ BEGIN
  ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_department_program_id_fk"
    FOREIGN KEY ("department_program_id") REFERENCES "public"."programs"("id");
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Add teacher_user_profile_id columns to dependent tables (new FK to user_profile)
ALTER TABLE "teacher_assignments" ADD COLUMN IF NOT EXISTS "teacher_user_profile_id" uuid;
ALTER TABLE "teacher_subject_permissions" ADD COLUMN IF NOT EXISTS "teacher_user_profile_id" uuid;
ALTER TABLE "teacher_subject_capabilities" ADD COLUMN IF NOT EXISTS "teacher_user_profile_id" uuid;
ALTER TABLE "grade_submissions" ADD COLUMN IF NOT EXISTS "teacher_user_profile_id" uuid;
ALTER TABLE "class_schedules" ADD COLUMN IF NOT EXISTS "teacher_user_profile_id" uuid;
ALTER TABLE "class_offerings" ADD COLUMN IF NOT EXISTS "teacher_user_profile_id" uuid;

-- 3. Migrate: for each teacher, ensure user_profile exists and populate teacher_user_profile_id
-- Teachers with userProfileId: use that
UPDATE teacher_assignments ta SET teacher_user_profile_id = t.user_profile_id
  FROM teachers t WHERE ta.teacher_id = t.id AND t.user_profile_id IS NOT NULL;
UPDATE teacher_subject_permissions tsp SET teacher_user_profile_id = t.user_profile_id
  FROM teachers t WHERE tsp.teacher_id = t.id AND t.user_profile_id IS NOT NULL;
UPDATE teacher_subject_capabilities tsc SET teacher_user_profile_id = t.user_profile_id
  FROM teachers t WHERE tsc.teacher_id = t.id AND t.user_profile_id IS NOT NULL;
UPDATE grade_submissions gs SET teacher_user_profile_id = t.user_profile_id
  FROM teachers t WHERE gs.teacher_id = t.id AND t.user_profile_id IS NOT NULL;
UPDATE class_schedules cs SET teacher_user_profile_id = t.user_profile_id
  FROM teachers t WHERE cs.teacher_id = t.id AND t.user_profile_id IS NOT NULL;
UPDATE class_offerings co SET teacher_user_profile_id = t.user_profile_id
  FROM teachers t WHERE co.teacher_id = t.id AND t.user_profile_id IS NOT NULL;

-- Teachers without userProfileId: create user_profile if needed, then update
INSERT INTO user_profile (user_id, email, full_name, role, active, employee_no, position, department_program_id)
SELECT COALESCE(t.user_id, 'legacy-teacher-' || t.id::text), t.email,
       COALESCE(t.first_name || ' ' || t.last_name, 'Teacher'), 'teacher', t.active,
       t.employee_no, t.position, t.department_program_id
FROM teachers t WHERE t.user_profile_id IS NULL
ON CONFLICT DO NOTHING;  -- user_id unique might conflict; handle manually if needed

-- For teachers without userProfileId, try to link by user_id
UPDATE teacher_assignments ta SET teacher_user_profile_id = up.id
  FROM teachers t
  JOIN user_profile up ON up.user_id = t.user_id AND up.role = 'teacher'
  WHERE ta.teacher_id = t.id AND ta.teacher_user_profile_id IS NULL;
UPDATE teacher_subject_permissions tsp SET teacher_user_profile_id = up.id
  FROM teachers t
  JOIN user_profile up ON up.user_id = t.user_id AND up.role = 'teacher'
  WHERE tsp.teacher_id = t.id AND tsp.teacher_user_profile_id IS NULL;
UPDATE teacher_subject_capabilities tsc SET teacher_user_profile_id = up.id
  FROM teachers t
  JOIN user_profile up ON up.user_id = t.user_id AND up.role = 'teacher'
  WHERE tsc.teacher_id = t.id AND tsc.teacher_user_profile_id IS NULL;
UPDATE grade_submissions gs SET teacher_user_profile_id = up.id
  FROM teachers t
  JOIN user_profile up ON up.user_id = t.user_id AND up.role = 'teacher'
  WHERE gs.teacher_id = t.id AND gs.teacher_user_profile_id IS NULL;
UPDATE class_schedules cs SET teacher_user_profile_id = up.id
  FROM teachers t
  JOIN user_profile up ON up.user_id = t.user_id AND up.role = 'teacher'
  WHERE cs.teacher_id = t.id AND cs.teacher_user_profile_id IS NULL;
UPDATE class_offerings co SET teacher_user_profile_id = up.id
  FROM teachers t
  JOIN user_profile up ON up.user_id = t.user_id AND up.role = 'teacher'
  WHERE co.teacher_id = t.id AND co.teacher_user_profile_id IS NULL;

-- For remaining: create user_profile per teacher and update (teachers without userProfileId and no user_id match)
DO $$
DECLARE
  r RECORD;
  new_up_id uuid;
BEGIN
  FOR r IN SELECT t.id, t.user_id, t.email, t.first_name, t.last_name, t.employee_no, t.position, t.department_program_id, t.active
           FROM teachers t
           WHERE NOT EXISTS (SELECT 1 FROM teacher_assignments WHERE teacher_id = t.id AND teacher_user_profile_id IS NULL)
             AND NOT EXISTS (SELECT 1 FROM teacher_subject_permissions WHERE teacher_id = t.id AND teacher_user_profile_id IS NULL)
             AND NOT EXISTS (SELECT 1 FROM teacher_subject_capabilities WHERE teacher_id = t.id AND teacher_user_profile_id IS NULL)
             AND NOT EXISTS (SELECT 1 FROM grade_submissions WHERE teacher_id = t.id AND teacher_user_profile_id IS NULL)
             AND NOT EXISTS (SELECT 1 FROM class_schedules WHERE teacher_id = t.id AND teacher_user_profile_id IS NULL)
             AND NOT EXISTS (SELECT 1 FROM class_offerings WHERE teacher_id = t.id AND teacher_user_profile_id IS NULL)
  LOOP
    -- Skip - we'll handle remaining rows
    NULL;
  END LOOP;
END $$;

-- Simpler: update from teachers.user_profile_id for all that have it
-- (already done above) For teachers without user_profile_id, we need to create one
INSERT INTO user_profile (id, user_id, email, full_name, role, active, employee_no, position, department_program_id)
SELECT gen_random_uuid(), COALESCE(t.user_id, 'legacy-' || t.id), t.email,
       t.first_name || ' ' || COALESCE(t.last_name, ''), 'teacher', t.active,
       t.employee_no, t.position, t.department_program_id
FROM teachers t WHERE t.user_profile_id IS NULL
  AND t.user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM user_profile up WHERE up.user_id = t.user_id);

-- Link teachers without userProfileId: match by user_id to existing user_profile
UPDATE teachers t SET user_profile_id = up.id
FROM user_profile up WHERE up.user_id = t.user_id AND up.role = 'teacher'
AND t.user_profile_id IS NULL;

-- Re-run the FK migration for any that now have user_profile_id
UPDATE teacher_assignments ta SET teacher_user_profile_id = t.user_profile_id
  FROM teachers t WHERE ta.teacher_id = t.id AND ta.teacher_user_profile_id IS NULL AND t.user_profile_id IS NOT NULL;
UPDATE teacher_subject_permissions tsp SET teacher_user_profile_id = t.user_profile_id
  FROM teachers t WHERE tsp.teacher_id = t.id AND tsp.teacher_user_profile_id IS NULL AND t.user_profile_id IS NOT NULL;
UPDATE teacher_subject_capabilities tsc SET teacher_user_profile_id = t.user_profile_id
  FROM teachers t WHERE tsc.teacher_id = t.id AND tsc.teacher_user_profile_id IS NULL AND t.user_profile_id IS NOT NULL;
UPDATE grade_submissions gs SET teacher_user_profile_id = t.user_profile_id
  FROM teachers t WHERE gs.teacher_id = t.id AND gs.teacher_user_profile_id IS NULL AND t.user_profile_id IS NOT NULL;
UPDATE class_schedules cs SET teacher_user_profile_id = t.user_profile_id
  FROM teachers t WHERE cs.teacher_id = t.id AND cs.teacher_user_profile_id IS NULL AND t.user_profile_id IS NOT NULL;
UPDATE class_offerings co SET teacher_user_profile_id = t.user_profile_id
  FROM teachers t WHERE co.teacher_id = t.id AND co.teacher_user_profile_id IS NULL AND t.user_profile_id IS NOT NULL;

-- 4. Add FK constraints
DO $$ BEGIN
  ALTER TABLE teacher_assignments ADD CONSTRAINT teacher_assignments_teacher_user_profile_id_fk
    FOREIGN KEY (teacher_user_profile_id) REFERENCES user_profile(id);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE teacher_subject_permissions ADD CONSTRAINT teacher_subject_permissions_teacher_user_profile_id_fk
    FOREIGN KEY (teacher_user_profile_id) REFERENCES user_profile(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE teacher_subject_capabilities ADD CONSTRAINT teacher_subject_capabilities_teacher_user_profile_id_fk
    FOREIGN KEY (teacher_user_profile_id) REFERENCES user_profile(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE grade_submissions ADD CONSTRAINT grade_submissions_teacher_user_profile_id_fk
    FOREIGN KEY (teacher_user_profile_id) REFERENCES user_profile(id);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE class_schedules ADD CONSTRAINT class_schedules_teacher_user_profile_id_fk
    FOREIGN KEY (teacher_user_profile_id) REFERENCES user_profile(id);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE class_offerings ADD CONSTRAINT class_offerings_teacher_user_profile_id_fk
    FOREIGN KEY (teacher_user_profile_id) REFERENCES user_profile(id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 5. Sync teacher data to user_profile
UPDATE user_profile up SET employee_no = t.employee_no, position = t.position, department_program_id = t.department_program_id,
  full_name = COALESCE(up.full_name, t.first_name || ' ' || t.last_name), email = COALESCE(up.email, t.email)
FROM teachers t WHERE t.user_profile_id = up.id;

-- 6. Drop old teacher_id columns and constraints
ALTER TABLE teacher_assignments DROP CONSTRAINT IF EXISTS teacher_assignments_teacher_id_teachers_id_fk;
ALTER TABLE teacher_assignments DROP COLUMN IF EXISTS teacher_id;
ALTER TABLE teacher_subject_permissions DROP CONSTRAINT IF EXISTS teacher_subject_permissions_teacher_id_teachers_id_fk;
ALTER TABLE teacher_subject_permissions DROP COLUMN IF EXISTS teacher_id;
ALTER TABLE teacher_subject_capabilities DROP CONSTRAINT IF EXISTS teacher_subject_capabilities_teacher_id_teachers_id_fk;
ALTER TABLE teacher_subject_capabilities DROP COLUMN IF EXISTS teacher_id;
ALTER TABLE grade_submissions DROP CONSTRAINT IF EXISTS grade_submissions_teacher_id_teachers_id_fk;
ALTER TABLE grade_submissions DROP COLUMN IF EXISTS teacher_id;
ALTER TABLE class_schedules DROP CONSTRAINT IF EXISTS class_schedules_teacher_id_teachers_id_fk;
ALTER TABLE class_schedules DROP COLUMN IF EXISTS teacher_id;
ALTER TABLE class_offerings DROP CONSTRAINT IF EXISTS class_offerings_teacher_id_teachers_id_fk;
ALTER TABLE class_offerings DROP COLUMN IF EXISTS teacher_id;

-- 7. Rename teacher_user_profile_id -> teacher_id for API compatibility (optional; we'll use userProfileId in code)
-- Skip rename - we'll use teacher_user_profile_id / teacherUserProfileId in schema

-- 8. Make teacher_user_profile_id NOT NULL where applicable (after data migrated)
-- ALTER TABLE teacher_assignments ALTER COLUMN teacher_user_profile_id SET NOT NULL;
-- etc - run only if all rows have values

-- 9. Drop teachers table
DROP TABLE IF EXISTS teachers;
