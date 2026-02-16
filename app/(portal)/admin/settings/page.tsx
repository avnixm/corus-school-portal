import {
  getSystemSetting,
  getSchoolYearsList,
  getTermsList,
} from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

function getValueAsString(val: unknown): string | null {
  if (val == null) return null;
  if (typeof val === "string") return val;
  if (typeof (val as Record<string, unknown>)?.value === "string") return (val as Record<string, unknown>).value as string;
  return null;
}

function getValueAsNumber(val: unknown): number | null {
  if (val == null) return null;
  if (typeof val === "number") return val;
  if (typeof (val as Record<string, unknown>)?.value === "number") return (val as Record<string, unknown>).value as number;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function getValueAsGradingPeriods(val: unknown): { name: string; sort_order: number }[] {
  if (val == null || !Array.isArray(val)) return [];
  return (val as { name?: string; sort_order?: number }[]).map((p) => ({
    name: p?.name ?? "",
    sort_order: typeof p?.sort_order === "number" ? p.sort_order : 0,
  }));
}

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const [syList, termsList, sySetting, termSetting, passSetting, maxSectionSetting, gradingSetting] =
    await Promise.all([
      getSchoolYearsList(),
      getTermsList(),
      getSystemSetting("active_school_year_id"),
      getSystemSetting("active_term_id"),
      getSystemSetting("pass_threshold"),
      getSystemSetting("max_section_size"),
      getSystemSetting("grading_period_names"),
    ]);

  const activeSchoolYearId = getValueAsString(sySetting?.value) ?? "";
  const activeTermId = getValueAsString(termSetting?.value) ?? "";
  const passThreshold = getValueAsNumber(passSetting?.value) ?? 75;
  const maxSectionSize = getValueAsNumber(maxSectionSetting?.value) ?? 50;
  const gradingPeriods = getValueAsGradingPeriods(gradingSetting?.value);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          School Settings
        </h2>
        <p className="text-sm text-neutral-600">
          Global settings. Changes affect registrar, teacher, and finance dashboards.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm
            schoolYears={syList}
            terms={termsList}
            activeSchoolYearId={activeSchoolYearId}
            activeTermId={activeTermId}
            passThreshold={passThreshold}
            maxSectionSize={maxSectionSize}
            gradingPeriods={gradingPeriods}
          />
        </CardContent>
      </Card>
    </div>
  );
}
