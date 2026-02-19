import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type TabValue = "students" | "enrollments";

export function RecordsShell({
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
          Records
        </h2>
        <p className="text-sm text-neutral-800">
          Students and enrollment records.
        </p>
      </div>

      <Tabs value={activeTab} className="w-full">
        <TabsList className="bg-neutral-100">
          <TabsTrigger value="students" asChild>
            <Link href="/registrar/records/students">Students</Link>
          </TabsTrigger>
          <TabsTrigger value="enrollments" asChild>
            <Link href="/registrar/records/enrollments">Enrollments</Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {children}
        </TabsContent>
      </Tabs>
    </div>
  );
}
