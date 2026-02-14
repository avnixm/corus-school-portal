import Link from "next/link";
import { getQueueSubmissions } from "@/db/queries";
import { getSchoolYearsList, getTermsList, getProgramsList } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QueueFilters } from "./QueueFilters";
import { QueueTable } from "./QueueTable";

export const dynamic = "force-dynamic";

export default async function RegistrarRequirementsQueuePage({
  searchParams,
}: {
  searchParams: Promise<{
    schoolYearId?: string;
    termId?: string;
    program?: string;
    search?: string;
  }>;
}) {
  const params = await searchParams;
  const [rows, schoolYears, terms, programs] = await Promise.all([
    getQueueSubmissions(params),
    getSchoolYearsList(),
    getTermsList(),
    getProgramsList(true),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/registrar/requirements"
            className="text-sm text-[#6A0000] hover:underline"
          >
            ← Back to requirements
          </Link>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#6A0000]">
            Verification queue
          </h2>
          <p className="text-sm text-neutral-800">
            Review and verify or reject submitted requirement documents.
          </p>
        </div>
      </div>

      <QueueFilters
        schoolYears={schoolYears}
        terms={terms}
        programs={programs}
        current={params}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-[#6A0000]">
            Submissions ({rows.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <QueueTable rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
