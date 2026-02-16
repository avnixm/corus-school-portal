import { getCollectionsReport } from "@/lib/finance/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CollectionsReportFilters } from "./CollectionsReportFilters";

export const dynamic = "force-dynamic";

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  gcash: "GCash",
  bank: "Bank",
  card: "Card",
  other: "Other",
};

export const metadata = { title: "Collections Report" };

export default async function CollectionsReportPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const startParam = params.start;
  const endParam = params.end;
  const startDate = startParam
    ? new Date(startParam)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = endParam ? new Date(endParam) : new Date();

  const report = await getCollectionsReport(startDate, endDate);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Collections Report
        </h2>
        <p className="text-sm text-neutral-800">
          View collections by date range.
        </p>
      </div>

      <CollectionsReportFilters
        defaultStart={startDate.toISOString().slice(0, 10)}
        defaultEnd={endDate.toISOString().slice(0, 10)}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#6A0000]">
              Total Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#6A0000]">
              ₱{report.total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </div>
            <p className="mt-1 text-xs text-neutral-800">
              {report.count} payment(s)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#6A0000]">
              By Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(report.byMethod).map(([method, total]) => (
                <div
                  key={method}
                  className="flex justify-between text-sm"
                >
                  <span>{METHOD_LABELS[method] ?? method}</span>
                  <span className="font-medium">
                    ₱{total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
              {Object.keys(report.byMethod).length === 0 && (
                <p className="text-sm text-neutral-600">No payments in range</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
