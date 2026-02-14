"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createStudentFromSetup } from "./actions";

export function StudentSetupForm({
  defaultEmail,
  defaultName,
}: {
  defaultEmail: string;
  defaultName: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const nameParts = (defaultName || "").trim().split(/\s+/);
  const defaultFirstName = nameParts[0] ?? "";
  const defaultLastName = nameParts.slice(1).join(" ") || "";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      const result = await createStudentFromSetup(formData);
      if (result?.error) setError(result.error);
    } catch (_) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-[#6A0000]/40 focus:border-[#6A0000]";

  return (
    <Card className="border-[#6A0000]/15">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-[#6A0000]">Your information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-800">Email</label>
              <input
                className={inputClass}
                name="email"
                type="email"
                defaultValue={defaultEmail}
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-800">
                First name <span className="text-red-600">*</span>
              </label>
              <input
                className={inputClass}
                name="firstName"
                type="text"
                required
                defaultValue={defaultFirstName}
                placeholder="Juan"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-800">
                Middle name
              </label>
              <input
                className={inputClass}
                name="middleName"
                type="text"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-800">
                Last name <span className="text-red-600">*</span>
              </label>
              <input
                className={inputClass}
                name="lastName"
                type="text"
                required
                defaultValue={defaultLastName}
                placeholder="Dela Cruz"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-800">
              Contact number
            </label>
            <input
              className={inputClass}
              name="contactNo"
              type="text"
              placeholder="09xxxxxxxxx"
            />
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-600">
              Address (optional)
            </p>
            <div className="space-y-2">
              <input
                className={inputClass}
                name="street"
                type="text"
                placeholder="Street / House no."
              />
              <div className="grid gap-2 sm:grid-cols-3">
                <input
                  className={inputClass}
                  name="barangay"
                  type="text"
                  placeholder="Barangay"
                />
                <input
                  className={inputClass}
                  name="municipality"
                  type="text"
                  placeholder="Municipality / City"
                />
                <input
                  className={inputClass}
                  name="province"
                  type="text"
                  placeholder="Province"
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Saving…" : "Complete setup & go to dashboard"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
