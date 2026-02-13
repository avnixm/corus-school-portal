import { getUsersList } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateUserForm } from "./CreateUserForm";
import { RoleSelect } from "./RoleSelect";
import { UpdatePasswordButton } from "./UpdatePasswordButton";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await getUsersList();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Users
        </h2>
        <p className="text-sm text-neutral-800">
          Create and manage test accounts. Admin-created users skip email verification.
        </p>
      </div>

      <CreateUserForm />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">
            All users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border bg-white/80">
            <table className="min-w-full text-left text-sm text-neutral-900">
              <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Role</th>
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
                    <td className="px-4 py-2 font-medium">{row.email ?? "—"}</td>
                    <td className="px-4 py-2">{row.fullName ?? "—"}</td>
                    <td className="px-4 py-2">
                      <RoleSelect profileId={row.id} currentRole={row.role} />
                    </td>
                    <td className="px-4 py-2 text-neutral-800">
                      {row.createdAt
                        ? new Date(row.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-2">
                      {row.emailVerificationBypassed ? (
                        <span className="text-xs text-amber-600">
                          Bypassed (admin)
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-800">
                          Standard
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
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
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm text-neutral-800"
                    >
                      No users yet. Create one above.
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
