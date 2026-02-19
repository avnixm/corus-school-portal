"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import { getClearanceItemById, clearClearanceItem, blockClearanceItem } from "@/lib/clearance/queries";

async function checkAuth() {
  const result = await requireRole(["program_head", "admin"]);
  if ("error" in result) return { error: result.error as "Unauthorized", userId: null };
  return { error: null, userId: result.userId };
}

export async function clearClearanceItemAction(clearanceItemId: string) {
  const { error, userId } = await checkAuth();
  if (error || !userId) return { error: error ?? "Unauthorized" };

  const item = await getClearanceItemById(clearanceItemId);
  if (!item) return { error: "Item not found" };
  if (item.officeType !== "program_head") return { error: "Not a program head item" };

  const result = await clearClearanceItem(clearanceItemId, userId);
  if ("error" in result) return result;
  revalidatePath("/program-head/clearance");
  revalidatePath("/program-head/finance");
  return { success: true };
}

export async function blockClearanceItemAction(clearanceItemId: string, remarks: string) {
  const { error } = await checkAuth();
  if (error) return { error: error ?? "Unauthorized" };

  const item = await getClearanceItemById(clearanceItemId);
  if (!item) return { error: "Item not found" };
  if (item.officeType !== "program_head") return { error: "Not a program head item" };

  const result = await blockClearanceItem(clearanceItemId, remarks);
  if ("error" in result) return result;
  revalidatePath("/program-head/clearance");
  revalidatePath("/program-head/finance");
  return { success: true };
}
