"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import { getUserProfileByUserId } from "@/db/queries";
import { upsertAdviserAssignment, deleteAdviserAssignment } from "@/db/queries";

export async function assignAdviserAction(formData: FormData) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await getUserProfileByUserId(session.user.id);
  const canEdit =
    profile && ["registrar", "dean", "admin"].includes(profile.role);
  if (!profile || !canEdit) {
    return { error: "Unauthorized" };
  }

  const sectionId = formData.get("sectionId") as string;
  const schoolYearId = formData.get("schoolYearId") as string;
  const teacherUserProfileId = (formData.get("teacherUserProfileId") as string)?.trim();

  if (!sectionId || !schoolYearId) {
    return { error: "Section and school year are required" };
  }

  if (teacherUserProfileId) {
    await upsertAdviserAssignment({ sectionId, schoolYearId, teacherUserProfileId });
  } else {
    await deleteAdviserAssignment(sectionId, schoolYearId);
  }

  revalidatePath("/registrar/advisers");
  return { success: true };
}
