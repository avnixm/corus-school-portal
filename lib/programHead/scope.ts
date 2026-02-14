import "server-only";
import { db } from "@/lib/db";
import { getUserProfileByUserId } from "@/db/queries";
import { programHeadAssignments } from "@/db/schema";
import { and, eq } from "drizzle-orm";

/** Special value in user_profile.program meaning "all programs" (no filter). */
export const PROGRAM_SCOPE_ALL = "ALL";

/**
 * Returns the program scope for a program head: null = not set (must configure in Settings),
 * ALL = all programs, or a specific program code.
 * @deprecated Prefer getProgramHeadScopePrograms for queries; use this only for display (e.g. settings).
 */
export async function getProgramHeadScope(userId: string): Promise<string | null> {
  const profile = await getUserProfileByUserId(userId);
  if (!profile?.program) return null;
  return profile.program === "" ? null : profile.program;
}

/**
 * Returns the set of program codes the program head is allowed to see.
 * - null: no filter (all programs), e.g. when profile.program === 'ALL' or no scope.
 * - string[]: only these program codes (from program_head_assignments + profile.program).
 * Backward compatible: if no assignments exist and profile has a single program, returns [profile.program].
 */
export async function getProgramHeadScopePrograms(userId: string): Promise<string[] | null> {
  const profile = await getUserProfileByUserId(userId);
  const profileProgram =
    profile?.program && profile.program !== "" && profile.program !== PROGRAM_SCOPE_ALL
      ? profile.program
      : null;

  if (profile?.program === PROGRAM_SCOPE_ALL) return null;

  const assignments = await db
    .select({ programCode: programHeadAssignments.programCode })
    .from(programHeadAssignments)
    .where(and(eq(programHeadAssignments.userId, userId), eq(programHeadAssignments.active, true)));

  const set = new Set<string>(assignments.map((a) => a.programCode));
  if (profileProgram) set.add(profileProgram);

  if (set.size === 0) {
    if (profileProgram) return [profileProgram];
    return null;
  }
  return Array.from(set);
}

/** Returns true if scope is set and not "must configure". */
export function isScopeSet(scope: string | null): boolean {
  return scope !== null && scope !== "";
}
