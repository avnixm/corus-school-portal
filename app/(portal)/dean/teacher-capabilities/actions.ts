"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import {
  listCapabilityPackagesByStatus,
  getCapabilityPackageById,
  listCapabilityLines,
  approveCapabilityPackageDb,
  rejectCapabilityPackageDb,
} from "@/db/queries";

export async function listSubmittedCapabilityPackagesAction() {
  const auth = await requireRole(["dean", "admin"]);
  if ("error" in auth) return { error: auth.error, packages: [] };
  const packages = await listCapabilityPackagesByStatus("submitted");
  return { packages };
}

export async function listApprovedCapabilityPackagesAction() {
  const auth = await requireRole(["dean", "admin"]);
  if ("error" in auth) return { error: auth.error, packages: [] };
  const packages = await listCapabilityPackagesByStatus("approved");
  return { packages };
}

export async function listRejectedCapabilityPackagesAction() {
  const auth = await requireRole(["dean", "admin"]);
  if ("error" in auth) return { error: auth.error, packages: [] };
  const packages = await listCapabilityPackagesByStatus("rejected");
  return { packages };
}

export async function readCapabilityPackageAction(packageId: string) {
  const auth = await requireRole(["dean", "admin"]);
  if ("error" in auth) return { error: auth.error, pkg: null, lines: [] };
  const pkg = await getCapabilityPackageById(packageId);
  if (!pkg) return { error: "Package not found", pkg: null, lines: [] };
  const lines = await listCapabilityLines(packageId);
  return { pkg, lines };
}

export async function approveCapabilityPackageAction(packageId: string) {
  const auth = await requireRole(["dean", "admin"]);
  if ("error" in auth) return { error: auth.error };
  const pkg = await getCapabilityPackageById(packageId);
  if (!pkg || pkg.status !== "submitted") return { error: "Package not pending approval" };
  await approveCapabilityPackageDb(packageId, auth.userId);
  revalidatePath("/dean/teacher-capabilities");
  revalidatePath("/dean/teacher-capabilities/[packageId]");
  return { success: true };
}

export async function rejectCapabilityPackageAction(packageId: string, remarks: string) {
  const auth = await requireRole(["dean", "admin"]);
  if ("error" in auth) return { error: auth.error };
  const pkg = await getCapabilityPackageById(packageId);
  if (!pkg || pkg.status !== "submitted") return { error: "Package not pending approval" };
  await rejectCapabilityPackageDb(packageId, auth.userId, remarks);
  revalidatePath("/dean/teacher-capabilities");
  revalidatePath("/dean/teacher-capabilities/[packageId]");
  return { success: true };
}
