"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/db/cache";
import {
  postPayment,
  voidPayment,
  searchStudentsByCodeOrName,
  getApprovedEnrollmentsByStudent,
} from "@/lib/finance/queries";
import { getPromissoryNoteScheduleByEnrollmentId } from "@/lib/clearance/queries";
import type { InstallmentScheduleItem } from "@/lib/clearance/queries";
import { requireRole } from "@/lib/rbac";

async function checkAuth() {
  const result = await requireRole(["finance", "admin"]);
  if ("error" in result) return { error: result.error as "Unauthorized", userId: null };
  return { error: null, userId: result.userId };
}

export async function searchStudentsAction(search: string) {
  const { error } = await checkAuth();
  if (error) return [];
  return searchStudentsByCodeOrName(search);
}

export async function getEnrollmentsForStudentAction(studentId: string) {
  const { error } = await checkAuth();
  if (error) return [];
  return getApprovedEnrollmentsByStudent(studentId);
}

export async function getPromissoryScheduleForEnrollmentAction(
  enrollmentId: string
): Promise<InstallmentScheduleItem[] | null> {
  const { error } = await checkAuth();
  if (error) return null;
  if (!enrollmentId?.trim()) return null;
  return getPromissoryNoteScheduleByEnrollmentId(enrollmentId.trim());
}

export async function postPaymentAction(formData: FormData) {
  const { error, userId } = await checkAuth();
  if (error || !userId) return { error: error ?? "Unauthorized" };

  const studentId = (formData.get("studentId") as string)?.trim();
  const enrollmentId = (formData.get("enrollmentId") as string)?.trim();
  const amount = (formData.get("amount") as string)?.trim();
  const method = (formData.get("method") as string)?.trim() as
    | "cash"
    | "gcash"
    | "bank"
    | "card"
    | "other";
  const remarks = (formData.get("remarks") as string)?.trim() || null;
  const installmentSequenceRaw = (formData.get("installmentSequence") as string)?.trim();
  let installmentSequence: number | undefined;
  if (installmentSequenceRaw !== undefined && installmentSequenceRaw !== "") {
    const n = parseInt(installmentSequenceRaw, 10);
    if (isNaN(n) || n < 1 || n > 6) {
      return { error: "Installment must be 1–6 when posting an installment payment" };
    }
    installmentSequence = n;
  }

  if (!studentId || !enrollmentId || !amount || parseFloat(amount) <= 0) {
    return { error: "Student, enrollment, and valid amount are required" };
  }
  const validMethods = ["cash", "gcash", "bank", "card", "other"];
  if (!validMethods.includes(method)) {
    return { error: "Invalid payment method" };
  }

  try {
    const payment = await postPayment({
      studentId,
      enrollmentId,
      amount,
      method,
      remarks,
      receivedByUserId: userId,
      installmentSequence,
    });
    revalidatePath("/finance/payments");
    revalidatePath("/finance/balances");
    revalidatePath("/finance");
    revalidatePath("/student");
    revalidatePath("/student/billing");
    revalidateTag(CACHE_TAGS.finance(enrollmentId), "max");
    revalidateTag(CACHE_TAGS.studentDashboard(studentId), "max");
    return { success: true, paymentId: payment?.id ?? null };
  } catch (e) {
    return { error: "Failed to post payment" };
  }
}

export async function voidPaymentAction(paymentId: string) {
  const { error, userId } = await checkAuth();
  if (error || !userId) return { error: error ?? "Unauthorized" };

  try {
    const payment = await voidPayment(paymentId, userId);
    if (!payment) return { error: "Payment not found or already voided" };
    revalidatePath("/finance/payments");
    revalidatePath("/finance/balances");
    revalidatePath("/finance");
    revalidatePath("/student");
    revalidatePath("/student/billing");
    if (payment.enrollmentId) {
      revalidateTag(CACHE_TAGS.finance(payment.enrollmentId), "max");
      if (payment.studentId) revalidateTag(CACHE_TAGS.studentDashboard(payment.studentId), "max");
    }
    return { success: true };
  } catch (e) {
    return { error: "Failed to void payment" };
  }
}
