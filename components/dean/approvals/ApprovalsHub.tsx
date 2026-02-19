// path: components/dean/approvals/ApprovalsHub.tsx
"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ApprovalQueue } from "./ApprovalQueue";
import type { ApprovalTypeKey, ApprovalStatusFilter, ApprovalQueueRow } from "./ApprovalTypeConfig";
import { APPROVAL_TYPE_KEYS, APPROVAL_TYPE_LABELS } from "./ApprovalTypeConfig";

export interface ApprovalsHubProps {
  initialTab: ApprovalTypeKey;
  initialStatus: ApprovalStatusFilter;
  items: ApprovalQueueRow[];
  schoolYears: { id: string; name: string }[];
  terms: { id: string; name: string }[];
  programs: { id: string; code: string; name: string }[];
}

export function ApprovalsHub({
  initialTab,
  initialStatus,
  items,
  schoolYears,
  terms,
  programs,
}: ApprovalsHubProps) {
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as ApprovalTypeKey) ?? initialTab;
  const status = (searchParams.get("status") as ApprovalStatusFilter) ?? initialStatus;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Approvals
        </h2>
        <p className="text-sm text-neutral-600 mt-1">
          Review and approve submissions from program heads and finance.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => { /* controlled by URL */ }}>
        <TabsList className="w-full flex flex-wrap gap-1">
          {APPROVAL_TYPE_KEYS.map((key) => (
            <TabsTrigger key={key} value={key} asChild>
              <Link href={`/dean/approvals?tab=${key}&status=${status}`}>
                {APPROVAL_TYPE_LABELS[key]}
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>
        {APPROVAL_TYPE_KEYS.map((key) => (
          <TabsContent key={key} value={key} className="mt-4">
            {tab === key ? (
              <ApprovalQueue
                typeKey={key}
                items={items}
                status={status}
                schoolYears={schoolYears}
                terms={terms}
                programs={programs}
              />
            ) : null}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
