"use server";

import { revalidatePath } from "next/cache";
import {
  postPayment,
  voidPayment,
  searchStudentsByCodeOrName,
  getApprovedEnrollmentsByStudent,
} from "@/lib/finance/queries";
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
    });
    revalidatePath("/finance/payments");
    revalidatePath("/finance/balances");
    revalidatePath("/finance");
    revalidatePath("/student");
    revalidatePath("/student/billing");
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
    return { success: true };
  } catch (e) {
    return { error: "Failed to void payment" };
  }
}
