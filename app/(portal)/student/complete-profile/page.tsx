import { redirect } from "next/navigation";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import CompleteProfileForm from "./CompleteProfileForm";

export const dynamic = "force-dynamic";

export default async function CompleteProfilePage() {
  const user = await getCurrentUserWithRole();

  if (!user || user.role !== "student" || !user.emailVerified) {
    redirect("/verify-email" + (user?.email ? "?email=" + encodeURIComponent(user.email) : ""));
  }

  return (
    <CompleteProfileForm
      defaultName={user.name || ""}
      defaultEmail={user.email || ""}
    />
  );
}
