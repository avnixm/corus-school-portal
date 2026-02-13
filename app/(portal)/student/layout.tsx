import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hasPendingApplicationByUserProfileId } from "@/db/queries";
import { AppShell } from "@/components/portal/AppShell";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { getCurrentUserWithStudent } from "@/lib/auth/getCurrentStudent";
import { signOutAction } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

export default async function StudentLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUserWithRole();

  if (
    !user ||
    user.role !== "student" ||
    !user.emailVerified
  ) {
    redirect("/verify-email" + (user?.email ? "?email=" + encodeURIComponent(user.email) : ""));
  }

  const data = await getCurrentUserWithStudent();
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isFormRoute =
    pathname === "/student/complete-profile" ||
    pathname === "/student/pending-approval";

  if (!data?.student) {
    // If user has pending application, always show pending-approval
    if (data?.profile) {
      const hasPending = await hasPendingApplicationByUserProfileId(data.profile.id);
      if (hasPending) {
        redirect("/student/pending-approval");
      }
    }
    // No student and no pending: redirect to form unless already on form
    if (!isFormRoute) {
      redirect("/student/complete-profile");
    }
  }

  const userDisplay = (user?.name || `User ${user.userId.slice(0, 8)}`) as string;

  const isOnboarding = !data?.student;
  const onboardingTitle =
    pathname === "/student/pending-approval"
      ? "Application Submitted"
      : "Complete Your Profile";

  return (
    <AppShell
      title={isOnboarding ? onboardingTitle : "Dashboard"}
      sidebarItems={isOnboarding ? [] : undefined}
      userDisplay={userDisplay}
      userId={user.userId}
      role={user.role}
      signOutAction={signOutAction}
    >
      {children}
    </AppShell>
  );
}

