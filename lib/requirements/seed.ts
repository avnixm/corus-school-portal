// path: lib/requirements/seed.ts

import "server-only";
import { db } from "@/lib/db";
import { requirements, requirementRules } from "@/db/schema";
import { eq } from "drizzle-orm";

/** Requirements that apply only to 1st year enrollment. */
const FIRST_YEAR_ONLY_CODES = ["BIRTH_CERT", "FORM_138", "GOOD_MORAL"] as const;

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
    code: "FORM_138",
    name: "Form 138",
    description: "Report card from previous school",
    instructions:
      "Upload Form 138 (report card). Include all pages/quarters.",
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
 * Idempotent seed: inserts the four school requirements and one rule each.
 * BIRTH_CERT, FORM_138 (report card), GOOD_MORAL: enrollment rule for 1st year only.
 * FORM_137: enrollment rule for all year levels.
 * Safe to run multiple times.
 */
export async function seedRequirements(): Promise<void> {
  const existing = await db.select({ id: requirements.id, code: requirements.code }).from(requirements);
  const byCode = new Map(existing.map((r) => [r.code, r.id]));

  for (let i = 0; i < SEED_REQUIREMENTS.length; i++) {
    const r = SEED_REQUIREMENTS[i];
    let requirementId = byCode.get(r.code);
    if (!requirementId) {
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
      if (inserted) {
        requirementId = inserted.id;
        byCode.set(r.code, requirementId);
      }
    }
    if (!requirementId) continue;

    const firstYearOnly = FIRST_YEAR_ONLY_CODES.includes(r.code as (typeof FIRST_YEAR_ONLY_CODES)[number]);
    const wantYearLevel = firstYearOnly ? "1" : null;

    const existingRules = await db
      .select()
      .from(requirementRules)
      .where(eq(requirementRules.requirementId, requirementId));

    const genericEnrollmentRule = existingRules.find(
      (x) =>
        x.appliesTo === "enrollment" &&
        x.program == null &&
        x.schoolYearId == null &&
        x.termId == null
    );

    if (genericEnrollmentRule) {
      if (genericEnrollmentRule.yearLevel !== wantYearLevel) {
        await db
          .update(requirementRules)
          .set({ yearLevel: wantYearLevel, updatedAt: new Date() })
          .where(eq(requirementRules.id, genericEnrollmentRule.id));
      }
    } else {
      await db.insert(requirementRules).values({
        requirementId,
        appliesTo: "enrollment",
        program: null,
        yearLevel: wantYearLevel,
        schoolYearId: null,
        termId: null,
        isRequired: true,
        sortOrder: i + 1,
      });
    }
  }
}
