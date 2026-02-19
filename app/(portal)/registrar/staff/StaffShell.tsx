import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type TabValue = "teachers" | "advisers";

export function StaffShell({
  activeTab,
  children,
}: {
  activeTab: TabValue;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Staff
        </h2>
        <p className="text-sm text-neutral-800">
          Teachers and adviser assignments.
        </p>
      </div>

      <Tabs value={activeTab} className="w-full">
        <TabsList className="bg-neutral-100">
          <TabsTrigger value="teachers" asChild>
            <Link href="/registrar/staff/teachers">Teachers</Link>
          </TabsTrigger>
          <TabsTrigger value="advisers" asChild>
            <Link href="/registrar/staff/advisers">Advisers</Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {children}
        </TabsContent>
      </Tabs>
    </div>
  );
}
