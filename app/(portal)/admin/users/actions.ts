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

/** Neon Auth admin APIs require the session user to be "admin" in Neon Auth (set in Neon Console), not just in our app. */
function isNeonAdminPermissionError(message: string): boolean {
  const m = (message || "").toLowerCase();
  return m.includes("not allowed") && (m.includes("update") || m.includes("create") || m.includes("users"));
}

function neonAdminHint(originalMessage: string): string {
  return (
    "Neon Auth rejected this action: your account must be an admin in Neon Auth. " +
    "In Neon Console go to your project → Auth → Users, open your user, and choose “Make admin”. " +
    "Then sign out and sign in again. (" +
    originalMessage +
    ")"
  );
}

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

  // Create user via admin API so they are created with emailVerified: true (no verify step).
  // Auth role is only "user" | "admin"; our app role (student, registrar, etc.) is stored in user_profile.
  const createResult = await auth.admin.createUser({
    email,
    password,
    name: fullName,
    role: "user",
    data: { emailVerified: true },
  });

  if (createResult.error || !createResult.data?.user) {
    const msg = createResult.error?.message ?? "Failed to create user";
    return { error: isNeonAdminPermissionError(msg) ? neonAdminHint(msg) : msg };
  }

  const authUser = createResult.data.user as { id: string };

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

/** Set emailVerified in auth so admin-created (bypassed) users can sign in without "Email not verified". */
export async function markUserEmailVerifiedAction(authUserId: string) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await getUserProfileByUserId(session.user.id);
  if (!profile || profile.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const updateResult = await auth.admin.updateUser({
    userId: authUserId,
    data: { emailVerified: true },
  });
  if (updateResult.error) {
    const msg = updateResult.error.message || "Failed to set email verified";
    return { error: isNeonAdminPermissionError(msg) ? neonAdminHint(msg) : msg };
  }
  revalidatePath("/admin/users");
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
    const msg = result.error.message ?? "Failed to update password";
    return { error: isNeonAdminPermissionError(msg) ? neonAdminHint(msg) : msg };
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function deleteUserAction(userId: string) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const adminProfile = await getUserProfileByUserId(session.user.id);
  if (!adminProfile || adminProfile.role !== "admin") {
    return { error: "Unauthorized" };
  }

  // Prevent admin from deleting themselves
  if (session.user.id === userId) {
    return { error: "You cannot delete your own account" };
  }

  // Get user profile for audit log
  const targetProfile = await getUserProfileByUserId(userId);
  if (!targetProfile) {
    return { error: "User not found" };
  }

  // Log the deletion (soft delete)
  await insertAuditLog({
    actorUserId: session.user.id,
    action: "USER_DELETE",
    entityType: "user_profile",
    entityId: userId,
    before: {
      userId: targetProfile.userId,
      email: targetProfile.email,
      fullName: targetProfile.fullName,
      role: targetProfile.role,
      active: targetProfile.active,
    },
    after: { active: false, email: null, fullName: null },
  });

  // Soft delete: deactivate and anonymize; getUsersListSearch hides rows with no email & no fullName
  await db
    .update(userProfile)
    .set({
      active: false,
      email: null,
      fullName: null,
      updatedAt: new Date(),
    })
    .where(eq(userProfile.userId, userId));

  revalidatePath("/admin/users");
  revalidatePath("/admin/audit");
  return { success: true };
}
