/**
 * DB access layer: re-export client and cache utilities.
 * Use @/lib/db for the db client; use @/lib/db/cache for cached reference data and tags.
 */
export { db } from "@/lib/db";
export {
  CACHE_TAGS,
  getCachedActiveSchoolYear,
  getCachedActiveTerm,
  getCachedProgramsList,
  getCachedRequirementsList,
} from "@/lib/db/cache";
