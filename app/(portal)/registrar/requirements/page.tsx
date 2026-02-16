import { getRequirementsList, getRequirementRulesList, getSchoolYearsList, getTermsList } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { RequirementsMasterTab } from "./RequirementsMasterTab";
import { RequirementsRulesTab } from "./RequirementsRulesTab";

export const dynamic = "force-dynamic";

export const metadata = { title: "Requirements" };

export default async function RegistrarRequirementsPage() {
  const [schoolYears, terms] = await Promise.all([
    getSchoolYearsList(),
    getTermsList(),
  ]);
  let requirements: Awaited<ReturnType<typeof getRequirementsList>> = [];
  let rules: Awaited<ReturnType<typeof getRequirementRulesList>> = [];
  try {
    [requirements, rules] = await Promise.all([
      getRequirementsList(false),
      getRequirementRulesList(),
    ]);
  } catch {
    // requirements or requirement_rules tables may not exist yet
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
            Forms & Requirements
          </h2>
          <p className="text-sm text-neutral-800">
            Master requirements, applicability rules, and verification queue.
          </p>
        </div>
        <Link
          href="/registrar/requirements/queue"
          className="rounded-lg border border-[#6A0000]/30 bg-[#6A0000]/10 px-4 py-2 text-sm font-medium text-[#6A0000] hover:bg-[#6A0000]/20"
        >
          Verification queue
        </Link>
      </div>

      <Tabs defaultValue="master" className="w-full">
        <TabsList>
          <TabsTrigger value="master">Master requirements</TabsTrigger>
          <TabsTrigger value="rules">Rules / applicability</TabsTrigger>
        </TabsList>
        <TabsContent value="master">
          <RequirementsMasterTab requirements={requirements} />
        </TabsContent>
        <TabsContent value="rules">
          <RequirementsRulesTab
            rules={rules}
            requirements={requirements}
            schoolYears={schoolYears}
            terms={terms}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
