import "server-only";
import { auth } from "./server";
import { getUserProfileByUserId, createUserProfile } from "@/db/queries";

export type CurrentUser = {
  readonly userId: string;
  readonly email: string;
  readonly name: string;
  readonly role: string;
  readonly emailVerified: boolean;
};

export async function getCurrentUserWithRole(): Promise<CurrentUser | null> {
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
    return {
      userId,
      email,
      name,
      role: "student",
      emailVerified,
    };
  }
}
