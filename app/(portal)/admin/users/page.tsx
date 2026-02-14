import Link from "next/link";
import { getUsersListSearch } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateUserForm } from "./CreateUserForm";
import { CreateLocalProfileForm } from "./CreateLocalProfileForm";
import { RoleSelect } from "./RoleSelect";
import { UpdatePasswordButton } from "./UpdatePasswordButton";

import { UserManagementSearch } from "./UserManagementSearch";
import { SetActiveButton } from "./SetActiveButton";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string; role?: string }>;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const users = await getUsersListSearch({ q: params.q, role: params.role });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          User Management
        </h2>
        <p className="text-sm text-neutral-800">
          Create and manage users and roles. Admin-created users skip email verification.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <CreateUserForm />
        <CreateLocalProfileForm />
      </div>

      <UserManagementSearch />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">
            All users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border bg-white/80 text-sm text-neutral-900">
            <table className="min-w-full text-left text-neutral-900">
              <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Role</th>
                  <th className="px-4 py-2">Active</th>
                  <th className="px-4 py-2">Created</th>
                  <th className="px-4 py-2">Verification</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b last:border-0 hover:bg-neutral-50/80"
                  >
                    <td className="px-4 py-2 font-medium text-neutral-900">{row.email ?? "—"}</td>
                    <td className="px-4 py-2 text-neutral-900">
                      <Link
                        href={`/admin/users/${row.userId}`}
                        className="font-medium text-[#6A0000] hover:underline"
                      >
                        {row.fullName ?? row.userId.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-neutral-900">
                      <RoleSelect profileId={row.id} currentRole={row.role} />
                    </td>
                    <td className="px-4 py-2 text-neutral-900">
                      <SetActiveButton
                        userId={row.userId}
                        active={row.active}
                      />
                    </td>
                    <td className="px-4 py-2 text-neutral-900">
                      {row.createdAt
                        ? new Date(row.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-neutral-900">
                      {row.emailVerificationBypassed ? (
                        <span className="text-xs text-amber-600">
                          Bypassed (admin)
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-700">
                          Standard
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-neutral-900">
                      <UpdatePasswordButton
                        authUserId={row.userId}
                        userEmail={row.email}
                      />
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-sm text-neutral-700"
                    >
                      No users found. Create one above or adjust search.
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
