// path: app/(portal)/teacher/submissions/page.tsx
import { ensureTeacherForCurrentUser } from "../actions";
import { listGradeSubmissionsForTeacher } from "@/db/queries";
import { getActiveSchoolYear, getActiveTerm } from "@/db/queries";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export const dynamic = "force-dynamic";

function statusBadge(status: string) {
  const map: Record<string, string> = {
    draft: "border-neutral-400 text-neutral-600",
    submitted: "border-amber-500 text-amber-700",
    returned: "border-red-500 text-red-700",
    approved: "border-blue-500 text-blue-700",
    released: "border-green-500 text-green-700",
  };
  return map[status] ?? "";
}

export default async function TeacherSubmissionsPage() {
  const ctx = await ensureTeacherForCurrentUser();
  if (!ctx) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">Submissions</h2>
        <p className="text-sm text-neutral-700">Unauthorized.</p>
      </div>
    );
  }
  const sy = await getActiveSchoolYear();
  const term = await getActiveTerm();
  if (!sy || !term) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">Submissions</h2>
        <p className="text-sm text-neutral-700">No active school year/term.</p>
      </div>
    );
  }
  const [draft, submitted, returned, approved, released] = await Promise.all([
    listGradeSubmissionsForTeacher(ctx.teacherId, { schoolYearId: sy.id, termId: term.id, status: "draft" }),
    listGradeSubmissionsForTeacher(ctx.teacherId, { schoolYearId: sy.id, termId: term.id, status: "submitted" }),
    listGradeSubmissionsForTeacher(ctx.teacherId, { schoolYearId: sy.id, termId: term.id, status: "returned" }),
    listGradeSubmissionsForTeacher(ctx.teacherId, { schoolYearId: sy.id, termId: term.id, status: "approved" }),
    listGradeSubmissionsForTeacher(ctx.teacherId, { schoolYearId: sy.id, termId: term.id, status: "released" }),
  ]);

  const defaultTab =
    returned.length > 0 ? "returned" : draft.length > 0 ? "draft" : "submitted";

  const renderList = (
    items: typeof draft,
    emptyMsg: string,
    options?: { showActionNeeded?: boolean }
  ) => (
    <div className="space-y-2">
      {items.map((s) => (
        <Link
          key={s.id}
          href={`/teacher/gradebook/${s.scheduleId}/${s.gradingPeriodId}`}
          className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-neutral-50 ${
            options?.showActionNeeded ? "border-red-200 bg-red-50/30" : ""
          }`}
        >
          <span className="font-medium text-[#6A0000]">
            {s.subjectCode} — {s.sectionName} ({s.gradingPeriodName})
          </span>
          <div className="flex items-center gap-2">
            {options?.showActionNeeded && (
              <span className="rounded bg-red-600 px-1.5 py-0.5 text-xs font-medium text-white">
                Action needed
              </span>
            )}
            <Badge variant="outline" className={statusBadge(s.status)}>
              {s.status}
            </Badge>
            {s.submittedAt && (
              <span className="text-xs text-neutral-500">
                {new Date(s.submittedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </Link>
      ))}
      {items.length === 0 && (
        <p className="py-4 text-center text-sm text-neutral-600">{emptyMsg}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Grade submissions
        </h2>
        <p className="mt-1 text-sm text-neutral-800">
          {sy.name} • {term.name}
        </p>
      </section>

      <Tabs defaultValue={defaultTab}>
        <TabsList className="bg-neutral-100">
          <TabsTrigger value="draft">Draft ({draft.length})</TabsTrigger>
          <TabsTrigger value="submitted">Submitted ({submitted.length})</TabsTrigger>
          <TabsTrigger value="returned">Returned ({returned.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
          <TabsTrigger value="released">Released ({released.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="draft" className="mt-4">
          <Card>
            <CardContent className="pt-4">{renderList(draft, "No draft submissions.")}</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="submitted" className="mt-4">
          <Card>
            <CardContent className="pt-4">{renderList(submitted, "None awaiting registrar.")}</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="returned" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              {renderList(returned, "None returned for edits.", { showActionNeeded: true })}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="approved" className="mt-4">
          <Card>
            <CardContent className="pt-4">{renderList(approved, "None approved yet.")}</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="released" className="mt-4">
          <Card>
            <CardContent className="pt-4">{renderList(released, "None released yet.")}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
