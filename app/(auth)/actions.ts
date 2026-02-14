"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { getUserProfileByUserId, createUserProfile } from "@/db/queries";
import { roleHomePath } from "@/lib/roles";

export interface AuthState {
  error?: string;
  success?: boolean;
}

export async function register(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const fullName = (formData.get("fullName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const course = (formData.get("course") as string)?.trim();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!fullName || !email || !password) {
    return { error: "All fields are required" };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
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
    return { error: signUpResult.error?.message || "Sign up failed" };
  }

  // Do NOT create user_profile here - wait until email is verified (OTP).
  // This prevents bots from creating accounts without verifying email.
  redirect("/verify-email?email=" + encodeURIComponent(email));
}

export async function login(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const result = await auth.signIn.email({
    email,
    password,
  });

  if (result.error) {
    return { error: result.error.message || "Invalid email or password" };
  }

  const session = (await auth.getSession())?.data;
  if (session?.user?.id) {
    try {
      const profile = await getUserProfileByUserId(session.user.id);
      const role = profile?.role ?? "student";
      redirect(roleHomePath(role));
    } catch {
      // Profile query can fail if schema is outdated (e.g. missing program/department columns).
      // Fall back to student so login still succeeds. Run: npx tsx scripts/run-apply-schema.ts
      redirect(roleHomePath("student"));
    }
  }

  redirect(roleHomePath("student"));
}

export async function signOutAction(
  _prevState: AuthState
): Promise<AuthState> {
  await auth.signOut();
  redirect("/login");
}

export async function verifyEmailWithOTP(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const code = (formData.get("code") as string)?.trim();

  if (!email || !code) {
    return { error: "Email and verification code are required" };
  }

  if (code.length !== 6) {
    return { error: "Verification code must be exactly 6 digits" };
  }

  // Call Neon Auth Better Auth's email-otp verify endpoint
  const baseUrl = process.env.NEON_AUTH_BASE_URL!;
  const verifyResponse = await fetch(`${baseUrl}/email-otp/verify-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      otp: code,
    }),
  });

  if (!verifyResponse.ok) {
    const errorData = await verifyResponse.json().catch(() => ({}));
    return {
      error:
        errorData.message ||
        "Invalid verification code. Please check and try again.",
    };
  }

  // Create user_profile only after OTP verification (prevents bot accounts)
  const session = (await auth.getSession())?.data;
  if (session?.user?.id) {
    const existing = await getUserProfileByUserId(session.user.id);
    if (!existing) {
      await createUserProfile({
        userId: session.user.id,
        email,
        fullName: session.user.name ?? undefined,
        role: "student",
      });
    }
  }

  redirect(roleHomePath("student"));
}

export async function resendVerificationEmail(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!email) {
    return { error: "Email is required" };
  }

  // Call Neon Auth Better Auth's send verification OTP endpoint
  const baseUrl = process.env.NEON_AUTH_BASE_URL!;
  const resendResponse = await fetch(`${baseUrl}/email-otp/send-verification-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      type: "email-verification",
    }),
  });

  if (!resendResponse.ok) {
    const errorData = await resendResponse.json().catch(() => ({}));
    return {
      error: errorData.message || "Failed to resend verification code",
    };
  }

  return { success: true };
}

