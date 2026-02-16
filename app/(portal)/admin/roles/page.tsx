import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export const dynamic = "force-dynamic";

const ROLE_DEFINITIONS: Record<string, string> = {
  admin:
    "Superuser. Manages users, roles, program assignments, system settings, audit log, data tools, and system health. Does not approve enrollments or post payments unless explicitly given override.",
  student:
    "Enrolled student. Can view own schedule, grades, enrollment status, and announcements.",
  teacher:
    "Faculty. Can submit grades for assigned sections, view teaching schedule and class lists.",
  registrar:
    "Registrar office. Approves/rejects enrollments, releases grades, manages students, sections, schedules, and requirements.",
  finance:
    "Finance office. Posts assessments, records payments, and manages enrollment finance status.",
  program_head:
    "Program head. Oversees one or more programs; can view analytics and approvals for assigned programs.",
  dean:
    "Dean. Academic oversight; can view analytics and approvals at school level.",
};

const PERMISSIONS = [
  { action: "Manage users & roles", admin: true, registrar: false, finance: false, teacher: false, student: false, program_head: false, dean: false },
  { action: "Set active school year/term", admin: true, registrar: false, finance: false, teacher: false, student: false, program_head: false, dean: false },
  { action: "Approve enrollments", admin: false, registrar: true, finance: false, teacher: false, student: false, program_head: false, dean: false },
  { action: "Release grades", admin: false, registrar: true, finance: false, teacher: false, student: false, program_head: false, dean: false },
  { action: "Post payments/assessments", admin: false, registrar: false, finance: true, teacher: false, student: false, program_head: false, dean: false },
  { action: "Submit grades", admin: false, registrar: false, finance: false, teacher: true, student: false, program_head: false, dean: false },
  { action: "View own schedule/grades", admin: false, registrar: false, finance: false, teacher: false, student: true, program_head: false, dean: false },
  { action: "View program analytics", admin: true, registrar: true, finance: false, teacher: false, student: false, program_head: true, dean: true },
];

export const metadata = { title: "Roles" };

export default async function AdminRolesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Roles & Access
        </h2>
        <p className="text-sm text-neutral-600">
          Role definitions and permission matrix. Change roles in{" "}
          <Link href="/admin/users" className="text-[#6A0000] hover:underline">
            User Management
          </Link>
          .
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Role Definitions</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3 text-sm">
            {Object.entries(ROLE_DEFINITIONS).map(([role, desc]) => (
              <div key={role}>
                <dt className="font-medium capitalize text-[#6A0000]">
                  {role.replace(/_/g, " ")}
                </dt>
                <dd className="mt-0.5 text-neutral-800">{desc}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Permission Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-neutral-900">
              <thead className="border-b bg-neutral-50 font-medium text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2">Action</th>
                  <th className="px-4 py-2">Admin</th>
                  <th className="px-4 py-2">Registrar</th>
                  <th className="px-4 py-2">Finance</th>
                  <th className="px-4 py-2">Teacher</th>
                  <th className="px-4 py-2">Student</th>
                  <th className="px-4 py-2">Program Head</th>
                  <th className="px-4 py-2">Dean</th>
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map((row, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-2 text-neutral-900">{row.action}</td>
                    <td className="px-4 py-2 text-neutral-900">{row.admin ? "✓" : "—"}</td>
                    <td className="px-4 py-2 text-neutral-900">{row.registrar ? "✓" : "—"}</td>
                    <td className="px-4 py-2 text-neutral-900">{row.finance ? "✓" : "—"}</td>
                    <td className="px-4 py-2 text-neutral-900">{row.teacher ? "✓" : "—"}</td>
                    <td className="px-4 py-2 text-neutral-900">{row.student ? "✓" : "—"}</td>
                    <td className="px-4 py-2 text-neutral-900">{row.program_head ? "✓" : "—"}</td>
                    <td className="px-4 py-2 text-neutral-900">{row.dean ? "✓" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
