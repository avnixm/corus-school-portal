import { db } from "@/lib/db";
import { enrollmentFinanceStatus } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Ensures an enrollment has a finance status record.
 * Inserts with status="unassessed", balance=0 if not exists.
 */
export async function ensureEnrollmentFinanceStatus(enrollmentId: string) {
  const [existing] = await db
    .select()
    .from(enrollmentFinanceStatus)
    .where(eq(enrollmentFinanceStatus.enrollmentId, enrollmentId))
    .limit(1);

  if (!existing) {
    await db.insert(enrollmentFinanceStatus).values({
      enrollmentId,
      status: "unassessed",
      balance: "0",
    });
  }
}
