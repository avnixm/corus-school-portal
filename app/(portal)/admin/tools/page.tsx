import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToolsActions } from "./ToolsActions";

export const dynamic = "force-dynamic";

export default async function AdminToolsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Data Tools
        </h2>
        <p className="text-sm text-neutral-600">
          Safe operational tools. Every run is logged in the audit log.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seed defaults</CardTitle>
        </CardHeader>
        <CardContent>
          <ToolsActions />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recompute / correct caches</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-neutral-600">
            Recompute enrollment balances from ledger entries (finance cache).
          </p>
          <ToolsActions variant="recompute" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Import (stub)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-neutral-600">
            Placeholder for CSV import. No actual parsing.
          </p>
          <ToolsActions variant="import" />
        </CardContent>
      </Card>
    </div>
  );
}
