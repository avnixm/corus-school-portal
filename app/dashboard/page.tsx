// path: app/dashboard/page.tsx

import { redirect } from "next/navigation";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { roleHomePath } from "@/lib/roles";

export const dynamic = "force-dynamic";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await getCurrentUserWithRole();

  if (!user) {
    redirect("/login");
  }

  redirect(roleHomePath(user.role));
}
