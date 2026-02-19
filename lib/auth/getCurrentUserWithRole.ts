import "server-only";
import { cache } from "react";
import { auth } from "./server";
import { getUserProfileByUserId, createUserProfile } from "@/db/queries";

export type CurrentUser = {
  readonly userId: string;
  readonly email: string;
  readonly name: string;
  readonly role: string;
  readonly emailVerified: boolean;
};

async function getCurrentUserWithRoleImpl(): Promise<CurrentUser | null> {
  const sessionResponse = await auth.getSession();
  const session = sessionResponse?.data;

  if (!session?.user?.id) {
    return null;
  }

  const userId: string = session.user.id;
  const email: string = session.user.email || "";
  const name: string = session.user.name || "";
  const emailVerified: boolean = session.user.emailVerified || false;

  try {
    const profile = await getUserProfileByUserId(userId);

    if (!profile) {
      // Only create user_profile after email is verified. Unverified users
      // (e.g. just signed up) must complete OTP first - prevents bot accounts.
      if (emailVerified) {
        await createUserProfile({
          userId,
          email,
          fullName: name,
          role: "student",
        });
      }

      return {
        userId,
        email,
        name,
        role: "student",
        emailVerified,
      };
    }

    // Check if user is active - return null if inactive
    if (profile.active === false) {
      return null;
    }

    // Admin-created users have emailVerificationBypassed; treat as verified so they are not sent to verify-email.
    const effectiveVerified =
      emailVerified || (profile.emailVerificationBypassed ?? false);

    return {
      userId,
      email,
      name,
      role: profile.role,
      emailVerified: effectiveVerified,
    };
  } catch {
    // If profile fetch failed (e.g. transient error), still respect admin bypass:
    // admin-created users have emailVerificationBypassed and must not be sent to verify-email.
    try {
      const fallbackProfile = await getUserProfileByUserId(userId);
      if (fallbackProfile?.emailVerificationBypassed) {
        return {
          userId,
          email,
          name,
          role: fallbackProfile.role,
          emailVerified: true,
        };
      }
    } catch {
      // ignore
    }
    return {
      userId,
      email,
      name,
      role: "student",
      emailVerified,
    };
  }
}

export const getCurrentUserWithRole = cache(getCurrentUserWithRoleImpl);
