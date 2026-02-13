import { getRequirementsList, getRequirementVerificationsSubmitted } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateRequirementForm } from "./CreateRequirementForm";

import Link from "next/link";
import { RequirementVerificationActions } from "./RequirementVerificationActions";

export const dynamic = "force-dynamic";

function fullName(row: { firstName: string; lastName: string }) {
  return [row.firstName, row.lastName].filter(Boolean).join(" ");
}

export default async function RequirementsPage() {
  const [requirements, verifications] = await Promise.all([
    getRequirementsList(false),
    getRequirementVerificationsSubmitted(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Requirements
        </h2>
        <p className="text-sm text-neutral-800">
          Master requirements and student verification queue.
        </p>
      </div>

      <CreateRequirementForm />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-[#6A0000]">
            Master Requirements ({requirements.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border bg-white/80">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Description</th>
                  <th className="px-4 py-2">Active</th>
                </tr>
              </thead>
              <tbody>
                {requirements.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b last:border-0 hover:bg-neutral-50/80"
                  >
                    <td className="px-4 py-2 font-medium">{row.name}</td>
                    <td className="px-4 py-2">{row.description ?? "—"}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          row.active ? "bg-green-100 text-green-800" : "bg-neutral-200 text-neutral-800"
                        }`}
                      >
                        {row.active ? "Yes" : "No"}
                      </span>
                    </td>
                  </tr>
                ))}
                {requirements.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-sm text-neutral-800"
                    >
                      No requirements yet.
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
          <CardTitle className="text-sm font-semibold text-[#6A0000]">
            Verification Queue (submitted)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border bg-white/80">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2">Student</th>
                  <th className="px-4 py-2">Requirement</th>
                  <th className="px-4 py-2">Student No</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {verifications.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b last:border-0 hover:bg-neutral-50/80"
                  >
                    <td className="px-4 py-2">
                      <Link
                        href={`/registrar/students/${row.studentId}`}
                        className="font-medium text-[#6A0000] hover:underline"
                      >
                        {fullName(row)}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{row.requirementName}</td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {row.studentCode ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <RequirementVerificationActions verificationId={row.id} />
                    </td>
                  </tr>
                ))}
                {verifications.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-sm text-neutral-800"
                    >
                      No requirements awaiting verification.
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
