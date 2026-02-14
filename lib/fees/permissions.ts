// path: lib/fees/permissions.ts
import "server-only";
import { auth } from "@/lib/auth/server";
import { getUserProfileByUserId } from "@/db/queries";
import { getProgramHeadScopePrograms } from "@/lib/programHead/scope";

export async function requireFinance() {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" as const, userId: null };
  const profile = await getUserProfileByUserId(session.user.id);
  if (!profile || profile.role !== "finance") {
    return { error: "Finance role required" as const, userId: null };
  }
  return { error: null as null, userId: session.user.id };
}

export async function requireProgramHead() {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" as const, userId: null };
  const profile = await getUserProfileByUserId(session.user.id);
  if (!profile || profile.role !== "program_head") {
    return { error: "Program Head role required" as const, userId: null };
  }
  return { error: null as null, userId: session.user.id };
}

export async function requireDean() {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" as const, userId: null };
  const profile = await getUserProfileByUserId(session.user.id);
  if (!profile || profile.role !== "dean") {
    return { error: "Dean role required" as const, userId: null };
  }
  return { error: null as null, userId: session.user.id };
}

export async function canProgramHeadApproveFeeSetup(
  userId: string,
  programCode: string
): Promise<boolean> {
  const scope = await getProgramHeadScopePrograms(userId);
  if (scope === null) return true;
  return scope.includes(programCode);
}
