"use client";

import { useActionState } from "react";
import Link from "next/link";
import Header from "@/components/landing/Header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { register } from "../actions";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(register, {
    error: undefined,
  });

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
              CORUS ENROLLMENT
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-[#6A0000] md:text-4xl">
              Create your CORUS account
            </h1>
            <p className="max-w-md text-sm text-neutral-700">
              Register as a new OLSHCO student to start your online enrollment
              and gain access to your records, billing, and class information.
            </p>
          </div>

          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[#6A0000]">
                Register as New Student
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {state.error && (
                <div className="rounded-md bg-red-50 p-3 border border-red-200 text-sm text-red-700">
                  {state.error}
                </div>
              )}

              <form className="space-y-4" action={formAction}>
                <div className="space-y-1.5">
                  <label
                    htmlFor="fullName"
                    className="text-xs font-medium text-neutral-700"
                  >
                    Full name
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    className="h-9 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-700 shadow-sm outline-none focus-visible:border-[#6A0000] focus-visible:ring-1 focus-visible:ring-[#6A0000]"
                    placeholder="Juan Dela Cruz"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="text-xs font-medium text-neutral-700"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="h-9 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-700 shadow-sm outline-none focus-visible:border-[#6A0000] focus-visible:ring-1 focus-visible:ring-[#6A0000]"
                    placeholder="juan.delacruz@olshco.edu.ph"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="contactNo"
                    className="text-xs font-medium text-neutral-700"
                  >
                    Mobile number
                  </label>
                  <input
                    id="contactNo"
                    name="contactNo"
                    type="tel"
                    className="h-9 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-700 shadow-sm outline-none focus-visible:border-[#6A0000] focus-visible:ring-1 focus-visible:ring-[#6A0000]"
                    placeholder="09XX XXX XXXX"
                    required
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="password"
                      className="text-xs font-medium text-neutral-700"
                    >
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      className="h-9 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-700 shadow-sm outline-none focus-visible:border-[#6A0000] focus-visible:ring-1 focus-visible:ring-[#6A0000]"
                      placeholder="Create a secure password"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="confirmPassword"
                      className="text-xs font-medium text-neutral-700"
                    >
                      Confirm password
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      className="h-9 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-700 shadow-sm outline-none focus-visible:border-[#6A0000] focus-visible:ring-1 focus-visible:ring-[#6A0000]"
                      placeholder="Re-enter your password"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2 text-xs">
                  <input
                    id="dataPrivacyConsent"
                    name="dataPrivacyConsent"
                    type="checkbox"
                    className="mt-0.5 h-3.5 w-3.5 rounded border border-neutral-300 text-[#6A0000] focus-visible:ring-[#6A0000]"
                    required
                  />
                  <label
                    htmlFor="dataPrivacyConsent"
                    className="text-neutral-700"
                  >
                    I confirm that the information I provided is correct and I
                    consent to the collection and processing of my personal data
                    in accordance with the{" "}
                    <span className="font-medium text-[#6A0000]">
                      Data Privacy Act of 2012
                    </span>{" "}
                    and CORUS&apos;s privacy policy.
                  </label>
                </div>

                <Button className="w-full" type="submit" disabled={isPending}>
                  {isPending ? "Creating account..." : "Create account"}
                </Button>
              </form>

              <p className="pt-1 text-center text-xs text-neutral-600">
                Already registered?{" "}
                <Link
                  href="/login"
                  className="font-medium text-[#6A0000] hover:underline"
                >
                  Sign in to your account
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}