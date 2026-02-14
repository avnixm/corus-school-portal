"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import { getUserProfileByUserId } from "@/db/queries";
import {
  createFeeItem,
  updateFeeItem,
  toggleFeeItemActive,
  createProgramFeeRule,
  updateProgramFeeRule,
  deleteProgramFeeRule,
} from "@/lib/finance/queries";

export async function createFeeItemAction(formData: FormData) {
  const authErr = await (async () => {
    const s = (await auth.getSession())?.data;
    if (!s?.user?.id) return { error: "Not authenticated" };
    const p = await getUserProfileByUserId(s.user.id);
    if (!p || (p.role !== "finance" && p.role !== "admin"))
      return { error: "Unauthorized" };
    return null;
  })();
  if (authErr) return authErr;

  const code = (formData.get("code") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const category = (formData.get("category") as string)?.trim() as "tuition" | "misc" | "other";
  const defaultAmount = (formData.get("defaultAmount") as string)?.trim() || null;

  if (!code || !name) return { error: "Code and name are required" };
  if (!["tuition", "misc", "other"].includes(category)) {
    return { error: "Invalid category" };
  }

  await createFeeItem({ code, name, category, defaultAmount });
  revalidatePath("/finance/fee-setup");
  return { success: true };
}

export async function updateFeeItemAction(id: string, formData: FormData) {
  const s = (await auth.getSession())?.data;
  if (!s?.user?.id) return { error: "Not authenticated" };
  const p = await getUserProfileByUserId(s.user.id);
  if (!p || (p.role !== "finance" && p.role !== "admin"))
    return { error: "Unauthorized" };

  const code = (formData.get("code") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const category = (formData.get("category") as string)?.trim() as "tuition" | "misc" | "other";
  const defaultAmount = (formData.get("defaultAmount") as string)?.trim() || null;

  if (!code || !name) return { error: "Code and name are required" };
  if (!["tuition", "misc", "other"].includes(category)) {
    return { error: "Invalid category" };
  }

  await updateFeeItem(id, { code, name, category, defaultAmount });
  revalidatePath("/finance/fee-setup");
  return { success: true };
}

export async function toggleFeeItemActiveAction(id: string, active: boolean) {
  const s = (await auth.getSession())?.data;
  if (!s?.user?.id) return { error: "Not authenticated" };
  const p = await getUserProfileByUserId(s.user.id);
  if (!p || (p.role !== "finance" && p.role !== "admin"))
    return { error: "Unauthorized" };

  await toggleFeeItemActive(id, active);
  revalidatePath("/finance/fee-setup");
  return { success: true };
}

export async function createProgramFeeRuleAction(formData: FormData) {
  const s = (await auth.getSession())?.data;
  if (!s?.user?.id) return { error: "Not authenticated" };
  const p = await getUserProfileByUserId(s.user.id);
  if (!p || (p.role !== "finance" && p.role !== "admin"))
    return { error: "Unauthorized" };

  const program = (formData.get("program") as string)?.trim();
  const yearLevel = (formData.get("yearLevel") as string)?.trim() || null;
  const schoolYearId = (formData.get("schoolYearId") as string)?.trim() || null;
  const termId = (formData.get("termId") as string)?.trim() || null;
  const feeItemId = (formData.get("feeItemId") as string)?.trim();
  const amount = (formData.get("amount") as string)?.trim();

  if (!program || !feeItemId || !amount) {
    return { error: "Program, fee item, and amount are required" };
  }

  await createProgramFeeRule({
    program,
    yearLevel: yearLevel || null,
    schoolYearId: schoolYearId || null,
    termId: termId || null,
    feeItemId,
    amount,
  });
  revalidatePath("/finance/fee-setup");
  return { success: true };
}

export async function updateProgramFeeRuleAction(id: string, formData: FormData) {
  const s = (await auth.getSession())?.data;
  if (!s?.user?.id) return { error: "Not authenticated" };
  const p = await getUserProfileByUserId(s.user.id);
  if (!p || (p.role !== "finance" && p.role !== "admin"))
    return { error: "Unauthorized" };

  const program = (formData.get("program") as string)?.trim();
  const yearLevel = (formData.get("yearLevel") as string)?.trim() || null;
  const schoolYearId = (formData.get("schoolYearId") as string)?.trim() || null;
  const termId = (formData.get("termId") as string)?.trim() || null;
  const feeItemId = (formData.get("feeItemId") as string)?.trim();
  const amount = (formData.get("amount") as string)?.trim();

  if (!program || !feeItemId || !amount) {
    return { error: "Program, fee item, and amount are required" };
  }

  await updateProgramFeeRule(id, {
    program,
    yearLevel: yearLevel || null,
    schoolYearId: schoolYearId || null,
    termId: termId || null,
    feeItemId,
    amount,
  });
  revalidatePath("/finance/fee-setup");
  return { success: true };
}

export async function deleteProgramFeeRuleAction(id: string) {
  const s = (await auth.getSession())?.data;
  if (!s?.user?.id) return { error: "Not authenticated" };
  const p = await getUserProfileByUserId(s.user.id);
  if (!p || (p.role !== "finance" && p.role !== "admin"))
    return { error: "Unauthorized" };

  await deleteProgramFeeRule(id);
  revalidatePath("/finance/fee-setup");
  return { success: true };
}
