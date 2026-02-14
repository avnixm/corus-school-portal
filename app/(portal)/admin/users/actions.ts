"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import {
  getUserProfileByUserId,
  createUserProfile,
  updateUserProfileRole,
  setUserProfileActive,
  insertAuditLog,
} from "@/db/queries";
import { db } from "@/lib/db";
import { userProfile } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function createUserAction(formData: FormData) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await getUserProfileByUserId(session.user.id);
  if (!profile || profile.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const fullName = (formData.get("fullName") as string)?.trim();
  const role = (formData.get("role") as string)?.trim() as
    | "student"
    | "registrar"
    | "admin"
    | "teacher"
    | "finance"
    | "program_head"
    | "dean";

  if (!email || !password || !fullName || !role) {
    return { error: "Email, password, name, and role are required" };
  }

  const validRoles = [
    "student",
    "registrar",
    "admin",
    "teacher",
    "finance",
    "program_head",
    "dean",
  ];
  if (!validRoles.includes(role)) {
    return { error: "Invalid role" };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const signUpResult = await auth.signUp.email({
    email,
    password,
    name: fullName,
  });

  if (signUpResult.error || !signUpResult.data?.user) {
    return { error: signUpResult.error?.message || "Failed to create user" };
  }

  const authUser = signUpResult.data.user as { id: string };

  await createUserProfile({
    userId: authUser.id,
    email,
    fullName,
    role,
    emailVerificationBypassed: true,
  });

  revalidatePath("/admin/users");
  return { success: true };
}

const VALID_ROLES = [
  "student",
  "registrar",
  "admin",
  "teacher",
  "finance",
  "program_head",
  "dean",
] as const;

export type ValidRole = (typeof VALID_ROLES)[number];

export async function updateUserRoleAction(profileId: string, role: string) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const adminProfile = await getUserProfileByUserId(session.user.id);
  if (!adminProfile || adminProfile.role !== "admin") {
    return { error: "Unauthorized" };
  }

  if (!VALID_ROLES.includes(role as ValidRole)) {
    return { error: "Invalid role" };
  }

  const [target] = await db.select().from(userProfile).where(eq(userProfile.id, profileId)).limit(1);
  const beforeRole = target?.role ?? null;

  await updateUserProfileRole(profileId, role as ValidRole);

  await insertAuditLog({
    actorUserId: session.user.id,
    action: "ROLE_CHANGE",
    entityType: "user_profile",
    entityId: target?.userId ?? profileId,
    before: beforeRole != null ? { role: beforeRole } : null,
    after: { role },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/audit");
  return { success: true };
}

export async function setUserActiveAction(userId: string, active: boolean) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await getUserProfileByUserId(session.user.id);
  if (!profile || profile.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const [target] = await db.select().from(userProfile).where(eq(userProfile.userId, userId)).limit(1);
  const beforeActive = target?.active ?? true;

  await setUserProfileActive(userId, active);

  await insertAuditLog({
    actorUserId: session.user.id,
    action: "USER_ACTIVE",
    entityType: "user_profile",
    entityId: userId,
    before: { active: beforeActive },
    after: { active },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/audit");
  return { success: true };
}

export async function createUserProfileAction(formData: FormData) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await getUserProfileByUserId(session.user.id);
  if (!profile || profile.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const userId = (formData.get("userId") as string)?.trim();
  const role = (formData.get("role") as string)?.trim();
  const name = (formData.get("name") as string)?.trim() || null;
  const email = (formData.get("email") as string)?.trim()?.toLowerCase() || null;

  if (!userId || !role || !VALID_ROLES.includes(role as ValidRole)) {
    return { error: "User ID and a valid role are required" };
  }

  const existing = await getUserProfileByUserId(userId);
  if (existing) {
    return { error: "A profile already exists for this user ID" };
  }

  await createUserProfile({
    userId,
    email: email ?? undefined,
    fullName: name ?? undefined,
    role: role as ValidRole,
    emailVerificationBypassed: true,
  });

  await insertAuditLog({
    actorUserId: session.user.id,
    action: "PROFILE_CREATE",
    entityType: "user_profile",
    entityId: userId,
    after: { userId, role, name, email },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/audit");
  return { success: true };
}

export async function updateUserPasswordAction(
  authUserId: string,
  newPassword: string
) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await getUserProfileByUserId(session.user.id);
  if (!profile || profile.role !== "admin") {
    return { error: "Unauthorized" };
  }

  if (!newPassword || newPassword.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const result = await auth.admin.setUserPassword({
    userId: authUserId,
    newPassword,
  });

  if (result.error) {
    return { error: result.error.message ?? "Failed to update password" };
  }

  revalidatePath("/admin/users");
  return { success: true };
}
