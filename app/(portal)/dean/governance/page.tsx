import { getGovernanceFlags } from "@/lib/dean/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResolveFlagButton } from "./ResolveFlagButton";
import { GovernanceFlagForm } from "./GovernanceFlagForm";

export const dynamic = "force-dynamic";

export default async function DeanGovernancePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = (params.status as "active" | "resolved") || undefined;
  const [activeFlags, resolvedFlags] = await Promise.all([
    getGovernanceFlags({ status: "active" }),
    getGovernanceFlags({ status: "resolved" }),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Governance / Holds
        </h2>
        <p className="mt-1 text-sm text-neutral-800">
          Create and resolve governance flags (finance hold, academic hold, etc.). Auditable.
        </p>
      </section>

      <GovernanceFlagForm />

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-neutral-900">
              Active Flags ({activeFlags.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border bg-white/80 text-sm">
              <table className="min-w-full">
                <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                  <tr>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Enrollment / Student</th>
                    <th className="px-4 py-2 text-left">Notes</th>
                    <th className="px-4 py-2 text-right">Created</th>
                    <th className="px-4 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeFlags.map((f) => (
                    <tr key={f.id} className="border-b last:border-0">
                      <td className="px-4 py-2">{f.flagType}</td>
                      <td className="px-4 py-2">
                        {f.enrollmentId?.slice(0, 8) ?? "—"} / {f.studentId?.slice(0, 8) ?? "—"}
                      </td>
                      <td className="px-4 py-2 max-w-[200px] truncate">{f.notes ?? "—"}</td>
                      <td className="px-4 py-2 text-right">
                        {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-2">
                        <ResolveFlagButton flagId={f.id} />
                      </td>
                    </tr>
                  ))}
                  {activeFlags.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-center text-neutral-600">
                        No active flags
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-neutral-900">
              Resolved Flags ({resolvedFlags.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border bg-white/80 text-sm">
              <table className="min-w-full">
                <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                  <tr>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Notes</th>
                    <th className="px-4 py-2 text-right">Resolved</th>
                  </tr>
                </thead>
                <tbody>
                  {resolvedFlags.map((f) => (
                    <tr key={f.id} className="border-b last:border-0">
                      <td className="px-4 py-2">{f.flagType}</td>
                      <td className="px-4 py-2 max-w-[200px] truncate">{f.notes ?? "—"}</td>
                      <td className="px-4 py-2 text-right">
                        {f.resolvedAt ? new Date(f.resolvedAt).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                  {resolvedFlags.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-4 text-center text-neutral-600">
                        None
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

