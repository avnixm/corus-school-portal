/**
 * Centavo-safe installment schedule: divide totalPromised into N monthly amounts.
 * Distributes remainder (up to N-1 centavos) by adding ₱0.01 to the earliest installments.
 */
export function generateInstallmentSchedule(
  totalPromised: string,
  startDate: Date,
  months: number
): { sequence: number; dueDate: string; amount: string }[] {
  if (months < 1) return [];

  const totalCents = Math.round(parseFloat(totalPromised) * 100);
  if (totalCents <= 0) return [];

  const baseCents = Math.floor(totalCents / months);
  const remainder = totalCents - baseCents * months;

  const schedule: { sequence: number; dueDate: string; amount: string }[] = [];
  for (let k = 1; k <= months; k++) {
    const due = addMonths(startDate, k);
    const dueStr = formatDateISO(due);
    const extraCentavo = k <= remainder ? 1 : 0;
    const amountCents = baseCents + extraCentavo;
    const amount = (amountCents / 100).toFixed(2);
    schedule.push({ sequence: k, dueDate: dueStr, amount });
  }
  return schedule;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Compute final due date as startDate + N months. */
export function getFinalDueDate(startDate: Date, months: number): Date {
  return addMonths(startDate, months);
}
