// path: app/not-authorized/page.tsx

import type { Metadata } from "next";
import Header from "@/components/landing/Header";
import { NotAuthorizedContent } from "./NotAuthorizedContent";

export const metadata: Metadata = { title: "Account Inactive" };

export default async function NotAuthorizedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const params = await searchParams;
  const reason = params?.reason || "account_inactive";
  const isInactive = reason === "account_inactive";

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
        <div className="mx-auto grid w-full max-w-4xl items-center gap-10 md:grid-cols-[1.1fr,1fr]">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6A0000]">
              CORUS PORTAL
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-[#6A0000] md:text-4xl">
              {isInactive ? "Account Inactive" : "Not Authorized"}
            </h1>
            <p className="max-w-md text-sm text-neutral-700">
              {isInactive
                ? "Your account has been deactivated. Please contact your teacher or an administrator to restore access to your account."
                : "You don't have access to this area. Please contact an administrator if you believe this is an error."}
            </p>
          </div>

          <NotAuthorizedContent isInactive={isInactive} />
        </div>
      </main>
    </div>
  );
}
