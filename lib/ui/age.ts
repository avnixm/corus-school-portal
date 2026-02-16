/**
 * Helper functions for computing age/SLA indicators across registrar queues.
 * Used for enrollment approvals, requirements verification, and grade submissions.
 */

/**
 * Computes the number of days between a given date and now.
 * Returns null if the date is null/invalid.
 */
export function computeAgeDays(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  
  try {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(targetDate.getTime())) return null;
    
    const now = new Date();
    const diffMs = now.getTime() - targetDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    return diffDays >= 0 ? diffDays : 0;
  } catch {
    return null;
  }
}

/**
 * Returns a shadcn Badge variant based on age in days.
 * - 0-2 days: "default" (new item)
 * - 3-6 days: "secondary" (amber-like warning)
 * - 7+ days: "destructive" (overdue/critical)
 */
export function ageBadgeVariant(
  ageDays: number | null
): "default" | "secondary" | "destructive" {
  if (ageDays === null) return "default";
  
  if (ageDays >= 7) return "destructive";
  if (ageDays >= 3) return "secondary";
  return "default";
}

/**
 * Returns a human-readable label for age badges.
 * - 0-2 days: "New"
 * - 3-6 days: "3d+" (or specific days)
 * - 7+ days: "7d+" (or specific days)
 */
export function ageBadgeLabel(ageDays: number | null): string {
  if (ageDays === null) return "—";
  
  if (ageDays === 0) return "Today";
  if (ageDays === 1) return "1d";
  if (ageDays === 2) return "2d";
  if (ageDays >= 7) return `${ageDays}d`;
  return `${ageDays}d`;
}

/**
 * Combined helper that returns both variant and label for a given date.
 */
export function getAgeBadgeProps(date: Date | string | null | undefined): {
  variant: "default" | "secondary" | "destructive";
  label: string;
  days: number | null;
} {
  const days = computeAgeDays(date);
  return {
    variant: ageBadgeVariant(days),
    label: ageBadgeLabel(days),
    days,
  };
}
