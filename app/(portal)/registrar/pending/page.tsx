import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = { title: "Pending" };

export default function RegistrarPendingRedirectPage() {
  redirect("/registrar");
}
