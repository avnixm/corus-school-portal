// path: app/(portal)/teacher/classes/page.tsx
import { getClassesWithPeriodStatuses } from "../actions";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TeacherClassesFilters } from "@/app/(portal)/teacher/classes/TeacherClassesFilters";

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

export const metadata = { title: "Classes" };

export default async function TeacherClassesPage({
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

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
            My Classes
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

      <div className="grid gap-4 md:grid-cols-2">
        {classesWithStatuses.map((c) => (
          <Link key={c.scheduleId} href={`/teacher/classes/${c.scheduleId}`}>
            <Card className="transition-colors hover:bg-neutral-50/80">
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
                <div className="flex flex-wrap gap-1">
                  {c.periodStatuses.map((ps) => (
                    <Badge
                      key={ps.periodId}
                      variant="outline"
                      className={`text-xs ${periodStatusBadge(ps.status)}`}
                    >
                      {ps.periodName}: {(ps.status as string) === "none" ? "—" : ps.status}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {(!classesWithStatuses || classesWithStatuses.length === 0) && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-neutral-700">
            No classes assigned for the selected term. Contact the registrar.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
