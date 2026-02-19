import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type TabValue = "enrollments" | "queue" | "requirements";

export function ApprovalsShell({
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
          Approvals & Compliance
        </h2>
        <p className="text-sm text-neutral-800">
          Review enrollments, verify documents, and manage requirements.
        </p>
      </div>

      <Tabs value={activeTab} className="w-full">
        <TabsList className="bg-neutral-100">
          <TabsTrigger value="enrollments" asChild>
            <Link href="/registrar/approvals">Enrollments</Link>
          </TabsTrigger>
          <TabsTrigger value="queue" asChild>
            <Link href="/registrar/approvals/queue">Document queue</Link>
          </TabsTrigger>
          <TabsTrigger value="requirements" asChild>
            <Link href="/registrar/approvals/requirements">Requirements</Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {children}
        </TabsContent>
      </Tabs>
    </div>
  );
}
