// path: app/(portal)/dean/fees/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { requireDean } from "@/lib/fees/permissions";
import {
  getFeeSetupById,
  updateFeeSetup,
  upsertFeeSetupApproval,
} from "@/db/queries";
import { insertAuditLog } from "@/db/queries";

export async function approveFeeSetupAsDean(feeSetupId: string) {
  const { error, userId } = await requireDean();
  if (error) return { error };

  const setup = await getFeeSetupById(feeSetupId);
  if (!setup || setup.status !== "pending_dean") {
    return { error: "Fee setup not pending dean approval" };
  }

  await updateFeeSetup(feeSetupId, { status: "approved" });
  await upsertFeeSetupApproval(feeSetupId, {
    deanStatus: "approved",
    deanByUserId: userId ?? undefined,
    deanAt: new Date(),
    deanRemarks: null,
  });

  await insertAuditLog({
    actorUserId: userId!,
    action: "fee_setup_dean_approve",
    entityType: "fee_setup",
    entityId: feeSetupId,
    after: { deanStatus: "approved" },
  });

  revalidatePath("/dean/fees");
  revalidatePath("/finance/fee-setup");
  return { success: true };
}

export async function rejectFeeSetupAsDean(
  feeSetupId: string,
  remarks: string
) {
  const { error, userId } = await requireDean();
  if (error) return { error };

  const setup = await getFeeSetupById(feeSetupId);
  if (!setup || setup.status !== "pending_dean") {
    return { error: "Fee setup not pending dean approval" };
  }

  await updateFeeSetup(feeSetupId, { status: "rejected" });
  await upsertFeeSetupApproval(feeSetupId, {
    deanStatus: "rejected",
    deanByUserId: userId ?? undefined,
    deanAt: new Date(),
    deanRemarks: remarks || null,
  });

  await insertAuditLog({
    actorUserId: userId!,
    action: "fee_setup_dean_reject",
    entityType: "fee_setup",
    entityId: feeSetupId,
    after: { deanStatus: "rejected", remarks },
  });

  revalidatePath("/dean/fees");
  revalidatePath("/finance/fee-setup");
  return { success: true };
}
