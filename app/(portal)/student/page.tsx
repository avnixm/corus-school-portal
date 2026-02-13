import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  CalendarCheck,
  BookOpenCheck,
  Megaphone,
} from "lucide-react";
import {
  getEnrollmentByStudentId,
  getBillingByStudentId,
  getGradesByStudentId,
  getScheduleByStudentId,
} from "@/db/queries";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { getCurrentStudent } from "@/lib/auth/getCurrentStudent";

async function getDashboardData(studentId: string) {
  if (!studentId) {
    return { enrollment: null, billing: null, grades: [], schedule: [] };
  }
  try {
    const [enrollment, billing, grades, schedule] = await Promise.all([
      getEnrollmentByStudentId(studentId),
      getBillingByStudentId(studentId),
      getGradesByStudentId(studentId, 4),
      getScheduleByStudentId(studentId, 3),
    ]);

    return {
      enrollment,
      billing,
      grades: grades || [],
      schedule: schedule || [],
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return {
      enrollment: null,
      billing: null,
      grades: [],
      schedule: [],
    };
  }
}

export default async function StudentDashboardPage() {
  const user = await getCurrentUserWithRole();
  const current = await getCurrentStudent();
  const studentName = user?.name?.split(" ")[0] || current?.student?.firstName || "Student";
  const data = await getDashboardData(current?.studentId || "");

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
            Welcome back, {studentName} 👋
          </h2>
          <p className="max-w-xl text-sm text-neutral-700">
            Here&apos;s a quick overview of your current semester. Keep track of
            your performance, classes, and important updates in one place.
          </p>
        </div>
        <Badge className="bg-[#6A0000] text-white border-transparent">
          SY 2025–2026 • 2nd Sem
        </Badge>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#6A0000]">
              Current GWA
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-[#6A0000]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#6A0000]">1.75</div>
            <p className="mt-1 text-xs text-neutral-700">
              Good standing • Keep it up!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#6A0000]">
              Attendance
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-[#6A0000]" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-[#6A0000]">92%</span>
              <span className="text-xs text-neutral-700">
                Present this semester
              </span>
            </div>
            <Progress value={92} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#6A0000]">
              Units Enrolled
            </CardTitle>
            <BookOpenCheck className="h-4 w-4 text-[#6A0000]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#6A0000]">24</div>
            <p className="mt-1 text-xs text-neutral-700">
              Across 8 enrolled subjects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#6A0000]">
              Announcements
            </CardTitle>
            <Megaphone className="h-4 w-4 text-[#6A0000]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#6A0000]">3</div>
            <p className="mt-1 text-xs text-neutral-700">
              New announcements this week
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr,1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#6A0000]">
              Upcoming Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border bg-neutral-50 px-3 py-2 text-sm">
              <div className="space-y-0.5">
                <p className="font-semibold text-[#6A0000]">CC 201 – Data Structures</p>
                <p className="text-xs text-neutral-700">
                  Today • 1:00 PM – 2:30 PM • Room 302
                </p>
              </div>
              <span className="text-xs font-medium text-[#6A0000]">
                Next
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm">
              <div className="space-y-0.5">
                <p className="font-semibold text-[#6A0000]">IT 210 – Web Development</p>
                <p className="text-xs text-neutral-700">
                  Tomorrow • 9:30 AM – 11:00 AM • Lab 2
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm">
              <div className="space-y-0.5">
                <p className="font-semibold text-[#6A0000]">GE 105 – Ethics</p>
                <p className="text-xs text-neutral-700">
                  Fri • 8:00 AM – 9:30 AM • Room 204
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#6A0000]">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-between">
              View Grades
              <span className="text-xs opacity-80">Go to records</span>
            </Button>
            <Button variant="outline" className="w-full justify-between">
              Pay Billing
              <span className="text-xs opacity-80">Online payment</span>
            </Button>
            <Button variant="ghost" className="w-full justify-between">
              View Announcements
              <span className="text-xs opacity-80">Stay updated</span>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

