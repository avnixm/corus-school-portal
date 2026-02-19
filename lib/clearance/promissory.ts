import { db } from "@/lib/db";
import { promissoryNotes } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function createPromissoryNote(
  params: {
    enrollmentId: string;
    studentId: string;
    periodId: string;
    amountPromised: string;
    dueDate: string;
    reason: string;
    financeRemarks?: string | null;
  },
  createdByUserId: string
) {
  const [inserted] = await db
    .insert(promissoryNotes)
    .values({
      enrollmentId: params.enrollmentId,
      studentId: params.studentId,
      periodId: params.periodId,
      amountPromised: params.amountPromised,
      dueDate: params.dueDate,
      reason: params.reason,
      financeRemarks: params.financeRemarks ?? null,
      status: "draft",
      createdByUserId,
    })
    .returning();
  return inserted;
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
