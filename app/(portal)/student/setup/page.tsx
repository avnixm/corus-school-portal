import type { Metadata } from "next";
import { StudentSetupClient } from "@/app/(portal)/student/setup/StudentSetupClient";

export const metadata: Metadata = { title: "Setup" };

export default function StudentSetupPage() {
  return <StudentSetupClient />;
}
