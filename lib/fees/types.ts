// path: lib/fees/types.ts
export type FeeSetupLine = {
  id: string;
  feeSetupId: string;
  lineType: "tuition_component" | "lab_fee" | "misc_fee" | "other_fee";
  label: string;
  amount: string;
  qty: number;
  perUnit: boolean;
  sortOrder: number;
};
