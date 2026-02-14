import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/portal/AppShell";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { signOutAction } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

export default async function FinanceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUserWithRole();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "finance" && user.role !== "admin") {
    redirect("/not-authorized");
  }

  const userDisplay = (user?.name || `User ${user.userId.slice(0, 8)}`) as string;

  return (
    <AppShell
      title="Finance"
      navVariant="finance"
      userDisplay={userDisplay}
      userId={user.userId}
      role={user.role}
      signOutAction={signOutAction}
    >
      {children}
    </AppShell>
  );
}
