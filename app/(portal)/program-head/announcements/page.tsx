import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { getRecentAnnouncementsForProgramHead } from "@/lib/programHead/queries";
import { getRoleDisplayLabel } from "@/lib/announcements/roleLabel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ProgramHeadAnnouncementsPage() {
  const user = await getCurrentUserWithRole();
  if (!user) return null;
  const announcements = await getRecentAnnouncementsForProgramHead(50);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Announcements
        </h2>
        <p className="mt-1 text-sm text-neutral-800">
          Program-wide and general announcements. Posting is optional (extend with program scope if needed).
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">
            Recent announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {announcements.map((a) => (
              <li key={a.id} className="rounded-lg border p-4">
                <span className="text-xs font-semibold uppercase text-[#6A0000]">
                  {getRoleDisplayLabel(a.createdByRole)}
                </span>
                <h3 className="mt-1 font-medium text-[#6A0000]">{a.title}</h3>
                <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-800">{a.body}</p>
                <p className="mt-2 text-xs text-neutral-500">
                  {a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}
                </p>
              </li>
            ))}
            {announcements.length === 0 && (
              <li className="py-8 text-center text-sm text-neutral-600">
                No announcements.
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
