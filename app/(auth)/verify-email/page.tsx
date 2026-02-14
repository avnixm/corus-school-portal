"use client";

import { useActionState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/landing/Header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail } from "lucide-react";
import { verifyEmailWithOTP, resendVerificationEmail } from "../actions";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [state, formAction, isPending] = useActionState(verifyEmailWithOTP, {
    error: undefined,
  });
  const [resendState, resendFormAction, isResending] = useActionState(
    resendVerificationEmail,
    { error: undefined }
  );

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-[#fff5f5]" />
      <div className="pointer-events-none absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-[#6A0000]/8 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-[#4A0000]/10 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.4) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Header without auth buttons */}
      <Header showActions={false} />

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10">
        <div className="mx-auto grid w-full max-w-2xl items-center gap-6">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#6A0000]/10">
                  <Mail className="h-6 w-6 text-[#6A0000]" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-[#6A0000]">
                    Verify your email
                  </CardTitle>
                  <p className="text-xs text-neutral-500 mt-1">
                    Enter the code we sent you
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <p className="text-sm text-blue-900">
                  We sent a <strong>verification code</strong> to{" "}
                  <strong>{email || "your email"}</strong>
                </p>
                <p className="text-xs text-blue-800 mt-2">
                  Enter the 6-digit code from the email below to verify your
                  account.
                </p>
              </div>

              {state.error && (
                <div className="rounded-md bg-red-50 p-3 border border-red-200 text-sm text-red-700">
                  {state.error}
                </div>
              )}

              <form action={formAction} className="space-y-4">
                <input type="hidden" name="email" value={email} />
                <div className="space-y-1.5">
                  <label
                    htmlFor="code"
                    className="text-xs font-medium text-neutral-700"
                  >
                    Verification Code
                  </label>
                  <input
                    id="code"
                    name="code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    className="h-12 w-full rounded-md border border-neutral-300 bg-white px-4 text-center text-2xl tracking-widest font-mono text-neutral-900 placeholder:text-neutral-700 shadow-sm outline-none focus-visible:border-[#6A0000] focus-visible:ring-2 focus-visible:ring-[#6A0000]"
                    required
                    autoFocus
                  />
                  <p className="text-xs text-neutral-500">
                    Enter the 6-digit code
                  </p>
                </div>

                <Button
                  className="w-full"
                  type="submit"
                  disabled={isPending}
                >
                  {isPending ? "Verifying..." : "Verify Email"}
                </Button>
              </form>

              <div className="space-y-3 border-t pt-4">
                <p className="text-sm font-medium text-neutral-700">
                  Didn't receive the code?
                </p>

                {resendState.error && (
                  <div className="rounded-md bg-red-50 p-3 border border-red-200 text-sm text-red-700">
                    {resendState.error}
                  </div>
                )}

                {resendState.success && (
                  <div className="rounded-md bg-green-50 p-3 border border-green-200 text-sm text-green-700">
                    Verification code resent to {email}
                  </div>
                )}

                <form action={resendFormAction} className="flex gap-2">
                  <input type="hidden" name="email" value={email} />
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={isResending}
                    className="flex-1"
                  >
                    {isResending ? "Sending..." : "Resend Code"}
                  </Button>
                </form>

                <p className="text-xs text-neutral-500 text-center">
                  Check your spam/junk folder if you don't see the email
                </p>
              </div>

              <div className="border-t pt-4">
                <p className="text-center text-xs text-neutral-600">
                  Already verified?{" "}
                  <Link
                    href="/login"
                    className="font-medium text-[#6A0000] hover:underline"
                  >
                    Sign in to your account
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
