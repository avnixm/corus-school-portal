import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = { title: "Pending Approval" };

export default function PendingApprovalRedirectPage() {
  redirect("/student/complete-profile");
}
