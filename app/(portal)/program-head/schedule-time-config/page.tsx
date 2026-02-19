import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ScheduleTimeConfigRedirect() {
  redirect("/program-head/scheduling?view=time-config");
}
