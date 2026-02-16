import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = { title: "Pending Application" };

export default function PendingApplicationDetailRedirectPage() {
  redirect("/registrar");
}
