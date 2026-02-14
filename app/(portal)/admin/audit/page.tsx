import { getAuditLogPage } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuditFilters } from "./AuditFilters";
import { AuditTable } from "./AuditTable";


export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  from?: string;
  to?: string;
  actor?: string;
  action?: string;
  entity?: string;
  page?: string;
}>;

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const fromDate = params.from ? new Date(params.from) : undefined;
  const toDate = params.to ? new Date(params.to) : undefined;
  const page = Math.max(0, parseInt(params.page ?? "0", 10));
  const limit = 50;

  const rows = await getAuditLogPage({
    fromDate,
    toDate,
    actorUserId: params.actor || undefined,
    action: params.action || undefined,
    entityType: params.entity || undefined,
    limit,
    offset: page * limit,
  });

  return (
    <div className="space-y-6 text-neutral-900">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Audit Log
        </h2>
        <p className="text-sm text-neutral-800">
          Read-only log of admin and system actions.
        </p>
      </div>

      <AuditFilters />

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-neutral-900">Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditTable rows={rows} page={page} limit={limit} searchParams={params} />
        </CardContent>
      </Card>
    </div>
  );
}
