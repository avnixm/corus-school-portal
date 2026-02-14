// path: app/(portal)/teacher/layout.tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/portal/AppShell";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { signOutAction } from "@/app/actions/auth";
import { roleHomePath } from "@/lib/roles";
import { ensureTeacherForCurrentUser } from "./actions";

export const dynamic = "force-dynamic";

export default async function TeacherLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUserWithRole();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "teacher" && user.role !== "admin") {
    redirect(roleHomePath(user.role));
  }

  const teacherCtx = await ensureTeacherForCurrentUser();
  if (!teacherCtx) {
    redirect("/not-authorized");
  }

  const userDisplay = (user?.name || `User ${user.userId.slice(0, 8)}`) as string;

  return (
    <AppShell
      title="Teacher"
      navVariant="teacher"
      userDisplay={userDisplay}
      userId={user.userId}
      role={user.role}
      signOutAction={signOutAction}
    >
      {children}
    </AppShell>
  );
}
