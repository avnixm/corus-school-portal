"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { StudentSetupForm } from "./StudentSetupForm";

export function StudentSetupClient() {
  const router = useRouter();
  const fetchedRef = useRef(false);
  const [defaults, setDefaults] = useState<{ email: string; name: string } | undefined>(
    undefined
  );
  const [redirectTo, setRedirectTo] = useState<"login" | "student" | null>(null);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    let cancelled = false;
    fetch("/api/student/setup-defaults", { credentials: "include" })
      .then((res) => res.json())
      .then((d: { ok: boolean; redirect?: "login" | "student"; email?: string; name?: string }) => {
        if (cancelled) return;
        if (!d.ok && d.redirect) {
          setRedirectTo(d.redirect);
          return;
        }
        if (d.ok && d.email !== undefined && d.name !== undefined) {
          setDefaults({ email: d.email, name: d.name });
        } else {
          setRedirectTo("login");
        }
      })
      .catch(() => {
        if (!cancelled) setRedirectTo("login");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (redirectTo === "login") router.replace("/login");
    else if (redirectTo === "student") router.replace("/student");
  }, [redirectTo, router]);

  if (defaults === undefined && !redirectTo) {
    return (
      <div className="mx-auto max-w-xl space-y-6 px-4 py-6">
        <p className="text-sm text-neutral-600">Loading…</p>
      </div>
    );
  }

  if (defaults === undefined) {
    return null;
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Student Profile Setup
        </h1>
        <p className="mt-1 text-sm text-neutral-700">
          Link your account to a student record. Enter your details below. You must complete this
          before enrolling.
        </p>
      </div>
      <StudentSetupForm defaultEmail={defaults.email} defaultName={defaults.name} />
    </div>
  );
}
