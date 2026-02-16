import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { getProgramHeadScope } from "@/lib/programHead/scope";
import { getDistinctProgramsFromEnrollments } from "@/lib/programHead/queries";
import { getUserProfileByUserId } from "@/db/queries";
import { updateUserProfileProgramScope } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgramScopeForm } from "./ProgramScopeForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Settings" };

export default async function ProgramHeadSettingsPage() {
  const user = await getCurrentUserWithRole();
  if (!user) return null;
  const scope = await getProgramHeadScope(user.userId);
  const profile = await getUserProfileByUserId(user.userId);
  const programs = await getDistinctProgramsFromEnrollments();

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Settings
        </h2>
        <p className="mt-1 text-sm text-neutral-800">
          Choose which program you oversee. Data across the portal will be filtered by this scope.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">
            Program scope
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProgramScopeForm
            profileId={profile?.id ?? ""}
            currentProgram={profile?.program ?? null}
            programs={programs}
          />
        </CardContent>
      </Card>
    </div>
  );
}
