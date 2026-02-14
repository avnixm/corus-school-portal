import { getGradesWithSubjectsByStudentId } from "@/db/queries";
import { getCurrentStudent } from "@/lib/auth/getCurrentStudent";

export default async function GradesPage() {
  const current = await getCurrentStudent();
  const studentId = current?.studentId;

  const grades = studentId
    ? await getGradesWithSubjectsByStudentId(studentId, 20)
    : [];

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">Grades</h2>
        <p className="text-sm text-neutral-700">
          Recent grades from your junior and senior high subjects.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white/80 text-neutral-900">
        <table className="min-w-full text-left text-sm text-neutral-900">
          <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
            <tr>
              <th className="px-4 py-2">Subject</th>
              <th className="px-4 py-2">Description</th>
              <th className="px-4 py-2">Level</th>
              <th className="px-4 py-2 text-right">Grade</th>
            </tr>
          </thead>
          <tbody>
            {grades.map((row, idx) => (
              <tr
                key={idx}
                className="border-b last:border-0 hover:bg-neutral-50/80"
              >
                <td className="px-4 py-2 font-medium text-[#6A0000]">
                  {row.subjectCode ?? "—"}
                </td>
                <td className="px-4 py-2">
                  {row.subjectDescription ?? "—"}
                </td>
                <td className="px-4 py-2 uppercase text-xs text-neutral-700">
                  {row.levelType ?? "—"}
                </td>
                <td className="px-4 py-2 text-right font-semibold text-[#6A0000]">
                  {row.grade ?? "—"}
                </td>
              </tr>
            ))}
            {grades.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-sm text-neutral-700"
                >
                  No grades yet for your account.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
