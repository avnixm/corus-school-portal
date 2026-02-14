import { getTeachersListForRegistrar } from "@/db/queries";
import { Card } from "@/components/ui/card";
import { TeacherTable } from "@/components/registrar/teachers/TeacherTable";

export const dynamic = "force-dynamic";

export default async function RegistrarTeachersPage() {
  const teachers = await getTeachersListForRegistrar();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Teachers
        </h2>
        <p className="text-sm text-neutral-800">
          Manage teacher course authorizations. Assign which subjects each teacher is allowed to teach.
        </p>
      </div>

      <Card>
        <div className="overflow-hidden rounded-xl border bg-white/80 text-neutral-900">
          <TeacherTable teachers={teachers} />
        </div>
      </Card>
    </div>
  );
}
