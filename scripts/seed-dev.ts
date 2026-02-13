import "dotenv/config";
import { db } from "@/lib/db";
import {
  schoolYears,
  terms,
  students,
  enrollments,
} from "@/db/schema";

async function main() {
  const [sy] = await db
    .insert(schoolYears)
    .values({
      name: "2025-2026",
      isActive: true,
    })
    .onConflictDoNothing()
    .returning();

  const [term] = await db
    .insert(terms)
    .values({
      schoolYearId: sy.id,
      name: "2nd Sem",
    })
    .onConflictDoNothing()
    .returning();

  const [student] = await db
    .insert(students)
    .values({
      firstName: "Juan",
      lastName: "Dela Cruz",
      program: "BSIT",
      yearLevel: "2",
    })
    .returning();

  await db.insert(enrollments).values({
    studentId: student.id,
    schoolYearId: sy.id,
    termId: term.id,
    course: "BSIT",
    yearLevel: "2",
  });

  console.log("Seed data inserted.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

