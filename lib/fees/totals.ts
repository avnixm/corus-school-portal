// path: lib/fees/totals.ts
import type { FeeSetupLine } from "./types";

export type FeeSetupTotals = {
  tuitionAmount: number;
  labTotal: number;
  miscTotal: number;
  otherTotal: number;
  total: number;
};

export function computeFeeSetupTotals(
  lines: FeeSetupLine[],
  totalUnits: number,
  tuitionPerUnit: number
): FeeSetupTotals {
  let labTotal = 0;
  let miscTotal = 0;
  let otherTotal = 0;

  const tuitionAmount = totalUnits * tuitionPerUnit;

  for (const line of lines) {
    const amt = parseFloat(line.amount ?? "0") * (line.qty ?? 1);
    if (line.lineType === "lab_fee") labTotal += amt;
    else if (line.lineType === "misc_fee") miscTotal += amt;
    else if (line.lineType === "other_fee") otherTotal += amt;
  }

  const total = tuitionAmount + labTotal + miscTotal + otherTotal;
  return {
    tuitionAmount,
    labTotal,
    miscTotal,
    otherTotal,
    total,
  };
}
