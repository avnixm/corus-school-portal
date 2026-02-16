// path: lib/requirements/seed.ts

import "server-only";
import { db } from "@/lib/db";
import { requirements, requirementRules } from "@/db/schema";
import { and, eq } from "drizzle-orm";

/** Master requirement definitions only. Which forms are required when (program, year, term) is set by the registrar in Forms & Requirements → Rules. */
const SEED_REQUIREMENTS = [
  {
    code: "BIRTH_CERT",
    name: "Birth Certificate",
    description: "PSA/NSO authenticated birth certificate",
    instructions:
      "Upload a clear scan/photo of your PSA/NSO Birth Certificate. Ensure full document is visible.",
    allowedFileTypes: ["pdf", "jpg", "jpeg", "png"],
    maxFiles: 1,
  },
  {
    code: "FORM_137",
    name: "Form 137",
    description: "Permanent record from previous school",
    instructions:
      "Upload Form 137 (permanent record). Photo/scan must be readable.",
    allowedFileTypes: ["pdf", "jpg", "jpeg", "png"],
    maxFiles: 1,
  },
  {
    code: "GOOD_MORAL",
    name: "Good Moral Certificate",
    description: "Certificate of good moral character",
    instructions:
      "Upload a signed Good Moral Certificate from your previous school.",
    allowedFileTypes: ["pdf", "jpg", "jpeg", "png"],
    maxFiles: 1,
  },
] as const;

/**
 * Idempotent seed: ensures master requirement definitions exist (Birth Certificate, Form 137, Good Moral).
 * Does NOT create any requirement rules. The registrar configures which forms are required and when
 * in Registrar → Forms & Requirements → Rules / applicability (e.g. Form 137 for 1st year, Birth Cert for 1st year).
 * Removes any legacy Form 138 enrollment rule. Safe to run multiple times.
 */
export async function seedRequirements(): Promise<void> {
  const existing = await db.select({ id: requirements.id, code: requirements.code }).from(requirements);
  const byCode = new Map(existing.map((r) => [r.code, r.id]));

  const form138Id = byCode.get("FORM_138");
  if (form138Id) {
    await db
      .delete(requirementRules)
      .where(
        and(
          eq(requirementRules.requirementId, form138Id),
          eq(requirementRules.appliesTo, "enrollment")
        )
      );
  }

  for (const r of SEED_REQUIREMENTS) {
    if (byCode.has(r.code)) continue;
    const [inserted] = await db
      .insert(requirements)
      .values({
        code: r.code,
        name: r.name,
        description: r.description,
        instructions: r.instructions,
        allowedFileTypes: r.allowedFileTypes as unknown as string[],
        maxFiles: r.maxFiles,
        isActive: true,
      })
      .returning({ id: requirements.id });
    if (inserted) byCode.set(r.code, inserted.id);
  }
}
