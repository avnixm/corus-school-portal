// path: app/(portal)/registrar/grades/page.tsx
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { redirect } from "next/navigation";
import {
  getActiveSchoolYear,
  getActiveTerm,
  getTermsBySchoolYearId,
  getSchoolYearsList,
  listGradeSubmissionsForRegistrar,
} from "@/db/queries";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RegistrarGradesFilters } from "./RegistrarGradesFilters";

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

export const metadata = { title: "Grades" };

export default async function RegistrarGradesPage({
  searchParams,
}: {
  searchParams: Promise<{ schoolYearId?: string; termId?: string }>;
}) {
  const user = await getCurrentUserWithRole();
  if (!user || (user.role !== "registrar" && user.role !== "admin")) redirect("/not-authorized");
  const params = await searchParams;
  const schoolYears = await getSchoolYearsList();
  const activeSy = await getActiveSchoolYear();
  const terms = params.schoolYearId
    ? await getTermsBySchoolYearId(params.schoolYearId)
    : activeSy
    ? await getTermsBySchoolYearId(activeSy.id)
    : [];
  const syId = params.schoolYearId ?? activeSy?.id;
  const termId = params.termId ?? (await getActiveTerm())?.id;
  const filters = { schoolYearId: syId, termId: termId ?? undefined };
  const [submitted, returned, approved, released] = await Promise.all([
    listGradeSubmissionsForRegistrar({ ...filters, status: "submitted" }),
    listGradeSubmissionsForRegistrar({ ...filters, status: "returned" }),
    listGradeSubmissionsForRegistrar({ ...filters, status: "approved" }),
    listGradeSubmissionsForRegistrar({ ...filters, status: "released" }),
  ]);

  const renderList = (
    items: Awaited<ReturnType<typeof listGradeSubmissionsForRegistrar>>,
    emptyMsg: string
  ) => (
    <div className="space-y-2">
      {items.map((s) => (
        <Link
          key={s.id}
          href={`/registrar/grades/${s.id}`}
          className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-neutral-50"
        >
          <div>
            <span className="font-medium text-[#6A0000]">
              {s.subjectCode} — {s.sectionName} ({s.gradingPeriodName})
            </span>
            <span className="ml-2 text-xs text-neutral-600">
              {s.teacherFirstName} {s.teacherLastName}
            </span>
          </div>
          <div className="flex items-center gap-2">
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
          Grade releases
        </h2>
        <p className="mt-1 text-sm text-neutral-800">
          Review and approve grade submissions from teachers.
        </p>
      </section>

      <RegistrarGradesFilters
        schoolYears={schoolYears}
        terms={terms}
        currentSchoolYearId={syId ?? undefined}
        currentTermId={termId ?? undefined}
      />

      <Tabs defaultValue="submitted">
        <TabsList className="bg-neutral-100">
          <TabsTrigger value="submitted">Submitted ({submitted.length})</TabsTrigger>
          <TabsTrigger value="returned">Returned ({returned.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
          <TabsTrigger value="released">Released ({released.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="submitted" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              {renderList(submitted, "No submissions awaiting review.")}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="returned" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              {renderList(returned, "None returned.")}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="approved" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              {renderList(approved, "None approved yet.")}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="released" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              {renderList(released, "None released yet.")}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
