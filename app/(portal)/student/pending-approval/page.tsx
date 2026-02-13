import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function PendingApprovalPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <Card className="rounded-xl border-[#6A0000]/15 bg-white/90 shadow-lg backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-[#6A0000]">
            <CheckCircle className="h-6 w-6" />
            Application Submitted
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-700">
            Your application has been submitted. The registrar will review it and
            you will be notified once your account is approved. You can sign out
            and return later to check your status.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
