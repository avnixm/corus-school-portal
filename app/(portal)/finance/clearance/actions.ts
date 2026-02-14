"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import { getUserProfileByUserId } from "@/db/queries";
import { db } from "@/lib/db";
import { enrollmentFinanceStatus } from "@/db/schema";
import { eq } from "drizzle-orm";

async function checkAuth() {
  const s = (await auth.getSession())?.data;
  if (!s?.user?.id) return { error: "Not authenticated" as const, userId: null };
  const p = await getUserProfileByUserId(s.user.id);
  if (!p || (p.role !== "finance" && p.role !== "admin"))
    return { error: "Unauthorized" as const, userId: null };
  return { error: null, userId: s.user.id };
}

export async function markClearedAction(enrollmentId: string) {
  const { error, userId } = await checkAuth();
  if (error || !userId) return { error: error ?? "Unauthorized" };

  try {
    await db
      .update(enrollmentFinanceStatus)
      .set({
        status: "cleared",
        updatedByUserId: userId,
        updatedAt: new Date(),
      })
      .where(eq(enrollmentFinanceStatus.enrollmentId, enrollmentId));
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
