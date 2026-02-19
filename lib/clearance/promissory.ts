import { db } from "@/lib/db";
import { promissoryNotes, gradingPeriods } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  generateInstallmentSchedule,
  getFinalDueDate,
} from "@/lib/clearance/installmentSchedule";

export type InstallmentScheduleItem = {
  sequence: number;
  dueDate: string;
  amount: string;
};

export async function createPromissoryNote(
  params: {
    enrollmentId: string;
    studentId: string;
    periodId: string;
    totalOutstandingAmount: string;
    totalPromisedAmount: string;
    installmentMonths: number;
    startDate: string;
    reason: string;
    financeRemarks?: string | null;
  },
  createdByUserId: string
): Promise<{ id: string } | { error: string }> {
  const [selectedPeriod] = await db
    .select({ termId: gradingPeriods.termId })
    .from(gradingPeriods)
    .where(eq(gradingPeriods.id, params.periodId))
    .limit(1);
  if (!selectedPeriod) return { error: "Invalid period" };

  const [existing] = await db
    .select({ id: promissoryNotes.id })
    .from(promissoryNotes)
    .innerJoin(gradingPeriods, eq(promissoryNotes.periodId, gradingPeriods.id))
    .where(
      and(
        eq(promissoryNotes.enrollmentId, params.enrollmentId),
        eq(gradingPeriods.termId, selectedPeriod.termId)
      )
    )
    .limit(1);
  if (existing) return { error: "A promissory note already exists for this semester" };

  const months = Math.max(1, Math.min(6, params.installmentMonths));
  const start = new Date(params.startDate);
  const schedule = generateInstallmentSchedule(params.totalPromisedAmount, start, months);
  const finalDue = getFinalDueDate(start, months);
  const finalDueStr = finalDue.toISOString().slice(0, 10);

  const sumSchedule = schedule.reduce((s, i) => s + parseFloat(i.amount), 0).toFixed(2);
  if (Math.abs(parseFloat(sumSchedule) - parseFloat(params.totalPromisedAmount)) > 0.005) {
    return { error: "Schedule sum does not match total promised amount" };
  }

  const [inserted] = await db
    .insert(promissoryNotes)
    .values({
      enrollmentId: params.enrollmentId,
      studentId: params.studentId,
      periodId: params.periodId,
      amountPromised: params.totalPromisedAmount,
      dueDate: finalDueStr,
      totalOutstandingAmount: params.totalOutstandingAmount,
      totalPromisedAmount: params.totalPromisedAmount,
      installmentMonths: months,
      installmentSchedule: schedule as unknown as Record<string, unknown>[],
      startDate: params.startDate,
      finalDueDate: finalDueStr,
      reason: params.reason,
      financeRemarks: params.financeRemarks ?? null,
      status: "draft",
      createdByUserId,
    })
    .returning();
  return inserted ? { id: inserted.id } : { error: "Failed to create promissory note" };
}

export async function submitPromissoryNote(
  noteId: string,
  _userId: string
): Promise<{ success: true; note: typeof promissoryNotes.$inferSelect } | { error: string }> {
  const [note] = await db
    .select()
    .from(promissoryNotes)
    .where(eq(promissoryNotes.id, noteId))
    .limit(1);
  if (!note) return { error: "Promissory note not found" };
  if (note.status !== "draft") return { error: "Note is not in draft status" };

  const [updated] = await db
    .update(promissoryNotes)
    .set({ status: "submitted", submittedAt: new Date(), updatedAt: new Date() })
    .where(eq(promissoryNotes.id, noteId))
    .returning();
  return updated ? { success: true, note: updated } : { error: "Update failed" };
}

export async function approvePromissoryNote(
  noteId: string,
  deanUserId: string,
  deanRemarks?: string | null
): Promise<{ success: true } | { error: string }> {
  const [note] = await db
    .select()
    .from(promissoryNotes)
    .where(eq(promissoryNotes.id, noteId))
    .limit(1);
  if (!note) return { error: "Promissory note not found" };
  if (note.status !== "submitted") return { error: "Note is not submitted" };

  await db
    .update(promissoryNotes)
    .set({
      status: "approved",
      deanByUserId: deanUserId,
      deanAt: new Date(),
      deanRemarks: deanRemarks ?? null,
      updatedAt: new Date(),
    })
    .where(eq(promissoryNotes.id, noteId));

  return { success: true };
}

export async function rejectPromissoryNote(
  noteId: string,
  deanUserId: string,
  deanRemarks?: string | null
): Promise<{ success: true } | { error: string }> {
  const [note] = await db
    .select()
    .from(promissoryNotes)
    .where(eq(promissoryNotes.id, noteId))
    .limit(1);
  if (!note) return { error: "Promissory note not found" };
  if (note.status !== "submitted") return { error: "Note is not submitted" };

  await db
    .update(promissoryNotes)
    .set({
      status: "rejected",
      deanByUserId: deanUserId,
      deanAt: new Date(),
      deanRemarks: deanRemarks ?? null,
      updatedAt: new Date(),
    })
    .where(eq(promissoryNotes.id, noteId));

  return { success: true };
}
