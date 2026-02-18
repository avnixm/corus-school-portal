// path: app/(portal)/teacher/gradebook/page.tsx
import { getClassesWithPeriodStatuses } from "../actions";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NotebookPen } from "lucide-react";
import { TeacherClassesFilters } from "@/app/(portal)/teacher/classes/TeacherClassesFilters";
import { formatStatusForDisplay } from "@/lib/formatStatus";

export const dynamic = "force-dynamic";

function periodStatusBadge(status: string) {
  const map: Record<string, string> = {
    draft: "border-neutral-400 text-neutral-600",
    submitted: "border-amber-500 text-amber-700",
    returned: "border-red-500 text-red-700",
    approved: "border-blue-500 text-blue-700",
    released: "border-green-500 text-green-700",
    none: "border-neutral-300 text-neutral-500",
  };
  return map[status] ?? "border-neutral-300";
}

export const metadata = { title: "Gradebook" };

export default async function TeacherGradebookLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ sy?: string; term?: string }>;
}) {
  const params = await searchParams;
  const data = await getClassesWithPeriodStatuses({
    schoolYearId: params.sy ?? undefined,
    termId: params.term ?? undefined,
  });
  const { classesWithStatuses, schoolYear, term, schoolYears, terms } = data;

  const hasAnyPeriods = classesWithStatuses.some((c) => c.periodStatuses.length > 0);
  const showNoPeriodsMessage = classesWithStatuses.length > 0 && !hasAnyPeriods;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
            Gradebook
          </h2>
          <p className="mt-1 text-sm text-neutral-800">
            {schoolYear?.name ?? "—"} • {term?.name ?? "—"}
          </p>
        </div>
        <TeacherClassesFilters
          schoolYears={schoolYears}
          terms={terms}
          currentSchoolYearId={params.sy ?? schoolYear?.id ?? ""}
          currentTermId={params.term ?? term?.id ?? ""}
        />
      </section>

      {showNoPeriodsMessage && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="py-4">
            <p className="text-sm text-amber-800">
              No grading periods set for this term. Ask your administrator to create them in{" "}
              <strong>Admin → Tools</strong> (&quot;Create default grading periods&quot;).
            </p>
            <Link href="/teacher/classes" className="mt-2 inline-block text-sm font-medium text-[#6A0000] hover:underline">
              View My Classes →
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {classesWithStatuses.map((c) => (
          <Card key={c.scheduleId} className="transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-[#6A0000]">
                {c.subjectCode} — {c.subjectDescription}
              </CardTitle>
              <p className="text-sm text-neutral-600">
                Section {c.sectionName} • {c.timeIn ?? "—"}–{c.timeOut ?? "—"}
                {c.room ? ` • ${c.room}` : ""}
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-neutral-500">
                {c.schoolYearName} • {c.termName}
              </p>
              {c.periodStatuses.length === 0 ? (
                <p className="text-xs text-neutral-500">No grading periods for this term.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {c.periodStatuses.map((ps) => (
                    <div
                      key={ps.periodId}
                      className="flex items-center gap-2 rounded-lg border px-3 py-2"
                    >
                      <Badge
                        variant="outline"
                        className={`text-xs ${periodStatusBadge(ps.status)}`}
                      >
                        {ps.periodName}: {(ps.status as string) === "none" ? "—" : formatStatusForDisplay(ps.status)}
                      </Badge>
                      <Link href={`/teacher/gradebook/${c.scheduleId}/${ps.periodId}`}>
                        <Button size="sm" variant="outline" className="border-[#6A0000]/40 text-[#6A0000]">
                          <NotebookPen className="mr-1 h-3 w-3" />
                          Open
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
              <Link
                href={`/teacher/classes/${c.scheduleId}`}
                className="inline-block text-xs font-medium text-[#6A0000] hover:underline"
              >
                Class details →
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!classesWithStatuses || classesWithStatuses.length === 0) && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-neutral-700">
            No classes assigned for the selected term.{" "}
            <Link href="/teacher/classes" className="font-medium text-[#6A0000] hover:underline">
              View My Classes
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
