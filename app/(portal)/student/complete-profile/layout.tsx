import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Complete Profile" };
import { AppShell } from "@/components/portal/AppShell";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { signOutAction } from "@/app/actions/auth";

export default async function CompleteProfileLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUserWithRole();
  const userDisplay = user?.name ?? (user?.userId ? `User ${user.userId.slice(0, 8)}` : "User");

  return (
    <AppShell
      title="Student Setup"
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
