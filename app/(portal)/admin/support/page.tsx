import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { listSupportRequests } from "@/db/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Support Requests" };

export default async function AdminSupportRequestsPage() {
  const user = await getCurrentUserWithRole();
  if (!user || user.role !== "admin") redirect("/not-authorized");

  const rows = await listSupportRequests(200);

  return (
    <div className="space-y-6 text-neutral-900">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Support Requests
        </h2>
        <p className="text-sm text-neutral-800">
          Requests submitted from the “Contact support” form (e.g. inactive accounts).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-neutral-900">
            Recent ({rows.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border bg-white text-sm">
            <table className="min-w-full text-left">
              <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2">Time</th>
                  <th className="px-4 py-2">Reason</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Phone</th>
                  <th className="px-4 py-2">Message</th>
                  <th className="px-4 py-2">User ID</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 align-top">
                    <td className="px-4 py-2 text-neutral-800">
                      {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-2">{r.reason}</td>
                    <td className="px-4 py-2">{r.email ?? "—"}</td>
                    <td className="px-4 py-2">{r.phone ?? "—"}</td>
                    <td className="px-4 py-2">
                      <pre className="max-w-[560px] whitespace-pre-wrap rounded bg-neutral-50 p-2 text-xs text-neutral-800">
                        {r.message}
                      </pre>
                    </td>
                    <td className="px-4 py-2">
                      {r.userId ? (
                        <Link
                          href={`/admin/users/${r.userId}`}
                          className="text-[#6A0000] hover:underline"
                        >
                          {r.userId}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-neutral-600">
                      No support requests yet.
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

