// path: app/(portal)/teacher/gradebook/page.tsx
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function TeacherGradebookLandingPage() {
  redirect("/teacher/classes");
}
