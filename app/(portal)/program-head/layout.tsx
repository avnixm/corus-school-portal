import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/portal/AppShell";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { signOutAction } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

export default async function ProgramHeadLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUserWithRole();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "program_head" && user.role !== "admin") {
    redirect("/not-authorized");
  }

  const userDisplay = (user?.name || `User ${user.userId.slice(0, 8)}`) as string;

  return (
    <AppShell
      title="Program Head"
      navVariant="program_head"
      userDisplay={userDisplay}
      userId={user.userId}
      role={user.role}
      signOutAction={signOutAction}
    >
      {children}
    </AppShell>
  );
}
