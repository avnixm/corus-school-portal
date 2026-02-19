import { StaffShell } from "../StaffShell";
import { TeachersTab } from "../StaffTabs";

export const dynamic = "force-dynamic";

export const metadata = { title: "Teachers — Staff" };

export default async function StaffTeachersPage() {
  return (
    <StaffShell activeTab="teachers">
      <TeachersTab />
    </StaffShell>
  );
}
