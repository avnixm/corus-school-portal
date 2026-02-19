"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScheduleFilters } from "@/app/(portal)/registrar/schedules/ScheduleFilters";
import { CreateScheduleForm } from "@/app/(portal)/registrar/schedules/CreateScheduleForm";
import { CreateTimeConfigButton } from "@/app/(portal)/program-head/schedule-time-config/CreateTimeConfigButton";
import { TimeConfigRowActions } from "@/app/(portal)/program-head/schedule-time-config/TimeConfigRowActions";
import { formatStatusForDisplay } from "@/lib/formatStatus";

function formatTime(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:00 ${period}`;
}

type ScheduleRow = {
  id: string;
  schoolYearName: string;
  termName: string;
  sectionName: string;
  sectionId?: string;
  programCode: string | null;
  sectionProgram: string | null;
  subjectCode: string;
  subjectDescription: string | null;
  teacherName: string | null;
  timeIn: string | null;
  timeOut: string | null;
  room: string | null;
};

type TimeConfig = {
  id: string;
  programCode: string | null;
  title: string;
  startHour: number;
  endHour: number;
  timeIncrement: number;
  status: string;
};

type SchoolYear = { id: string; name: string };
type Term = { id: string; name: string; schoolYearId: string };
type Section = {
  id: string;
  name: string;
  programId: string | null;
  yearLevel: string | null;
  programCode: string | null;
};
type Program = { id: string; code: string; name: string };
type Teacher = { id: string; firstName: string; lastName: string; email: string | null };

export function SchedulingPageContent({
  view,
  schedules,
  configs,
  schoolYears,
  terms,
  sections,
  programs,
  timeConfigPrograms,
  teachers,
}: {
  view: "schedules" | "time-config";
  schedules: ScheduleRow[];
  configs: TimeConfig[];
  schoolYears: SchoolYear[];
  terms: Term[];
  sections: Section[];
  programs: Program[];
  timeConfigPrograms: Program[];
  teachers: Teacher[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setView(newView: "schedules" | "time-config") {
    const next = new URLSearchParams(searchParams);
    next.set("view", newView);
    router.push(`/program-head/scheduling?${next.toString()}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-neutral-200">
        <button
          type="button"
          onClick={() => setView("schedules")}
          className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
            view === "schedules"
              ? "border-[#6A0000] text-[#6A0000]"
              : "border-transparent text-neutral-600 hover:text-neutral-900"
          }`}
        >
          Class Schedules
        </button>
        <button
          type="button"
          onClick={() => setView("time-config")}
          className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
            view === "time-config"
              ? "border-[#6A0000] text-[#6A0000]"
              : "border-transparent text-neutral-600 hover:text-neutral-900"
          }`}
        >
          Time Configuration
        </button>
      </div>

      {view === "schedules" && (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[#6A0000]">Class Schedules</h3>
              <p className="mt-1 text-sm text-neutral-800">
                Manage class schedules for your program. Only teachers with approved capabilities can be assigned.
              </p>
            </div>
            <CreateScheduleForm
              schoolYears={schoolYears}
              terms={terms}
              sections={sections}
              programs={programs}
              teachers={teachers}
            />
          </div>
          <ScheduleFilters
            basePath="/program-head/scheduling"
            schoolYears={schoolYears}
            terms={terms}
            sections={sections}
            programs={programs}
          />
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-neutral-900">
                Schedules ({schedules.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl border bg-white/80 text-neutral-900">
                <table className="min-w-full text-left text-sm text-neutral-900">
                  <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                    <tr>
                      <th className="px-4 py-2">School Year</th>
                      <th className="px-4 py-2">Term</th>
                      <th className="px-4 py-2">Program</th>
                      <th className="px-4 py-2">Section</th>
                      <th className="px-4 py-2">Subject</th>
                      <th className="px-4 py-2">Teacher</th>
                      <th className="px-4 py-2">Time</th>
                      <th className="px-4 py-2">Room</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b last:border-0 hover:bg-neutral-50/80"
                      >
                        <td className="px-4 py-2">{row.schoolYearName}</td>
                        <td className="px-4 py-2">{row.termName}</td>
                        <td className="px-4 py-2 font-mono text-[#6A0000]">
                          {row.programCode ?? row.sectionProgram ?? "—"}
                        </td>
                        <td className="px-4 py-2">{row.sectionName}</td>
                        <td className="px-4 py-2">
                          {row.subjectCode} – {row.subjectDescription ?? "—"}
                        </td>
                        <td className="px-4 py-2">{row.teacherName ?? "—"}</td>
                        <td className="px-4 py-2">
                          {row.timeIn ?? "—"} – {row.timeOut ?? "—"}
                        </td>
                        <td className="px-4 py-2">{row.room ?? "—"}</td>
                      </tr>
                    ))}
                    {schedules.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-8 text-center text-sm text-neutral-800"
                        >
                          No schedules found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {view === "time-config" && (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[#6A0000]">Schedule Time Configuration</h3>
              <p className="mt-1 text-sm text-neutral-800">
                Configure allowed time slots for class scheduling. Requires Dean approval.
              </p>
            </div>
            <CreateTimeConfigButton programs={timeConfigPrograms} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-neutral-900">
                Time Configurations ({configs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl border bg-white/80">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                    <tr>
                      <th className="px-4 py-2">Program</th>
                      <th className="px-4 py-2">Title</th>
                      <th className="px-4 py-2">Time Range</th>
                      <th className="px-4 py-2">Increment</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="w-[1%] whitespace-nowrap px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {configs.map((config) => (
                      <tr key={config.id} className="border-b last:border-0 hover:bg-neutral-50/80">
                        <td className="px-4 py-2 font-medium">{config.programCode}</td>
                        <td className="px-4 py-2">{config.title}</td>
                        <td className="px-4 py-2">
                          {formatTime(config.startHour)} - {formatTime(config.endHour)}
                        </td>
                        <td className="px-4 py-2">{config.timeIncrement} mins</td>
                        <td className="px-4 py-2">
                          <Badge
                            variant="outline"
                            className={
                              config.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : config.status === "submitted"
                                  ? "bg-blue-100 text-blue-800"
                                  : config.status === "rejected"
                                    ? "bg-red-100 text-red-800"
                                    : ""
                            }
                          >
                            {formatStatusForDisplay(config.status)}
                          </Badge>
                        </td>
                        <td className="w-[1%] whitespace-nowrap px-4 py-2 text-right">
                          <TimeConfigRowActions config={config} />
                        </td>
                      </tr>
                    ))}
                    {configs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-neutral-600">
                          No time configurations yet. Create one to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
