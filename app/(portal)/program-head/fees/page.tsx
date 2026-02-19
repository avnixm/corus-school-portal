import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function FeeApprovalsRedirect() {
  redirect("/program-head/finance?view=fees");
}
