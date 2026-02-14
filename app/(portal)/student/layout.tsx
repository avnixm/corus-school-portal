import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { roleHomePath } from "@/lib/roles";

/**
 * Minimal student layout: auth and role only. No headers(), no getCurrentUserWithStudent.
 * Setup and pending-approval use their own layouts; dashboard routes use (dashboard)/layout.
 * This avoids the refetch loop caused by dynamic layout + headers on /student/setup.
 */
export default async function StudentLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUserWithRole();

  if (!user) redirect("/login");
  if (user.role !== "student") redirect(roleHomePath(user.role));
  if (!user.emailVerified) {
    redirect("/verify-email" + (user?.email ? "?email=" + encodeURIComponent(user.email) : ""));
  }

  return <>{children}</>;
}
