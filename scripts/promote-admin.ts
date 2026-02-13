/**
 * Promote a user to admin by email.
 * Run: npx tsx scripts/promote-admin.ts user@example.com
 *
 * Use this to create your first admin account. After signing up and verifying
 * email, run this script with your email to get admin access, then visit /admin.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { eq } from "drizzle-orm";
import { userProfile } from "../db/schema";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: npx tsx scripts/promote-admin.ts <email>");
  process.exit(1);
}

async function main() {
  const { db } = await import("../lib/db");
  const [updated] = await db
    .update(userProfile)
    .set({ role: "admin", updatedAt: new Date() })
    .where(eq(userProfile.email, email))
    .returning();

  if (updated) {
    console.log(`Promoted ${email} to admin. Visit /admin to manage users.`);
  } else {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
