// path: app/(portal)/program-head/fees/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { requireProgramHead, canProgramHeadApproveFeeSetup } from "@/lib/fees/permissions";
import {
  getFeeSetupById,
  updateFeeSetup,
  upsertFeeSetupApproval,
  getFeeSetupWithDetails,
} from "@/db/queries";
import { insertAuditLog } from "@/db/queries";
import { db } from "@/lib/db";
import { programs } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function approveFeeSetupAsProgramHead(feeSetupId: string) {
  const { error, userId } = await requireProgramHead();
  if (error) return { error };

  const setup = await getFeeSetupById(feeSetupId);
  if (!setup || setup.status !== "pending_program_head") {
    return { error: "Fee setup not pending program head approval" };
  }

  const [prog] = await db
    .select({ code: programs.code })
    .from(programs)
    .where(eq(programs.id, setup.programId!))
    .limit(1);
  const programCode = prog?.code ?? "";
  const canApprove = await canProgramHeadApproveFeeSetup(userId!, programCode);
  if (!canApprove) {
    return { error: "You are not assigned to approve this program" };
  }

  await updateFeeSetup(feeSetupId, { status: "pending_dean" });
  await upsertFeeSetupApproval(feeSetupId, {
    programHeadStatus: "approved",
    programHeadByUserId: userId ?? undefined,
    programHeadAt: new Date(),
    programHeadRemarks: null,
  });

  await insertAuditLog({
    actorUserId: userId!,
    action: "fee_setup_program_head_approve",
    entityType: "fee_setup",
    entityId: feeSetupId,
    after: { programHeadStatus: "approved" },
  });

  revalidatePath("/program-head/fees");
  revalidatePath("/finance/fee-setup");
  return { success: true };
}

export async function rejectFeeSetupAsProgramHead(
  feeSetupId: string,
  remarks: string
) {
  const { error, userId } = await requireProgramHead();
  if (error) return { error };

  const setup = await getFeeSetupById(feeSetupId);
  if (!setup || setup.status !== "pending_program_head") {
    return { error: "Fee setup not pending program head approval" };
  }

  const [prog] = await db
    .select({ code: programs.code })
    .from(programs)
    .where(eq(programs.id, setup.programId!))
    .limit(1);
  const programCode = prog?.code ?? "";
  const canApprove = await canProgramHeadApproveFeeSetup(userId!, programCode);
  if (!canApprove) {
    return { error: "You are not assigned to approve this program" };
  }

  await updateFeeSetup(feeSetupId, { status: "rejected" });
  await upsertFeeSetupApproval(feeSetupId, {
    programHeadStatus: "rejected",
    programHeadByUserId: userId ?? undefined,
    programHeadAt: new Date(),
    programHeadRemarks: remarks || null,
  });

  await insertAuditLog({
    actorUserId: userId!,
    action: "fee_setup_program_head_reject",
    entityType: "fee_setup",
    entityId: feeSetupId,
    after: { programHeadStatus: "rejected", remarks },
  });

  revalidatePath("/program-head/fees");
  revalidatePath("/finance/fee-setup");
  return { success: true };
}
