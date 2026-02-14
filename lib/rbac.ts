import "server-only";
import type { Role } from "@/db/schema";
import type { UserProfile } from "@/db/schema";
import { auth } from "@/lib/auth/server";
import { getUserProfileByUserId } from "@/db/queries";

export type RequireRoleResult =
  | { userId: string; profile: UserProfile }
  | { error: "Unauthorized" };

/**
 * Server-side role check. Returns the current user and profile if the profile's
 * role is in allowedRoles; otherwise returns { error: "Unauthorized" }.
 * Use in server actions to centralize "only registrar can approve", "only finance can post", etc.
 */
export async function requireRole(
  allowedRoles: Role[]
): Promise<RequireRoleResult> {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Unauthorized" };

  const profile = await getUserProfileByUserId(session.user.id);
  if (!profile || !allowedRoles.includes(profile.role)) {
    return { error: "Unauthorized" };
  }

  return { userId: session.user.id, profile };
}
