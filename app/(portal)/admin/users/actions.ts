"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import { getUserProfileByUserId, createUserProfile } from "@/db/queries";

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
