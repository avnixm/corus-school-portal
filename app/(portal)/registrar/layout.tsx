import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/portal/AppShell";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { signOutAction } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

export default async function RegistrarLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUserWithRole();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "registrar" && user.role !== "admin") {
    redirect("/");
  }

  const userDisplay = (user?.name || `User ${user.userId.slice(0, 8)}`) as string;

  return (
    <AppShell
      title="Registrar"
      navVariant="registrar"
      userDisplay={userDisplay}
      userId={user.userId}
      role={user.role}
      signOutAction={signOutAction}
    >
      {children}
    </AppShell>
  );
}
