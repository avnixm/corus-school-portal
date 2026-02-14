/**
 * Seed script for testing the registrar portal and student flows.
 * Run: npm run db:seed
 *
 * Creates: school years, terms, students, subjects, sections, enrollments,
 * class schedules, requirements, requirement verifications, announcements,
 * user profiles, and a pending student application.
 *
 * Loads .env.local for DATABASE_URL.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { eq } from "drizzle-orm";
import {
  userProfile,
  programs,
  schoolYears,
  terms,
  students,
  subjects,
  sections,
  classSchedules,
  scheduleDays,
  enrollments,
  requirements,
  requirementVerifications,
  announcements,
  pendingStudentApplications,
} from "@/db/schema";

const SEED_REGISTRAR_USER_ID = "seed-registrar-001";
const SEED_STUDENT_USER_ID = "seed-student-001";

async function main() {
  const { db } = await import("@/lib/db");

  console.log("Seeding dev data...\n");

  // 1. School years
  const [sy1] = await db
    .insert(schoolYears)
    .values({
      name: "2025-2026",
      startDate: "2025-06-01",
      endDate: "2026-03-31",
      isActive: true,
    })
    .returning();

  const [sy2] = await db
    .insert(schoolYears)
    .values({
      name: "2024-2025",
      startDate: "2024-06-01",
      endDate: "2025-03-31",
      isActive: false,
    })
    .returning();

  console.log("  School years: 2025-2026, 2024-2025");

  // 2. Terms
  const [term1] = await db
    .insert(terms)
    .values({
      schoolYearId: sy1.id,
      name: "1st Sem",
      status: "enrollment",
      isActive: true,
    })
    .returning();

  const [term2] = await db
    .insert(terms)
    .values({
      schoolYearId: sy1.id,
      name: "2nd Sem",
      status: "draft",
      isActive: false,
    })
    .returning();

  const [term3] = await db
    .insert(terms)
    .values({
      schoolYearId: sy2.id,
      name: "1st Sem",
      status: "closed",
      isActive: false,
    })
    .returning();

  console.log("  Terms: 1st Sem, 2nd Sem (2025-2026), 1st Sem (2024-2025)");

  // 3. Programs
  const [progBsit] = await db
    .insert(programs)
    .values({ code: "BSIT", name: "Bachelor of Science in Information Technology", active: true })
    .onConflictDoNothing({ target: programs.code })
    .returning();
  const [progBscs] = await db
    .insert(programs)
    .values({ code: "BSCS", name: "Bachelor of Science in Computer Science", active: true })
    .onConflictDoNothing({ target: programs.code })
    .returning();
  const programList = await db.select().from(programs).orderBy(programs.code);
  const programByCode = Object.fromEntries(programList.map((p) => [p.code, p]));
  const bsitId = progBsit?.id ?? programByCode["BSIT"]?.id;
  const bscsId = progBscs?.id ?? programByCode["BSCS"]?.id;
  console.log("  Programs: BSIT, BSCS");

  // 4. User profiles (for pending application flow)
  const [registrarProfile] = await db
    .insert(userProfile)
    .values({
      userId: SEED_REGISTRAR_USER_ID,
      email: "registrar@test.local",
      fullName: "Registrar Test",
      role: "registrar",
    })
    .onConflictDoNothing({ target: userProfile.userId })
    .returning();

  const [studentProfile] = await db
    .insert(userProfile)
    .values({
      userId: SEED_STUDENT_USER_ID,
      email: "student.pending@test.local",
      fullName: "Maria Santos",
      role: "student",
    })
    .onConflictDoNothing({ target: userProfile.userId })
    .returning();

  let regProfile = registrarProfile;
  let stuProfile = studentProfile;
  if (!regProfile) {
    const [r] = await db.select().from(userProfile).where(eq(userProfile.userId, SEED_REGISTRAR_USER_ID));
    regProfile = r ?? undefined;
  }
  if (!stuProfile) {
    const [s] = await db.select().from(userProfile).where(eq(userProfile.userId, SEED_STUDENT_USER_ID));
    stuProfile = s ?? undefined;
  }

  if (regProfile) console.log("  User profile: registrar@test.local");
  if (stuProfile) console.log("  User profile: student.pending@test.local");

  // 5. Students
  const [s1] = await db
    .insert(students)
    .values({
      studentCode: "2024-001",
      firstName: "Juan",
      middleName: "Reyes",
      lastName: "Dela Cruz",
      email: "juan.delacruz@test.local",
      contactNo: "09171234567",
      program: "BSIT",
      yearLevel: "2",
    })
    .returning();

  const [s2] = await db
    .insert(students)
    .values({
      studentCode: "2024-002",
      firstName: "Ana",
      middleName: null,
      lastName: "Garcia",
      email: "ana.garcia@test.local",
      contactNo: "09187654321",
      program: "BSCS",
      yearLevel: "1",
    })
    .returning();

  const [s3] = await db
    .insert(students)
    .values({
      studentCode: "2024-003",
      firstName: "Pedro",
      lastName: "Santos",
      program: "BSIT",
      yearLevel: "3",
    })
    .returning();

  const [s4] = await db
    .insert(students)
    .values({
      studentCode: "2025-004",
      firstName: "Carmen",
      middleName: "Luna",
      lastName: "Ramos",
      email: "carmen.ramos@test.local",
      program: "BSIT",
      yearLevel: "1",
    })
    .returning();

  console.log("  Students: 4 created");

  // 6. Subjects
  const subjectData = [
    { code: "CC 101", description: "Introduction to Programming", units: "3" },
    { code: "CC 102", description: "Data Structures", units: "3" },
    { code: "CC 201", description: "Algorithms", units: "3" },
    { code: "GE 101", description: "Purposive Communication", units: "3" },
    { code: "GE 105", description: "Ethics", units: "3" },
    { code: "IT 210", description: "Web Development", units: "3" },
    { code: "MATH 101", description: "Calculus 1", units: "4" },
  ];

  await db
    .insert(subjects)
    .values(subjectData)
    .onConflictDoNothing({ target: subjects.code })
    .returning();

  const subjList = await db.select().from(subjects).orderBy(subjects.code);
  const subjMap = Object.fromEntries(subjList.map((s) => [s.code, s]));
  console.log("  Subjects:", subjList.length);

  // 7. Sections (require programId)
  if (!bsitId) throw new Error("BSIT program required for seed");
  const [sec1] = await db
    .insert(sections)
    .values({
      programId: bsitId,
      name: "1-A",
      yearLevel: "1",
      active: true,
    })
    .returning();

  const [sec2] = await db
    .insert(sections)
    .values({
      programId: bsitId,
      name: "2-B",
      yearLevel: "2",
      active: true,
    })
    .returning();

  const [sec3] = await db
    .insert(sections)
    .values({
      programId: bsitId,
      name: "3-A",
      yearLevel: "3",
      active: true,
    })
    .returning();

  console.log("  Sections: 3 created");

  // 8. Enrollments (mix of pending_approval and approved; require programId)
  const enrollData = [
    { studentId: s1.id, schoolYearId: sy1.id, termId: term1.id, programId: bsitId, program: "BSIT", yearLevel: "2", status: "pending_approval" as const },
    { studentId: s2.id, schoolYearId: sy1.id, termId: term1.id, programId: bscsId!, program: "BSCS", yearLevel: "1", status: "pending_approval" as const },
    { studentId: s3.id, schoolYearId: sy1.id, termId: term1.id, programId: bsitId, program: "BSIT", yearLevel: "3", status: "approved" as const },
    { studentId: s4.id, schoolYearId: sy1.id, termId: term1.id, programId: bsitId, program: "BSIT", yearLevel: "1", status: "approved" as const },
  ];

  for (const e of enrollData) {
    await db
      .insert(enrollments)
      .values(e)
      .onConflictDoNothing({ target: [enrollments.studentId, enrollments.schoolYearId, enrollments.termId] });
  }
  console.log("  Enrollments: 4 (2 pending_approval, 2 approved)");

  // 9. Class schedules
  const cc101 = subjMap["CC 101"];
  const cc102 = subjMap["CC 102"];
  const ge101 = subjMap["GE 101"];
  if (cc101 && cc102 && ge101 && sec1 && sec2) {
    const [sch1] = await db
      .insert(classSchedules)
      .values({
        schoolYearId: sy1.id,
        termId: term1.id,
        sectionId: sec1.id,
        subjectId: cc101.id,
        teacherName: "Dr. Elena Cruz",
        room: "Room 101",
        timeIn: "08:00",
        timeOut: "09:30",
      })
      .returning();

    const [sch2] = await db
      .insert(classSchedules)
      .values({
        schoolYearId: sy1.id,
        termId: term1.id,
        sectionId: sec1.id,
        subjectId: ge101.id,
        teacherName: "Prof. Jose Reyes",
        room: "Room 204",
        timeIn: "10:00",
        timeOut: "11:30",
      })
      .returning();

    const [sch3] = await db
      .insert(classSchedules)
      .values({
        schoolYearId: sy1.id,
        termId: term1.id,
        sectionId: sec2.id,
        subjectId: cc102.id,
        teacherName: "Dr. Maria Lopez",
        room: "Lab 2",
        timeIn: "14:00",
        timeOut: "15:30",
      })
      .returning();

    for (const sch of [sch1, sch2, sch3].filter(Boolean)) {
      if (sch) {
        await db.insert(scheduleDays).values([
          { scheduleId: sch.id, day: "Mon", isActive: true },
          { scheduleId: sch.id, day: "Wed", isActive: true },
          { scheduleId: sch.id, day: "Fri", isActive: true },
        ]);
      }
    }
    console.log("  Class schedules: 3 with Mon/Wed/Fri");
  }

  // 9. Requirements (idempotent seed: BIRTH_CERT, FORM_137, FORM_138, GOOD_MORAL + enrollment rules)
  const { seedRequirements } = await import("@/lib/requirements/seed");
  await seedRequirements();
  const allReqs = await db.select().from(requirements);
  console.log("  Requirements:", allReqs.length);

  // 10. Requirement verifications (submitted - for queue)
  if (allReqs.length >= 2 && s1 && s2) {
    await db
      .insert(requirementVerifications)
      .values([
        {
          studentId: s1.id,
          schoolYearId: sy1.id,
          termId: term1.id,
          requirementId: allReqs[0].id,
          status: "submitted",
        },
        {
          studentId: s1.id,
          schoolYearId: sy1.id,
          termId: term1.id,
          requirementId: allReqs[1].id,
          status: "submitted",
        },
        {
          studentId: s2.id,
          schoolYearId: sy1.id,
          termId: term1.id,
          requirementId: allReqs[0].id,
          status: "submitted",
        },
      ])
      .onConflictDoNothing({
        target: [
          requirementVerifications.studentId,
          requirementVerifications.requirementId,
          requirementVerifications.schoolYearId,
          requirementVerifications.termId,
        ],
      });
    console.log("  Requirement verifications: 3 submitted");
  }

  // 11. Announcements
  const createdBy = regProfile?.userId ?? SEED_REGISTRAR_USER_ID;
  await db.insert(announcements).values([
    {
      title: "Enrollment Period Open",
      body: "Enrollment for 1st Sem 2025-2026 is now open. Please complete your registration before the deadline.",
      audience: "students",
      createdByUserId: createdBy,
    },
    {
      title: "Schedule of Classes Available",
      body: "The official schedule of classes has been posted. Check your portal for updates.",
      audience: "all",
      createdByUserId: createdBy,
    },
    {
      title: "Requirements Submission",
      body: "Students with pending requirements are reminded to submit documents before the deadline.",
      audience: "students",
      createdByUserId: createdBy,
    },
  ]);
  console.log("  Announcements: 3");

  // 12. Pending student application (for /registrar/pending)
  if (stuProfile) {
    await db
      .insert(pendingStudentApplications)
      .values({
        userProfileId: stuProfile.id,
        firstName: "Maria",
        middleName: null,
        lastName: "Santos",
        birthday: "2005-03-15",
        program: "BSIT",
        yearLevel: "1",
        street: "123 Main St",
        barangay: "Poblacion",
        municipality: "City",
        province: "Province",
        notes: "Transfer student from XYZ University.",
        status: "pending",
      });
    console.log("  Pending application: 1 (Maria Santos)");
  }

  // 13. System settings for enrollment flow
  const { upsertSystemSetting } = await import("@/db/queries");
  await upsertSystemSetting({
    key: "enrollment_allow_submit_before_requirements",
    value: true,
  });
  console.log("  System setting: enrollment_allow_submit_before_requirements = true");

  console.log("\nSeed complete. Run npm run dev and visit /registrar to test.\n");
  console.log("Tip: To test as registrar, sign up with an account and set its");
  console.log("     user_profile.role to 'registrar' in the database.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
