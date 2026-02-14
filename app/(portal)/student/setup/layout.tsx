import type { ReactNode } from "react";
import { AppShell } from "@/components/portal/AppShell";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { signOutAction } from "@/app/actions/auth";

/**
 * Setup shell only. No getCurrentUserWithStudent, no headers() — keeps this route stable (no refetch loop).
 * If user already has a student, the client redirects to /student via the setup-defaults API response.
 */
export default async function StudentSetupLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUserWithRole();
  const userDisplay = user?.name ?? (user?.userId ? `User ${user.userId.slice(0, 8)}` : "User");

  return (
    <AppShell
      title="Student Profile Setup"
      sidebarItems={[]}
      userDisplay={userDisplay}
      userId={user?.userId ?? ""}
      role={user?.role ?? "student"}
      signOutAction={signOutAction}
    >
      {children}
    </AppShell>
  );
}
