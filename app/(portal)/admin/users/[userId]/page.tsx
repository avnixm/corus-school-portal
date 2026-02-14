import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getUserProfileByUserId,
  getAuditLogPage,
  getProgramHeadAssignmentsList,
} from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleSelect } from "../RoleSelect";
import { SetActiveButton } from "../SetActiveButton";
import { UpdatePasswordButton } from "../UpdatePasswordButton";

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const profile = await getUserProfileByUserId(userId);
  if (!profile) notFound();

  const [assignments, auditRows] = await Promise.all([
    getProgramHeadAssignmentsList({ userId }),
    getAuditLogPage({
      entityType: "user_profile",
      entityId: userId,
      limit: 20,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/users"
          className="text-sm font-medium text-[#6A0000] hover:underline"
        >
          ← Back to Users
        </Link>
      </div>

      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          User: {profile.fullName ?? profile.userId.slice(0, 8)}
        </h2>
        <p className="text-sm text-neutral-600">ID: {profile.userId}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <span className="font-medium text-neutral-500">Email</span>
              <p>{profile.email ?? "—"}</p>
            </div>
            <div>
              <span className="font-medium text-neutral-500">Full name</span>
              <p>{profile.fullName ?? "—"}</p>
            </div>
            <div>
              <span className="font-medium text-neutral-500">Role</span>
              <p>
                <RoleSelect profileId={profile.id} currentRole={profile.role} />
              </p>
            </div>
            <div>
              <span className="font-medium text-neutral-500">Active</span>
              <p>
                <SetActiveButton userId={profile.userId} active={profile.active} />
              </p>
            </div>
            <div>
              <span className="font-medium text-neutral-500">Program (scope)</span>
              <p>{profile.program ?? "—"}</p>
            </div>
            <div>
              <span className="font-medium text-neutral-500">Created</span>
              <p>
                {profile.createdAt
                  ? new Date(profile.createdAt).toLocaleString()
                  : "—"}
              </p>
            </div>
          </div>
          <div>
            <span className="font-medium text-neutral-500">Password</span>
            <p className="mt-1">
              <UpdatePasswordButton
                authUserId={profile.userId}
                userEmail={profile.email}
              />
            </p>
          </div>
        </CardContent>
      </Card>

      {profile.role === "program_head" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Program Head Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {assignments.length > 0 ? (
              <ul className="list-inside list-disc text-sm">
                {assignments.map((a) => (
                  <li key={a.id}>
                    {a.programCode}
                    {!a.active && " (inactive)"}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-500">No program assignments</p>
            )}
            <Link
              href="/admin/programs"
              className="mt-2 inline-block text-sm text-[#6A0000] hover:underline"
            >
              Manage in Program Assignments →
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audit History</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {auditRows.map((r) => (
              <li key={r.id} className="flex justify-between gap-4">
                <span>
                  {r.action} · {r.entityType}{" "}
                  {r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}
                </span>
                <Link
                  href={`/admin/audit?entity=${r.entityId ?? ""}`}
                  className="text-[#6A0000] hover:underline"
                >
                  View
                </Link>
              </li>
            ))}
            {auditRows.length === 0 && (
              <li className="text-neutral-500">No audit entries</li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
