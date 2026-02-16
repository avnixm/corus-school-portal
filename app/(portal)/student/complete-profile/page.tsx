import { redirect } from "next/navigation";
import { getProfileInitial } from "./actions";
import { StudentSetupWizard } from "@/components/student/setup/StudentSetupWizard";

export const dynamic = "force-dynamic";

export const metadata = { title: "Complete Profile" };

export default async function CompleteProfilePage() {
  const initial = await getProfileInitial();

  if (!initial.ok) {
    if (initial.redirect === "login") redirect("/login");
    if (initial.redirect === "dashboard") redirect("/student");
    redirect("/login");
  }

  return <StudentSetupWizard initialData={initial} />;
}
