import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Setup" };

export default function StudentSetupPage() {
  // QW1: Redirect to unified onboarding path
  redirect("/student/complete-profile");
}
