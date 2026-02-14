"use server";

import { updateUserProfileProgramScope } from "@/db/queries";

export async function updateProgramScopeAction(formData: FormData) {
  const profileId = formData.get("profileId");
  const program = formData.get("program");
  if (typeof profileId !== "string" || !profileId) return;
  const programValue = program === "" ? null : (program as string);
  await updateUserProfileProgramScope(profileId, programValue);
}
