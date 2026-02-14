import { getCurrentStudent } from "@/lib/auth/getCurrentStudent";
import { getEnrollmentForStudentActiveTerm } from "@/db/queries";
import { getAnnouncementsForStudent } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StudentAnnouncementsPage() {
  const current = await getCurrentStudent();
  if (!current) redirect("/student");

  const enrollment = await getEnrollmentForStudentActiveTerm(current.studentId);
  const program = enrollment?.program ?? undefined;
  const announcements = await getAnnouncementsForStudent(50, program);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">Announcements</h2>
        <p className="text-sm text-neutral-700">
          School-wide and student announcements. Pinned items appear first.
        </p>
      </div>

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-neutral-600">
              No announcements at this time.
            </CardContent>
          </Card>
        ) : (
          announcements.map((a) => (
            <Card key={a.id} className={a.pinned ? "border-[#6A0000]/30" : ""}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  {a.pinned && (
                    <Badge variant="outline" className="bg-[#6A0000]/10 text-[#6A0000]">
                      Pinned
                    </Badge>
                  )}
                  <CardTitle className="text-base text-[#6A0000]">{a.title}</CardTitle>
                </div>
                <p className="text-xs text-neutral-500">
                  {a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}
                </p>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm text-neutral-800">{a.body}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
