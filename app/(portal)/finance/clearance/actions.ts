"use server";

import { revalidatePath } from "next/cache";
import { hasActiveFinanceHoldForEnrollment, insertAuditLog } from "@/db/queries";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { enrollmentFinanceStatus } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  getClearanceItemById,
  clearClearanceItem,
  blockClearanceItem,
  signClearanceWithPromissoryNote,
  getTotalsForPromissoryNote,
} from "@/lib/clearance/queries";
import { createPromissoryNote, submitPromissoryNote } from "@/lib/clearance/promissory";

async function checkAuth() {
  const result = await requireRole(["finance", "admin"]);
  if ("error" in result) return { error: result.error as "Unauthorized", userId: null };
  return { error: null, userId: result.userId };
}

export async function markClearedAction(enrollmentId: string) {
  const { error, userId } = await checkAuth();
  if (error || !userId) return { error: error ?? "Unauthorized" };

  const hasHold = await hasActiveFinanceHoldForEnrollment(enrollmentId);
  if (hasHold) {
    return { error: "Cannot clear: active hold on this enrollment" };
  }

  try {
    await db
      .update(enrollmentFinanceStatus)
      .set({
        status: "cleared",
        updatedByUserId: userId,
        updatedAt: new Date(),
      })
      .where(eq(enrollmentFinanceStatus.enrollmentId, enrollmentId));
    await insertAuditLog({
      actorUserId: userId,
      action: "CLEARANCE_MARK_CLEARED",
      entityType: "enrollment_finance_status",
      entityId: enrollmentId,
      after: { enrollmentId, status: "cleared" },
    });
    revalidatePath("/finance/clearance");
    revalidatePath("/finance");
    revalidatePath("/registrar/records/enrollments");
    revalidatePath("/registrar/records");
    return { success: true };
  } catch (e) {
    return { error: "Failed to mark cleared" };
  }
}

export async function putOnHoldAction(enrollmentId: string, reason?: string) {
  const { error, userId } = await checkAuth();
  if (error || !userId) return { error: error ?? "Unauthorized" };

  try {
    await db
      .update(enrollmentFinanceStatus)
      .set({
        status: "hold",
        updatedByUserId: userId,
        updatedAt: new Date(),
      })
      .where(eq(enrollmentFinanceStatus.enrollmentId, enrollmentId));
    revalidatePath("/finance/clearance");
    revalidatePath("/finance");
    revalidatePath("/registrar/records/enrollments");
    revalidatePath("/registrar/records");
    return { success: true };
  } catch (e) {
    return { error: "Failed to put on hold" };
  }
}

export async function clearClearanceItemAction(clearanceItemId: string) {
  const { error, userId } = await checkAuth();
  if (error || !userId) return { error: error ?? "Unauthorized" };

  const item = await getClearanceItemById(clearanceItemId);
  if (!item) return { error: "Item not found" };
  if (item.officeType !== "finance") return { error: "Not a finance item" };

  const result = await clearClearanceItem(clearanceItemId, userId);
  if ("error" in result) return result;
  revalidatePath("/finance/clearance");
  revalidatePath("/finance");
  return { success: true };
}

export async function blockClearanceItemAction(clearanceItemId: string, remarks: string) {
  const { error, userId } = await checkAuth();
  if (error || !userId) return { error: error ?? "Unauthorized" };

  const item = await getClearanceItemById(clearanceItemId);
  if (!item) return { error: "Item not found" };
  if (item.officeType !== "finance") return { error: "Not a finance item" };

  const result = await blockClearanceItem(clearanceItemId, remarks);
  if ("error" in result) return result;
  revalidatePath("/finance/clearance");
  revalidatePath("/finance");
  return { success: true };
}

export async function getTotalsForPromissoryNoteAction(
  enrollmentId: string,
  studentId: string,
  includePreviousBalances: boolean
) {
  const { error } = await checkAuth();
  if (error) return { error: error ?? "Unauthorized" as const };

  const totals = await getTotalsForPromissoryNote(
    enrollmentId,
    studentId,
    includePreviousBalances
  );
  return totals;
}

export async function createPromissoryNoteAction(params: {
  enrollmentId: string;
  studentId: string;
  periodId: string;
  includePreviousBalances?: boolean;
  limitToCurrentTermOnly?: boolean;
  totalOutstandingAmount: string;
  totalPromisedAmount: string;
  installmentMonths: number;
  startDate: string;
  reason: string;
  financeRemarks?: string | null;
}) {
  const { error, userId } = await checkAuth();
  if (error || !userId) return { error: error ?? "Unauthorized" };

  const months = Math.max(1, Math.min(6, params.installmentMonths));
  if (parseFloat(params.totalPromisedAmount) <= 0) {
    return { error: "Total promised amount must be greater than 0" };
  }

  const result = await createPromissoryNote(
    {
      enrollmentId: params.enrollmentId,
      studentId: params.studentId,
      periodId: params.periodId,
      totalOutstandingAmount: params.totalOutstandingAmount,
      totalPromisedAmount: params.totalPromisedAmount,
      installmentMonths: months,
      startDate: params.startDate,
      reason: params.reason,
      financeRemarks: params.financeRemarks ?? null,
    },
    userId
  );
  if ("error" in result) return result;
  revalidatePath("/finance/clearance");
  revalidatePath(`/finance/clearance/${params.enrollmentId}/promissory-note/new`);
  return { success: true as const, noteId: result.id };
}

export async function submitPromissoryNoteAction(noteId: string) {
  const { error, userId } = await checkAuth();
  if (error || !userId) return { error: error ?? "Unauthorized" };

  const result = await submitPromissoryNote(noteId, userId);
  if ("error" in result) return result;
  revalidatePath("/finance/clearance");
  revalidatePath("/dean/promissory-notes");
  return { success: true };
}

export async function signClearanceWithPromissoryNoteAction(itemId: string, noteId: string) {
  const { error, userId } = await checkAuth();
  if (error || !userId) return { error: error ?? "Unauthorized" };

  const result = await signClearanceWithPromissoryNote(itemId, noteId, userId);
  if ("error" in result) return result;
  revalidatePath("/finance/clearance");
  revalidatePath("/finance");
  return { success: true };
}
