import { listScheduleTimeConfigs } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApproveRejectButtons } from "./ApproveRejectButtons";

export const dynamic = "force-dynamic";

export const metadata = { title: "Schedule Time Configurations" };

function formatTime(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:00 ${period}`;
}

export default async function DeanScheduleTimeConfigPage() {
  const [submitted, approved, rejected] = await Promise.all([
    listScheduleTimeConfigs({ status: "submitted" }),
    listScheduleTimeConfigs({ status: "approved" }),
    listScheduleTimeConfigs({ status: "rejected" }),
  ]);

  function renderTable(configs: Awaited<ReturnType<typeof listScheduleTimeConfigs>>, showActions: boolean) {
    return (
      <div className="overflow-x-auto rounded-xl border bg-white/80">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
            <tr>
              <th className="px-4 py-2">Program</th>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Time Range</th>
              <th className="px-4 py-2">Increment</th>
              <th className="px-4 py-2">Submitted</th>
              {showActions && <th className="px-4 py-2 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {configs.map((config) => (
              <tr key={config.id} className="border-b last:border-0 hover:bg-neutral-50/80">
                <td className="px-4 py-2 font-medium">{config.programCode}</td>
                <td className="px-4 py-2">{config.title}</td>
                <td className="px-4 py-2">
                  {formatTime(config.startHour)} - {formatTime(config.endHour)}
                </td>
                <td className="px-4 py-2">{config.timeIncrement} mins</td>
                <td className="px-4 py-2">
                  {config.submittedAt ? new Date(config.submittedAt).toLocaleDateString() : "—"}
                </td>
                {showActions && (
                  <td className="px-4 py-2 text-right">
                    <ApproveRejectButtons configId={config.id} />
                  </td>
                )}
              </tr>
            ))}
            {configs.length === 0 && (
              <tr>
                <td colSpan={showActions ? 6 : 5} className="px-4 py-8 text-center text-neutral-600">
                  No configurations found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Schedule Time Configurations
        </h2>
        <p className="text-sm text-neutral-800 mt-1">
          Review and approve time slot configurations for class scheduling.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">
            Pending Approval ({submitted.length})
          </CardTitle>
        </CardHeader>
        <CardContent>{renderTable(submitted, true)}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">
            Approved ({approved.length})
          </CardTitle>
        </CardHeader>
        <CardContent>{renderTable(approved, false)}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">
            Rejected ({rejected.length})
          </CardTitle>
        </CardHeader>
        <CardContent>{renderTable(rejected, false)}</CardContent>
      </Card>
    </div>
  );
}
