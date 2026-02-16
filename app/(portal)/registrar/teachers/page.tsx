import { listTeachersWithDepartmentAndCapabilityCount, getProgramsList } from "@/db/queries";
import { Card } from "@/components/ui/card";
import { TeacherTable } from "@/components/registrar/teachers/TeacherTable";

export const dynamic = "force-dynamic";

export const metadata = { title: "Teachers" };

export default async function RegistrarTeachersPage() {
  const [teachers, programs] = await Promise.all([
    listTeachersWithDepartmentAndCapabilityCount(),
    getProgramsList(true),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Teachers
        </h2>
        <p className="text-sm text-neutral-800">
          Manage teacher department assignments. View approved teaching capabilities (assigned by Program Head, approved by Dean).
        </p>
      </div>

      <Card>
        <div className="overflow-hidden rounded-xl border bg-white/80 text-neutral-900">
          <TeacherTable teachers={teachers} programs={programs} />
        </div>
      </Card>
    </div>
  );
}
