import { getAnnouncementsList } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateAnnouncementForm } from "./CreateAnnouncementForm";
import { AnnouncementRowActions } from "./AnnouncementRowActions";

export const dynamic = "force-dynamic";

const AUDIENCE_LABELS: Record<string, string> = {
  all: "All",
  students: "Students",
  teachers: "Teachers",
  registrar: "Registrar",
  finance: "Finance",
  program_head: "Program Head",
  dean: "Dean",
};

export default async function AnnouncementsPage() {
  const announcements = await getAnnouncementsList();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Announcements
        </h2>
        <p className="text-sm text-neutral-700">
          Create and manage announcements.
        </p>
      </div>

      <CreateAnnouncementForm />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">
            All announcements ({announcements.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {announcements.map((row) => (
              <div
                key={row.id}
                className="flex items-start justify-between rounded-lg border bg-white p-4"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-[#6A0000]">{row.title}</h3>
                  <p className="mt-1 text-sm text-neutral-700 line-clamp-2">
                    {row.body}
                  </p>
                  <p className="mt-2 text-xs text-neutral-500">
                    {AUDIENCE_LABELS[row.audience] ?? row.audience} •{" "}
                    {row.createdAt
                      ? new Date(row.createdAt).toLocaleString()
                      : "—"}
                  </p>
                </div>
                <AnnouncementRowActions announcement={row} />
              </div>
            ))}
            {announcements.length === 0 && (
              <p className="py-8 text-center text-sm text-neutral-700">
                No announcements yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
