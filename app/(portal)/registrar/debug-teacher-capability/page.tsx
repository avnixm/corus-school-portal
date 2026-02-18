import { db } from "@/lib/db";
import { subjects, teacherSubjectCapabilities, userProfile } from "@/db/schema";
import { eq, and, like } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function DebugTeacherCapabilityPage() {
  // Find all CC102 subjects
  const cc102Subjects = await db
    .select()
    .from(subjects)
    .where(like(subjects.code, "CC102%"))
    .orderBy(subjects.code);

  // Find Elizor's capabilities
  const elizorCapabilities = await db
    .select({
      capabilityId: teacherSubjectCapabilities.id,
      capabilityStatus: teacherSubjectCapabilities.status,
      teacherName: userProfile.fullName,
      teacherId: userProfile.id,
      teacherRole: userProfile.role,
      teacherActive: userProfile.active,
      subjectId: subjects.id,
      subjectCode: subjects.code,
      subjectTitle: subjects.title,
      subjectActive: subjects.active,
    })
    .from(teacherSubjectCapabilities)
    .innerJoin(userProfile, eq(teacherSubjectCapabilities.teacherUserProfileId, userProfile.id))
    .innerJoin(subjects, eq(teacherSubjectCapabilities.subjectId, subjects.id))
    .where(
      and(
        like(userProfile.fullName, "%Elizor%"),
        like(subjects.code, "CC102%")
      )
    );

  // Test the exact query used by schedule creation
  const testSubjectId = cc102Subjects[0]?.id;
  let eligibleForFirstCC102: any[] = [];
  if (testSubjectId) {
    eligibleForFirstCC102 = await db
      .select({
        teacherId: userProfile.id,
        teacherName: userProfile.fullName,
        email: userProfile.email,
      })
      .from(teacherSubjectCapabilities)
      .innerJoin(userProfile, eq(teacherSubjectCapabilities.teacherUserProfileId, userProfile.id))
      .where(
        and(
          eq(teacherSubjectCapabilities.subjectId, testSubjectId),
          eq(teacherSubjectCapabilities.status, "active"),
          eq(userProfile.active, true),
          eq(userProfile.role, "teacher")
        )
      );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#6A0000]">Teacher Capability Debug</h1>
        <p className="text-sm text-neutral-600 mt-2">Diagnosing why Elizor doesn't appear in schedule creation dropdown</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#6A0000]">1. All CC102 Subjects in Database</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Code</th>
                <th className="px-4 py-2 text-left">Title</th>
                <th className="px-4 py-2 text-left">Program ID</th>
                <th className="px-4 py-2 text-left">Is GE</th>
                <th className="px-4 py-2 text-left">Active</th>
              </tr>
            </thead>
            <tbody>
              {cc102Subjects.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="px-4 py-2 font-mono text-xs">{s.id}</td>
                  <td className="px-4 py-2 font-semibold">{s.code}</td>
                  <td className="px-4 py-2">{s.title}</td>
                  <td className="px-4 py-2 font-mono text-xs">{s.programId ?? "—"}</td>
                  <td className="px-4 py-2">{s.isGe ? "✅ Yes" : "❌ No"}</td>
                  <td className="px-4 py-2">
                    {s.active ? (
                      <span className="text-green-600">✅ Active</span>
                    ) : (
                      <span className="text-red-600">❌ Inactive</span>
                    )}
                  </td>
                </tr>
              ))}
              {cc102Subjects.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                    No CC102 subjects found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#6A0000]">2. Elizor's CC102 Capabilities</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-2 text-left">Teacher</th>
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-left">Active</th>
                <th className="px-4 py-2 text-left">Subject ID</th>
                <th className="px-4 py-2 text-left">Subject Code</th>
                <th className="px-4 py-2 text-left">Subject Active</th>
                <th className="px-4 py-2 text-left">Capability Status</th>
              </tr>
            </thead>
            <tbody>
              {elizorCapabilities.map((cap) => (
                <tr key={cap.capabilityId} className="border-t">
                  <td className="px-4 py-2">{cap.teacherName}</td>
                  <td className="px-4 py-2">
                    {cap.teacherRole === "teacher" ? (
                      <span className="text-green-600">✅ {cap.teacherRole}</span>
                    ) : (
                      <span className="text-red-600">❌ {cap.teacherRole}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {cap.teacherActive ? (
                      <span className="text-green-600">✅ Yes</span>
                    ) : (
                      <span className="text-red-600">❌ No</span>
                    )}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">{cap.subjectId}</td>
                  <td className="px-4 py-2 font-semibold">{cap.subjectCode}</td>
                  <td className="px-4 py-2">
                    {cap.subjectActive ? (
                      <span className="text-green-600">✅ Active</span>
                    ) : (
                      <span className="text-red-600">❌ Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {cap.capabilityStatus === "active" ? (
                      <span className="text-green-600 font-semibold">✅ {cap.capabilityStatus}</span>
                    ) : (
                      <span className="text-amber-600">⚠️ {cap.capabilityStatus}</span>
                    )}
                  </td>
                </tr>
              ))}
              {elizorCapabilities.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                    No capabilities found for Elizor + CC102
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#6A0000]">
          3. Eligible Teachers Query Test (for first CC102 subject: {cc102Subjects[0]?.code})
        </h2>
        <p className="text-sm text-neutral-600">
          This simulates the exact query used in schedule creation dropdown
        </p>
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-2 text-left">Teacher ID</th>
                <th className="px-4 py-2 text-left">Teacher Name</th>
                <th className="px-4 py-2 text-left">Email</th>
              </tr>
            </thead>
            <tbody>
              {eligibleForFirstCC102.map((t) => (
                <tr key={t.teacherId} className="border-t">
                  <td className="px-4 py-2 font-mono text-xs">{t.teacherId}</td>
                  <td className="px-4 py-2 font-semibold">{t.teacherName}</td>
                  <td className="px-4 py-2">{t.email}</td>
                </tr>
              ))}
              {eligibleForFirstCC102.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-red-600 font-medium">
                    ❌ No eligible teachers found! This is the problem.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border-2 border-[#6A0000] bg-[#6A0000]/5 p-6 space-y-3">
        <h3 className="text-lg font-semibold text-[#6A0000]">Diagnosis</h3>
        <div className="space-y-2 text-sm">
          <p>
            <strong>Expected:</strong> Section 2 should show Elizor's capability with status="active" 
            for the same subject ID shown in Section 1.
          </p>
          <p>
            <strong>Issue:</strong> If section 3 shows "No eligible teachers", then either:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>The capability is for a different CC102 subject ID than what the schedule form uses</li>
            <li>The capability status is not "active"</li>
            <li>The subject itself is inactive</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
