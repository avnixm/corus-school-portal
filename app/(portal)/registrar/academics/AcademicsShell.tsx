import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type TabValue = "programs" | "curriculum" | "subjects" | "sections";

export function AcademicsShell({
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
          Academics
        </h2>
        <p className="text-sm text-neutral-800">
          Programs, curriculum, subjects, and sections.
        </p>
      </div>

      <Tabs value={activeTab} className="w-full">
        <TabsList className="bg-neutral-100">
          <TabsTrigger value="programs" asChild>
            <Link href="/registrar/academics/programs">Programs</Link>
          </TabsTrigger>
          <TabsTrigger value="curriculum" asChild>
            <Link href="/registrar/academics/curriculum">Curriculum</Link>
          </TabsTrigger>
          <TabsTrigger value="subjects" asChild>
            <Link href="/registrar/academics/subjects">Subjects</Link>
          </TabsTrigger>
          <TabsTrigger value="sections" asChild>
            <Link href="/registrar/academics/sections">Sections</Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {children}
        </TabsContent>
      </Tabs>
    </div>
  );
}
