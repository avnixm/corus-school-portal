import { getCurrentUserWithStudent } from "@/lib/auth/getCurrentStudent";

export default async function ProfilePage() {
  const data = await getCurrentUserWithStudent();

  if (!data) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">Profile</h2>
        <p className="text-sm text-neutral-700">Unable to load profile.</p>
      </div>
    );
  }

  const { profile, student } = data;
  const fullName =
    profile.fullName ??
    ([student?.firstName, student?.lastName].filter(Boolean).join(" ") || "—");

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">Profile</h2>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3 rounded-xl border bg-white/80 p-4 text-sm">
          <h3 className="text-sm font-semibold text-[#6A0000]">
            Account
          </h3>
          <p>
            <span className="text-neutral-700">Name: </span>
            <span className="text-[#6A0000] font-medium">{fullName}</span>
          </p>
          <p>
            <span className="text-neutral-700">Email: </span>
            <span className="text-[#6A0000] font-medium">{profile.email ?? "—"}</span>
          </p>
          <p>
            <span className="text-neutral-700">Role: </span>
            <span className="text-[#6A0000] font-medium">{profile.role}</span>
          </p>
        </div>
        <div className="space-y-3 rounded-xl border bg-white/80 p-4 text-sm">
          <h3 className="text-sm font-semibold text-[#6A0000]">
            Student Information
          </h3>
          {student ? (
            <>
              <p>
                <span className="text-neutral-700">Student Code: </span>
                <span className="text-[#6A0000] font-medium">{student.studentCode ?? "—"}</span>
              </p>
              <p>
                <span className="text-neutral-700">Program: </span>
                <span className="text-[#6A0000] font-medium">{student.program ?? "—"}</span>
              </p>
              <p>
                <span className="text-neutral-700">Year Level: </span>
                <span className="text-[#6A0000] font-medium">{student.yearLevel ?? "—"}</span>
              </p>
            </>
          ) : (
            <p className="text-neutral-600">
              No student record linked to your account yet. Contact the registrar
              to complete your enrollment.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
