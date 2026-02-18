/**
 * Formats status strings for display (e.g. "released" -> "Released", "pending_approval" -> "Pending approval").
 */
export function formatStatusForDisplay(status: string | null | undefined): string {
  if (status == null || status === "") return "";
  return status
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
