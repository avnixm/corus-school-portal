/**
 * Edge-safe profile lookup for middleware only.
 * Do not import from @/db/queries here — that module pulls in lib/uploads (Node-only).
 */
import { db } from "@/lib/db";
import { userProfile } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getUserProfileByUserId(userId: string) {
  const [profile] = await db
    .select()
    .from(userProfile)
    .where(eq(userProfile.userId, userId))
    .limit(1);
  return profile ?? null;
}
