import Link from "next/link";
import { Suspense } from "react";
import { getStudentsList } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreateStudentForm } from "./CreateStudentForm";
import { StudentsSearch } from "./StudentsSearch";

export const dynamic = "force-dynamic";

function fullName(row: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
}) {
  return [row.firstName, row.middleName, row.lastName].filter(Boolean).join(" ");
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const studentsList = await getStudentsList(search);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
            Students
          </h2>
          <p className="text-sm text-neutral-700">
            Manage student records.
          </p>
        </div>
        <CreateStudentForm />
      </div>

      <Suspense fallback={<div className="h-10" />}>
        <StudentsSearch />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">
            All students ({studentsList.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border bg-white/80">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2">Student No</th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Contact</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {studentsList.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b last:border-0 hover:bg-neutral-50/80"
                  >
                    <td className="px-4 py-2 font-mono text-xs">
                      {row.studentCode ?? "—"}
                    </td>
                    <td className="px-4 py-2 font-medium">
                      <Link
                        href={`/registrar/students/${row.id}`}
                        className="text-[#6A0000] hover:underline"
                      >
                        {fullName(row)}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{row.email ?? "—"}</td>
                    <td className="px-4 py-2">{row.contactNo ?? "—"}</td>
                    <td className="px-4 py-2 text-right">
                      <Link href={`/registrar/students/${row.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
                {studentsList.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-neutral-700"
                    >
                      No students found.
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
