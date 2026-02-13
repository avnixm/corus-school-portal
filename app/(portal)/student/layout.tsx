import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { hasPendingApplicationByUserProfileId } from "@/db/queries";
import { AppShell } from "@/components/portal/AppShell";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { getCurrentUserWithStudent } from "@/lib/auth/getCurrentStudent";
import { signOutAction } from "@/app/actions/auth";
import CompleteProfileForm from "./complete-profile/CompleteProfileForm";

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

  if (!data?.student) {
    // If user has pending application, redirect to pending-approval
    if (data?.profile) {
      const hasPending = await hasPendingApplicationByUserProfileId(data.profile.id);
      if (hasPending) {
        redirect("/student/pending-approval");
      }
    }
    // No student and no pending: show complete-profile form directly (no redirect)
    const userDisplay = (user?.name || `User ${user.userId.slice(0, 8)}`) as string;
    return (
      <AppShell
        title="Complete Your Profile"
        sidebarItems={[]}
        userDisplay={userDisplay}
        userId={user.userId}
        role={user.role}
        signOutAction={signOutAction}
      >
        <CompleteProfileForm
          defaultName={user.name || ""}
          defaultEmail={user.email || ""}
        />
      </AppShell>
    );
  }

  const userDisplay = (user?.name || `User ${user.userId.slice(0, 8)}`) as string;

  return (
    <AppShell
      title="Dashboard"
      sidebarItems={undefined}
      userDisplay={userDisplay}
      userId={user.userId}
      role={user.role}
      signOutAction={signOutAction}
    >
      {children}
    </AppShell>
  );
}

