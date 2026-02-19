"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import { approvePromissoryNote, rejectPromissoryNote } from "@/lib/clearance/promissory";

async function checkAuth() {
  const result = await requireRole(["dean", "admin"]);
  if ("error" in result) return { error: result.error as "Unauthorized", userId: null };
  return { error: null, userId: result.userId };
}

export async function approvePromissoryNoteAction(noteId: string, deanRemarks?: string | null) {
  const { error, userId } = await checkAuth();
  if (error || !userId) return { error: error ?? "Unauthorized" };

  const result = await approvePromissoryNote(noteId, userId, deanRemarks);
  if ("error" in result) return result;
  revalidatePath("/dean/promissory-notes");
  revalidatePath(`/dean/promissory-notes/${noteId}`);
  revalidatePath("/finance/clearance");
  return { success: true };
}

export async function rejectPromissoryNoteAction(noteId: string, deanRemarks?: string | null) {
  const { error, userId } = await checkAuth();
  if (error || !userId) return { error: error ?? "Unauthorized" };

  const result = await rejectPromissoryNote(noteId, userId, deanRemarks);
  if ("error" in result) return result;
  revalidatePath("/dean/promissory-notes");
  revalidatePath(`/dean/promissory-notes/${noteId}`);
  return { success: true };
}
