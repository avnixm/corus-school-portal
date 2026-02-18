"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { ContactSupportDialog } from "./ContactSupportDialog";

interface NotAuthorizedContentProps {
  isInactive: boolean;
}

export function NotAuthorizedContent({ isInactive }: NotAuthorizedContentProps) {
  const [supportDialogOpen, setSupportDialogOpen] = useState(false);

  return (
    <>
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#6A0000] flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            {isInactive ? "Account Access Restricted" : "Access Denied"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-amber-50 p-4 border border-amber-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-900">
                  {isInactive
                    ? "Your account has been deactivated"
                    : "Access to this area is restricted"}
                </p>
                <p className="text-sm text-amber-800">
                  {isInactive
                    ? "Your account is currently inactive. To restore access, please contact your teacher or an administrator."
                    : "You don't have the necessary permissions to access this page."}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <Link
              href="/login"
              className="block w-full rounded-md bg-[#6A0000] px-4 py-2 text-center text-sm font-medium text-white hover:bg-[#6A0000]/90 transition-colors"
            >
              Return to Sign In
            </Link>
            <p className="text-center text-xs text-neutral-600">
              Need help?{" "}
              <button
                type="button"
                onClick={() => setSupportDialogOpen(true)}
                className="font-medium text-[#6A0000] hover:underline"
              >
                Contact support
              </button>
            </p>
          </div>
        </CardContent>
      </Card>

      <ContactSupportDialog
        open={supportDialogOpen}
        onOpenChange={setSupportDialogOpen}
        isInactive={isInactive}
      />
    </>
  );
}
