import { db } from "@/lib/db";
import {
  enrollmentFinanceStatus,
  ledgerEntries,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Recomputes the enrollment balance from ledger entries (debit - credit)
 * and updates enrollment_finance_status with balance and derived status.
 * Status: paid (balance <= 0), partially_paid, or assessed.
 */
export async function recomputeEnrollmentBalance(
  enrollmentId: string,
  updatedByUserId?: string
) {
  const [sum] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${ledgerEntries.debit}::numeric - ${ledgerEntries.credit}::numeric), 0)`,
    })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.enrollmentId, enrollmentId));

  const balance = sum?.total ?? "0";
  const balanceNum = parseFloat(balance);

  let status: "unassessed" | "assessed" | "partially_paid" | "paid" | "cleared" | "hold" = "assessed";
  if (balanceNum <= 0) {
    status = "paid";
  } else {
    const [hasPayments] = await db
      .select({ id: ledgerEntries.id })
      .from(ledgerEntries)
      .where(
        and(
          eq(ledgerEntries.enrollmentId, enrollmentId),
          eq(ledgerEntries.entryType, "payment")
        )
      )
      .limit(1);
    status = hasPayments ? "partially_paid" : "assessed";
  }

  const [existing] = await db
    .select()
    .from(enrollmentFinanceStatus)
    .where(eq(enrollmentFinanceStatus.enrollmentId, enrollmentId))
    .limit(1);

  const now = new Date();
  if (existing) {
    await db
      .update(enrollmentFinanceStatus)
      .set({
        balance,
        status,
        updatedByUserId: updatedByUserId ?? existing.updatedByUserId,
        updatedAt: now,
      })
      .where(eq(enrollmentFinanceStatus.enrollmentId, enrollmentId));
  } else {
    await db.insert(enrollmentFinanceStatus).values({
      enrollmentId,
      status,
      balance,
      updatedByUserId,
      updatedAt: now,
    });
  }
}
