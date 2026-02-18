/**
 * School branding for official documents (assessment forms, receipts).
 * OLSHCO - Our Lady of the Sacred Heart College of Guimba
 */
export const SCHOOL = {
  name: "OUR LADY OF THE SACRED HEART COLLEGE OF GUIMBA, INC.",
  address: "Afan Salvador Street, Guimba, Nueva Ecija",
  tel: "(044) 958-2553",
  tin: "NON-VAT REG. TIN: 000-540-770-00000",
} as const;

/** Format amount for PDF - use "P " prefix to avoid Helvetica rendering issues with ₱ */
export function formatAmount(amount: number): string {
  return `P ${amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}
