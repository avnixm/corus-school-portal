#!/usr/bin/env npx tsx
/**
 * Migrate teachers table → user_profile (role=teacher, active=true).
 * Run: npx tsx scripts/run-teacher-migration.ts
 */
import { Pool } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL in .env.local");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function run(sql: string, label?: string) {
  if (label) console.log(`▶ ${label}`);
  try {
    await pool.query(sql);
    if (label) console.log(`  ✓ done`);
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err.code === "42P07") {
      console.log("  (teachers table already dropped, ok)");
    } else if (err.code === "42703") {
      console.log("  (column/constraint may not exist, ok)");
    } else {
      throw e;
    }
  }
}

async function main() {
  console.log("Starting teacher → user_profile migration...\n");

  // 0. Drop old teacher_id FK constraints (IF EXISTS, so no error if already gone)
  console.log("0. Dropping old teacher_id constraints...");
  const tbls = ["teacher_assignments", "teacher_subject_permissions", "teacher_subject_capabilities", "grade_submissions", "class_schedules", "class_offerings"];
  for (const tbl of tbls) {
    await run(`ALTER TABLE ${tbl} DROP CONSTRAINT IF EXISTS ${tbl}_teacher_id_teachers_id_fk`);
    await run(`ALTER TABLE ${tbl} DROP CONSTRAINT IF EXISTS ${tbl}_teacher_id_fkey`);
  }

  // 1. Add teacher columns to user_profile
  await run(
    `ALTER TABLE "user_profile" ADD COLUMN IF NOT EXISTS "employee_no" varchar(32)`,
    "1a. Add user_profile.employee_no"
  );
  await run(
    `ALTER TABLE "user_profile" ADD COLUMN IF NOT EXISTS "position" varchar(128)`,
    "1b. Add user_profile.position"
  );
  await run(
    `ALTER TABLE "user_profile" ADD COLUMN IF NOT EXISTS "department_program_id" uuid`,
    "1c. Add user_profile.department_program_id"
  );
  await run(`
    DO $$ BEGIN
      ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_department_program_id_fk"
        FOREIGN KEY ("department_program_id") REFERENCES "public"."programs"("id");
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `, "1d. Add FK for department_program_id");

  // 2. Add teacher_user_profile_id columns
  for (const tbl of ["teacher_assignments", "teacher_subject_permissions", "teacher_subject_capabilities", "grade_submissions", "class_schedules", "class_offerings"]) {
    await run(
      `ALTER TABLE "${tbl}" ADD COLUMN IF NOT EXISTS "teacher_user_profile_id" uuid`,
      `2. Add ${tbl}.teacher_user_profile_id`
    );
  }

  // 3. Migrate data (only if teachers table exists and teacher_id columns exist)
  const hasTeachers = await pool.query(
    `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teachers') as ok`
  ).then((r) => r.rows[0]?.ok);
  const hasTeacherId = await pool.query(
    `SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_assignments' AND column_name = 'teacher_id') as ok`
  ).then((r) => r.rows[0]?.ok);

  if (hasTeachers && hasTeacherId) {
    console.log("\n3. Migrating data from teachers to user_profile...");

    // Teachers with user_profile_id
    await run(`
      UPDATE teacher_assignments ta SET teacher_user_profile_id = t.user_profile_id
      FROM teachers t WHERE ta.teacher_id = t.id AND t.user_profile_id IS NOT NULL AND ta.teacher_user_profile_id IS NULL
    `, "  teacher_assignments (via user_profile_id)");
    await run(`
      UPDATE teacher_subject_permissions tsp SET teacher_user_profile_id = t.user_profile_id
      FROM teachers t WHERE tsp.teacher_id = t.id AND t.user_profile_id IS NOT NULL AND tsp.teacher_user_profile_id IS NULL
    `, "  teacher_subject_permissions (via user_profile_id)");
    await run(`
      UPDATE teacher_subject_capabilities tsc SET teacher_user_profile_id = t.user_profile_id
      FROM teachers t WHERE tsc.teacher_id = t.id AND t.user_profile_id IS NOT NULL AND tsc.teacher_user_profile_id IS NULL
    `, "  teacher_subject_capabilities (via user_profile_id)");
    await run(`
      UPDATE grade_submissions gs SET teacher_user_profile_id = t.user_profile_id
      FROM teachers t WHERE gs.teacher_id = t.id AND t.user_profile_id IS NOT NULL AND gs.teacher_user_profile_id IS NULL
    `, "  grade_submissions (via user_profile_id)");
    await run(`
      UPDATE class_schedules cs SET teacher_user_profile_id = t.user_profile_id
      FROM teachers t WHERE cs.teacher_id = t.id AND t.user_profile_id IS NOT NULL AND cs.teacher_user_profile_id IS NULL
    `, "  class_schedules (via user_profile_id)");
    await run(`
      UPDATE class_offerings co SET teacher_user_profile_id = t.user_profile_id
      FROM teachers t WHERE co.teacher_id = t.id AND t.user_profile_id IS NOT NULL AND co.teacher_user_profile_id IS NULL
    `, "  class_offerings (via user_profile_id)");

    // Create user_profiles for teachers without user_profile_id
    await run(`
      INSERT INTO user_profile (id, user_id, email, full_name, role, active, employee_no, position, department_program_id)
      SELECT gen_random_uuid(), COALESCE(t.user_id, 'legacy-' || t.id), t.email,
             t.first_name || ' ' || COALESCE(t.last_name, ''), 'teacher', t.active,
             t.employee_no, t.position, t.department_program_id
      FROM teachers t WHERE t.user_profile_id IS NULL
        AND t.user_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM user_profile up WHERE up.user_id = t.user_id)
    `, "  Create user_profiles for teachers without");

    // Link teachers by user_id
    await run(`UPDATE teachers t SET user_profile_id = up.id FROM user_profile up WHERE up.user_id = t.user_id AND up.role = 'teacher' AND t.user_profile_id IS NULL`);

    // Re-run migration for rows that now have user_profile_id
    await run(`
      UPDATE teacher_assignments ta SET teacher_user_profile_id = t.user_profile_id
      FROM teachers t WHERE ta.teacher_id = t.id AND ta.teacher_user_profile_id IS NULL AND t.user_profile_id IS NOT NULL
    `);
    await run(`
      UPDATE teacher_subject_permissions tsp SET teacher_user_profile_id = t.user_profile_id
      FROM teachers t WHERE tsp.teacher_id = t.id AND tsp.teacher_user_profile_id IS NULL AND t.user_profile_id IS NOT NULL
    `);
    await run(`
      UPDATE teacher_subject_capabilities tsc SET teacher_user_profile_id = t.user_profile_id
      FROM teachers t WHERE tsc.teacher_id = t.id AND tsc.teacher_user_profile_id IS NULL AND t.user_profile_id IS NOT NULL
    `);
    await run(`
      UPDATE grade_submissions gs SET teacher_user_profile_id = t.user_profile_id
      FROM teachers t WHERE gs.teacher_id = t.id AND gs.teacher_user_profile_id IS NULL AND t.user_profile_id IS NOT NULL
    `);
    await run(`
      UPDATE class_schedules cs SET teacher_user_profile_id = t.user_profile_id
      FROM teachers t WHERE cs.teacher_id = t.id AND cs.teacher_user_profile_id IS NULL AND t.user_profile_id IS NOT NULL
    `);
    await run(`
      UPDATE class_offerings co SET teacher_user_profile_id = t.user_profile_id
      FROM teachers t WHERE co.teacher_id = t.id AND co.teacher_user_profile_id IS NULL AND t.user_profile_id IS NOT NULL
    `);

    // Sync teacher data to user_profile
    await run(`
      UPDATE user_profile up SET employee_no = t.employee_no, position = t.position, department_program_id = t.department_program_id,
        full_name = COALESCE(up.full_name, t.first_name || ' ' || t.last_name), email = COALESCE(up.email, t.email)
      FROM teachers t WHERE t.user_profile_id = up.id
    `, "  Sync teacher data to user_profile");
  } else {
    console.log("\n3. Skipping data migration (teachers table or teacher_id column not found)");
  }

  // 4. Add FK constraints
  const fks: [string, string, string?][] = [
    ["teacher_assignments", "teacher_assignments_teacher_user_profile_id_fk", undefined],
    ["teacher_subject_permissions", "teacher_subject_permissions_teacher_user_profile_id_fk", "ON DELETE CASCADE"],
    ["teacher_subject_capabilities", "teacher_subject_capabilities_teacher_user_profile_id_fk", "ON DELETE CASCADE"],
    ["grade_submissions", "grade_submissions_teacher_user_profile_id_fk", undefined],
    ["class_schedules", "class_schedules_teacher_user_profile_id_fk", undefined],
    ["class_offerings", "class_offerings_teacher_user_profile_id_fk", undefined],
  ];
  for (const [tbl, cname, extra] of fks) {
    const extraClause = extra ? ` ${extra}` : "";
    await run(`
      DO $$ BEGIN
        ALTER TABLE ${tbl} ADD CONSTRAINT ${cname}
          FOREIGN KEY (teacher_user_profile_id) REFERENCES user_profile(id)${extraClause};
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `, `4. Add FK ${tbl}`);
  }

  // 5. Drop teacher_id columns (drop constraints first, then column)
  const tables = ["teacher_assignments", "teacher_subject_permissions", "teacher_subject_capabilities", "grade_submissions", "class_schedules", "class_offerings"];
  for (const tbl of tables) {
    await run(`
      DO $$ DECLARE r RECORD;
      BEGIN
        FOR r IN (
          SELECT conname FROM pg_constraint
          WHERE conrelid = '${tbl}'::regclass AND contype = 'f'
          AND (conname LIKE '%teacher_id%' OR pg_get_constraintdef(oid) LIKE '%teacher_id%')
        ) LOOP
          EXECUTE format('ALTER TABLE ${tbl} DROP CONSTRAINT IF EXISTS %I', r.conname);
        END LOOP;
      END $$;
    `);
    await run(`ALTER TABLE ${tbl} DROP COLUMN IF EXISTS teacher_id`, `5. Drop ${tbl}.teacher_id`);
  }

  // 6. Drop teachers table
  await run(`DROP TABLE IF EXISTS teachers`, "6. Drop teachers table");

  console.log("\n✅ Migration complete.");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
