import { getScheduleWithDetailsByStudentId } from "@/db/queries";
import { getCurrentStudent } from "@/lib/auth/getCurrentStudent";

export default async function SchedulePage() {
  const current = await getCurrentStudent();
  const studentId = current?.studentId;

  const rows = studentId
    ? await getScheduleWithDetailsByStudentId(studentId, 40)
    : [];

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">Schedule</h2>
        <p className="text-sm text-neutral-700">
          Your upcoming classes grouped by day of week.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {days.map((day) => {
          const items = rows.filter((r) => r.day === day);
          return (
            <div
              key={day}
              className="rounded-xl border bg-white/80 p-4"
            >
              <h3 className="text-sm font-semibold text-[#6A0000]">
                {day}
              </h3>
              <div className="mt-3 space-y-2 text-sm">
                {items.length === 0 && (
                  <p className="text-xs text-neutral-700">
                    No classes scheduled.
                  </p>
                )}
                {items.map((cls, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border bg-neutral-50 px-3 py-2"
                  >
                    <div className="font-medium text-[#6A0000]">
                      {cls.subjectCode ?? "Subject"}{" "}
                      <span className="text-xs text-neutral-700">
                        {cls.sectionName}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-700">
                      {cls.timeIn} – {cls.timeOut} • {cls.room}
                    </div>
                    <div className="mt-0.5 text-xs text-neutral-700">
                      {cls.subjectDescription}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
