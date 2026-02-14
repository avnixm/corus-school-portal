import { getProgramsList } from "@/db/queries";

/** Server-only: list active programs for dropdowns and filters. */
export async function getActiveProgramsList() {
  return getProgramsList(true);
}
