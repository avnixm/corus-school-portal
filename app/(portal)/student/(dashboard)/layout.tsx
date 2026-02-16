import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Student" };
import { redirect } from "next/navigation";
import { AppShell } from "@/components/portal/AppShell";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { getCurrentUserWithStudent } from "@/lib/auth/getCurrentStudent";
import { signOutAction } from "@/app/actions/auth";
/**
 * Layout only for routes that require a linked student (dashboard, enrollment, etc.).
 * Redirects to /student/complete-profile when no student.
 * Does not use headers() so /student/setup is never under this layout and stays stable.
 */
export default async function StudentDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUserWithRole();
  if (!user) redirect("/login");

  const data = await getCurrentUserWithStudent();
  const hasStudent = data?.student?.id && String(data.student.id).trim() !== "";

  if (!data?.student || !hasStudent) {
    redirect("/student/complete-profile");
  }

  const userDisplay = (user?.name || `User ${user.userId.slice(0, 8)}`) as string;
  return (
    <AppShell
      title="Dashboard"
      navVariant="student"
      userDisplay={userDisplay}
      userId={user.userId}
      role={user.role}
      signOutAction={signOutAction}
    >
      {children}
    </AppShell>
  );
}
