// path: app/(portal)/finance/fee-setup/fee-setups/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireFinance } from "@/lib/fees/permissions";
import {
  createFeeSetup,
  updateFeeSetup,
  addFeeSetupLine,
  updateFeeSetupLine,
  deleteFeeSetupLine,
  getFeeSetupById,
  getFeeSetupWithDetails,
  getFeeSetupApprovalByFeeSetupId,
  upsertFeeSetupApproval,
  getFeeSetupLinesByFeeSetupId,
} from "@/db/queries";
import { insertAuditLog } from "@/db/queries";

const DEFAULT_MISC_LABELS = [
  "Athletic Fee",
  "Audio Visual Fee",
  "Internet Fee",
  "Guidance and Counselling Fee",
  "Library Fee",
  "Medical Fee",
  "Registration Fee",
  "Identification Card",
  "Insurance Fee",
  "Student Activity Fee",
  "Library ID Card",
  "Publication",
  "Recollection Fee",
  "CEAP ACS Membership",
];

export async function createFeeSetupDraft(payload: {
  programId: string;
  yearLevel?: string | null;
  schoolYearId?: string | null;
  termId?: string | null;
  tuitionPerUnit?: string;
  notes?: string | null;
}) {
  const { error, userId } = await requireFinance();
  if (error) return { error };
  const row = await createFeeSetup({
    ...payload,
    createdByUserId: userId ?? undefined,
  });
  if (!row) return { error: "Failed to create fee setup" };
  await insertAuditLog({
    actorUserId: userId!,
    action: "fee_setup_create",
    entityType: "fee_setup",
    entityId: row.id,
    after: { status: "draft" },
  });
  revalidatePath("/finance/fee-setup");
  return { success: true, id: row.id };
}

export async function updateFeeSetupDraft(
  id: string,
  payload: {
    programId?: string;
    yearLevel?: string | null;
    schoolYearId?: string | null;
    termId?: string | null;
    tuitionPerUnit?: string;
    notes?: string | null;
  }
) {
  const { error } = await requireFinance();
  if (error) return { error };
  const setup = await getFeeSetupById(id);
  if (!setup || (setup.status !== "draft" && setup.status !== "rejected")) {
    return { error: "Can only edit draft or rejected fee setups" };
  }
  await updateFeeSetup(id, payload);
  revalidatePath("/finance/fee-setup");
  revalidatePath(`/finance/fee-setup/${id}`);
  return { success: true };
}

export async function addFeeSetupLineAction(payload: {
  feeSetupId: string;
  lineType: "lab_fee" | "misc_fee" | "other_fee";
  label: string;
  amount: string;
  qty?: number;
  sortOrder?: number;
}) {
  const { error } = await requireFinance();
  if (error) return { error };
  const setup = await getFeeSetupById(payload.feeSetupId);
  if (!setup || (setup.status !== "draft" && setup.status !== "rejected")) {
    return { error: "Can only edit draft or rejected fee setups" };
  }
  const row = await addFeeSetupLine(payload);
  revalidatePath("/finance/fee-setup");
  revalidatePath(`/finance/fee-setup/${payload.feeSetupId}`);
  return { success: true, id: row?.id };
}

export async function updateFeeSetupLineAction(
  lineId: string,
  payload: { label?: string; amount?: string; qty?: number; sortOrder?: number },
  feeSetupId?: string
) {
  const { error } = await requireFinance();
  if (error) return { error };
  await updateFeeSetupLine(lineId, payload);
  revalidatePath("/finance/fee-setup");
  if (feeSetupId) revalidatePath(`/finance/fee-setup/${feeSetupId}`);
  return { success: true };
}

export async function deleteFeeSetupLineAction(lineId: string, feeSetupId: string) {
  const { error } = await requireFinance();
  if (error) return { error };
  await deleteFeeSetupLine(lineId);
  revalidatePath("/finance/fee-setup");
  revalidatePath(`/finance/fee-setup/${feeSetupId}`);
  return { success: true };
}

export async function submitFeeSetupForApproval(feeSetupId: string) {
  const { error, userId } = await requireFinance();
  if (error) return { error };
  const setup = await getFeeSetupById(feeSetupId);
  if (!setup || setup.status !== "draft") {
    return { error: "Only draft fee setups can be submitted" };
  }
  const lines = await getFeeSetupLinesByFeeSetupId(feeSetupId);
  const hasLabOrMisc = lines.some(
    (l) => l.lineType === "lab_fee" || l.lineType === "misc_fee" || l.lineType === "other_fee"
  );
  if (!hasLabOrMisc && parseFloat(setup.tuitionPerUnit ?? "0") <= 0) {
    return { error: "Add at least one fee line or set tuition per unit" };
  }
  await updateFeeSetup(feeSetupId, { status: "pending_program_head" });
  await upsertFeeSetupApproval(feeSetupId, {
    programHeadStatus: "pending",
    deanStatus: "pending",
    programHeadRemarks: null,
    deanRemarks: null,
  });
  await insertAuditLog({
    actorUserId: userId!,
    action: "fee_setup_submit",
    entityType: "fee_setup",
    entityId: feeSetupId,
    after: { status: "pending_program_head" },
  });
  revalidatePath("/finance/fee-setup");
  revalidatePath(`/finance/fee-setup/${feeSetupId}`);
  return { success: true };
}

export async function seedDefaultMiscLines(feeSetupId: string) {
  const { error } = await requireFinance();
  if (error) return { error };
  const setup = await getFeeSetupById(feeSetupId);
  if (!setup || (setup.status !== "draft" && setup.status !== "rejected")) {
    return { error: "Can only edit draft or rejected fee setups" };
  }
  const lines = await getFeeSetupLinesByFeeSetupId(feeSetupId);
  const existingLabels = new Set(lines.map((l) => l.label));
  let added = 0;
  for (let i = 0; i < DEFAULT_MISC_LABELS.length; i++) {
    const label = DEFAULT_MISC_LABELS[i];
    if (existingLabels.has(label)) continue;
    await addFeeSetupLine({
      feeSetupId,
      lineType: "misc_fee",
      label,
      amount: "0",
      sortOrder: lines.length + added,
    });
    added++;
  }
  revalidatePath("/finance/fee-setup");
  revalidatePath(`/finance/fee-setup/${feeSetupId}`);
  return { success: true, added };
}

export async function cloneFeeSetup(feeSetupId: string) {
  const { error, userId } = await requireFinance();
  if (error) return { error };
  const details = await getFeeSetupWithDetails(feeSetupId);
  if (!details) return { error: "Fee setup not found" };
  const { setup, lines } = details;
  const newSetup = await createFeeSetup({
    programId: setup.programId!,
    yearLevel: setup.yearLevel,
    schoolYearId: setup.schoolYearId,
    termId: setup.termId,
    tuitionPerUnit: setup.tuitionPerUnit ?? "0",
    notes: `Cloned from ${setup.id}`,
    createdByUserId: userId ?? undefined,
  });
  if (!newSetup) return { error: "Failed to clone" };
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    await addFeeSetupLine({
      feeSetupId: newSetup.id,
      lineType: l.lineType,
      label: l.label,
      amount: l.amount,
      qty: l.qty,
      perUnit: l.perUnit,
      sortOrder: i,
    });
  }
  revalidatePath("/finance/fee-setup");
  redirect(`/finance/fee-setup/${newSetup.id}`);
}
