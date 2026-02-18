import { getDeanRecentAnnouncements } from "@/lib/dean/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeanAnnouncementsList } from "./DeanAnnouncementsList";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = { title: "Announcements" };

export default async function DeanAnnouncementsPage() {
  const user = await getCurrentUserWithRole();
  if (!user) redirect("/login");

  const announcements = await getDeanRecentAnnouncements(100);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Announcements
        </h2>
        <p className="mt-1 text-sm text-neutral-800">
          Create and manage institution-wide announcements. Set audience and optional program.
        </p>
      </section>

      <DeanAnnouncementsList 
        initialAnnouncements={announcements} 
        currentUserId={user.userId}
        currentUserRole={user.role}
      />
    </div>
  );
}
