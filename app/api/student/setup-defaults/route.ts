import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { getProfileAndStudentByUserId } from "@/db/queries";

export type SetupFormDefaultsResponse =
  | { ok: true; email: string; name: string }
  | { ok: false; redirect: "login" | "student" };

/**
 * GET: form defaults for student setup page. Used instead of a server action
 * to avoid triggering RSC revalidation/refetch loop on mount.
 */
export async function GET(): Promise<NextResponse<SetupFormDefaultsResponse>> {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, redirect: "login" as const });
  }
  const profile = await getProfileAndStudentByUserId(session.user.id);
  if (!profile?.profile) {
    return NextResponse.json({ ok: false, redirect: "login" as const });
  }
  if (profile.student) {
    return NextResponse.json({ ok: false, redirect: "student" as const });
  }
  const user = await getCurrentUserWithRole();
  if (!user || user.role !== "student") {
    return NextResponse.json({ ok: false, redirect: "login" as const });
  }
  return NextResponse.json({
    ok: true,
    email: user.email ?? "",
    name: user.name ?? "",
  });
}
