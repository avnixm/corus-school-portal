"use server";

import { revalidatePath } from "next/cache";
import { hasActiveFinanceHoldForEnrollment, insertAuditLog } from "@/db/queries";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { enrollmentFinanceStatus } from "@/db/schema";
import { eq } from "drizzle-orm";

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
    revalidatePath("/registrar/enrollments");
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
    revalidatePath("/registrar/enrollments");
    return { success: true };
  } catch (e) {
    return { error: "Failed to put on hold" };
  }
}
