// path: lib/requirements/seed.ts

import "server-only";
import { db } from "@/lib/db";
import { requirements, requirementRules } from "@/db/schema";
import { and, eq } from "drizzle-orm";

/** Master requirement definitions only. Which forms are required when (program, year, term, studentType) is set by the registrar in Forms & Requirements → Rules. */
const SEED_REQUIREMENTS = [
  {
    code: "PSA_BIRTH_CERT",
    name: "PSA Birth Certificate",
    description: "PSA/NSO authenticated birth certificate",
    instructions:
      "Upload a clear scan/photo of your PSA/NSO Birth Certificate. Ensure full document is visible and readable.",
    allowedFileTypes: ["pdf", "jpg", "jpeg", "png"],
    maxFiles: 1,
  },
  {
    code: "FORM_137",
    name: "Form 137 (Permanent Record)",
    description: "Permanent record from previous school",
    instructions:
      "Upload Form 137 (permanent record). All pages must be clear and readable.",
    allowedFileTypes: ["pdf", "jpg", "jpeg", "png"],
    maxFiles: 5,
  },
  {
    code: "FORM_138",
    name: "Form 138 (Report Card)",
    description: "Report card from previous school",
    instructions:
      "Upload Form 138 (report card) from your last completed school year. All pages must be clear and readable.",
    allowedFileTypes: ["pdf", "jpg", "jpeg", "png"],
    maxFiles: 5,
  },
  {
    code: "GOOD_MORAL",
    name: "Certificate of Good Moral Character",
    description: "Good moral certificate from previous school",
    instructions:
      "Upload a signed Certificate of Good Moral Character from your previous school.",
    allowedFileTypes: ["pdf", "jpg", "jpeg", "png"],
    maxFiles: 1,
  },
  {
    code: "HONORABLE_DISMISSAL",
    name: "Honorable Dismissal / Transfer Credentials",
    description: "Transfer credentials for transferees",
    instructions:
      "Upload your Honorable Dismissal or Transfer Credentials from your previous institution. Required for transferees.",
    allowedFileTypes: ["pdf", "jpg", "jpeg", "png"],
    maxFiles: 2,
  },
  {
    code: "MARRIAGE_CERT",
    name: "Marriage Certificate",
    description: "PSA/NSO Marriage Certificate (if applicable)",
    instructions:
      "Upload PSA/NSO Marriage Certificate if you are married. Required for married students only.",
    allowedFileTypes: ["pdf", "jpg", "jpeg", "png"],
    maxFiles: 1,
  },
  {
    code: "ID_PHOTO_2X2",
    name: "2x2 ID Photo",
    description: "Recent 2x2 ID photo with white background",
    instructions:
      "Upload a recent 2x2 ID photo with white background. Photo must be clear, passport-style, and taken within the last 6 months.",
    allowedFileTypes: ["jpg", "jpeg", "png"],
    maxFiles: 1,
  },
  {
    code: "MEDICAL_CERT",
    name: "Medical / Health Certificate",
    description: "Medical certificate from licensed physician",
    instructions:
      "Upload a medical certificate from a licensed physician. Certificate should be dated within the last 3 months.",
    allowedFileTypes: ["pdf", "jpg", "jpeg", "png"],
    maxFiles: 1,
  },
] as const;

/**
 * Idempotent seed: ensures PH-specific master requirement definitions exist (PSA Birth Cert, Form 137, Form 138, Good Moral, Honorable Dismissal, Marriage Cert, 2x2 Photo, Medical Cert).
 * Does NOT create any requirement rules. The registrar configures which forms are required and when
 * in Registrar → Forms & Requirements → Rules / applicability (e.g. Form 137 for freshmen, Honorable Dismissal for transferees).
 * Safe to run multiple times.
 */
export async function seedRequirements(): Promise<void> {
  const existing = await db.select({ id: requirements.id, code: requirements.code }).from(requirements);
  const byCode = new Map(existing.map((r) => [r.code, r.id]));

  // Remove legacy BIRTH_CERT in favor of PSA_BIRTH_CERT
  const legacyBirthCertId = byCode.get("BIRTH_CERT");
  if (legacyBirthCertId) {
    await db
      .delete(requirementRules)
      .where(eq(requirementRules.requirementId, legacyBirthCertId));
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
