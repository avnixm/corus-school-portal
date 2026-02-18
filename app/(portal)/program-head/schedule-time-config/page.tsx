import { listScheduleTimeConfigs, getProgramsList } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateTimeConfigButton } from "./CreateTimeConfigButton";
import { TimeConfigRowActions } from "./TimeConfigRowActions";
import { Badge } from "@/components/ui/badge";
import { formatStatusForDisplay } from "@/lib/formatStatus";

export const dynamic = "force-dynamic";

export const metadata = { title: "Schedule Time Configuration" };

function formatTime(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:00 ${period}`;
}

export default async function ScheduleTimeConfigPage() {
  const [configs, programs] = await Promise.all([
    listScheduleTimeConfigs(),
    getProgramsList(true),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Schedule Time Configuration
        </h2>
        <p className="text-sm text-neutral-800 mt-1">
          Configure allowed time slots for class scheduling. Requires Dean approval.
        </p>
      </div>

      <CreateTimeConfigButton programs={programs} />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">
            Time Configurations ({configs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border bg-white/80">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2">Program</th>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Time Range</th>
                  <th className="px-4 py-2">Increment</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="w-[1%] whitespace-nowrap px-4 py-2 text-right">Actions</th>
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
                      <Badge
                        variant="outline"
                        className={
                          config.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : config.status === "submitted"
                              ? "bg-blue-100 text-blue-800"
                              : config.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : ""
                        }
                      >
                        {formatStatusForDisplay(config.status)}
                      </Badge>
                    </td>
                    <td className="w-[1%] whitespace-nowrap px-4 py-2 text-right">
                      <TimeConfigRowActions config={config} />
                    </td>
                  </tr>
                ))}
                {configs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-neutral-600">
                      No time configurations yet. Create one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
