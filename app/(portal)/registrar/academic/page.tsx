import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = { title: "Academic" };

export default function AcademicRedirectPage() {
  redirect("/registrar/subjects");
}
