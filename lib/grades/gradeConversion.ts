/**
 * Philippine K-12/transmutation grading system.
 * Scale: 1.00 (highest/excellent) to 5.00 (lowest/failed).
 * Teachers enter percentage (0-100); system computes transmuted grade and remark.
 * Based on DepEd Order and common institutional grading tables (NEW scale).
 */

export type GradeResult = {
  transmutedGrade: string; // 1.00 - 5.00
  remark: string;
};

/** Lookup table: percentage (integer) -> { transmutedGrade, remark } */
const GRADING_TABLE: Record<number, GradeResult> = {
  74: { transmutedGrade: "5.00", remark: "Failed" },
  75: { transmutedGrade: "3.00", remark: "Passed" },
  76: { transmutedGrade: "2.92", remark: "Passed" },
  77: { transmutedGrade: "2.84", remark: "Passed" },
  78: { transmutedGrade: "2.76", remark: "Fairly Satisfactory" },
  79: { transmutedGrade: "2.68", remark: "Fairly Satisfactory" },
  80: { transmutedGrade: "2.60", remark: "Fairly Satisfactory" },
  81: { transmutedGrade: "2.52", remark: "Fairly Satisfactory" },
  82: { transmutedGrade: "2.44", remark: "Fairly Satisfactory" },
  83: { transmutedGrade: "2.36", remark: "Fairly Satisfactory" },
  84: { transmutedGrade: "2.28", remark: "Satisfactory" },
  85: { transmutedGrade: "2.20", remark: "Satisfactory" },
  86: { transmutedGrade: "2.12", remark: "Satisfactory" },
  87: { transmutedGrade: "2.04", remark: "Satisfactory" },
  88: { transmutedGrade: "1.96", remark: "Satisfactory" },
  89: { transmutedGrade: "1.88", remark: "Satisfactory" },
  90: { transmutedGrade: "1.80", remark: "Very Satisfactory" },
  91: { transmutedGrade: "1.72", remark: "Very Satisfactory" },
  92: { transmutedGrade: "1.64", remark: "Very Satisfactory" },
  93: { transmutedGrade: "1.56", remark: "Very Satisfactory" },
  94: { transmutedGrade: "1.48", remark: "Very Satisfactory" },
  95: { transmutedGrade: "1.40", remark: "Very Satisfactory" },
  96: { transmutedGrade: "1.32", remark: "Superior" },
  97: { transmutedGrade: "1.24", remark: "Superior" },
  98: { transmutedGrade: "1.16", remark: "Superior" },
  99: { transmutedGrade: "1.08", remark: "Excellent" },
  100: { transmutedGrade: "1.00", remark: "Excellent" },
};

const FAILED_RESULT: GradeResult = { transmutedGrade: "5.00", remark: "Failed" };

/**
 * Converts a percentage grade (0-100) to transmuted grade (1.00-5.00) and remark.
 * Uses the Philippine grading scale: 1.00 = highest, 5.00 = failed.
 */
export function percentToTransmutedGrade(percent: number): GradeResult | null {
  if (!Number.isFinite(percent)) return null;
  const p = Math.round(percent);
  if (p < 74) return FAILED_RESULT;
  if (p > 100) return null;
  return GRADING_TABLE[p] ?? null;
}

/**
 * Converts a percentage string to transmuted grade and remark.
 * Returns null if input is invalid or empty.
 */
export function percentStringToGrade(percentStr: string | null | undefined): GradeResult | null {
  if (percentStr == null || String(percentStr).trim() === "") return null;
  const n = Number.parseFloat(String(percentStr).trim());
  if (!Number.isFinite(n)) return null;
  return percentToTransmutedGrade(n);
}
