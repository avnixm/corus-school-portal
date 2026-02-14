"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { StepIndicator } from "./StepIndicator";
import { ReviewCard, type ReviewData } from "./ReviewCard";
import {
  saveStudentProfileStep,
  finalizeStudentProfile,
  type ProfileStepPayload,
} from "@/app/(portal)/student/complete-profile/actions";

const TOTAL_STEPS = 6;

type ProfileInitialOk = {
  ok: true;
  email: string;
  student: {
    firstName: string;
    middleName: string | null;
    lastName: string;
    email: string | null;
    contactNo: string | null;
    birthday: string | null;
    addressStreet: string | null;
    addressBarangay: string | null;
    addressMunicipality: string | null;
    addressProvince: string | null;
    guardianName: string | null;
    guardianRelationship: string | null;
    guardianMobile: string | null;
    studentType: string | null;
    lastSchoolId: string | null;
    lastSchoolYearCompleted: string | null;
  };
};

type WizardState = {
  firstName: string;
  middleName: string;
  lastName: string;
  birthday: string;
  email: string;
  mobile: string;
  addressLine1: string;
  barangay: string;
  city: string;
  province: string;
  zip: string;
  guardianName: string;
  guardianRelationship: string;
  guardianMobile: string;
  studentType: string;
  previousSchool: string;
  lastGradeCompleted: string;
};

const initialState = (init: {
  student: {
    firstName: string;
    middleName: string | null;
    lastName: string;
    email: string | null;
    contactNo: string | null;
    birthday: string | null;
    addressStreet: string | null;
    addressBarangay: string | null;
    addressMunicipality: string | null;
    addressProvince: string | null;
    guardianName: string | null;
    guardianRelationship: string | null;
    guardianMobile: string | null;
    studentType: string | null;
    lastSchoolId: string | null;
    lastSchoolYearCompleted: string | null;
  };
  email: string;
}): WizardState => ({
  firstName: init.student.firstName === "—" ? "" : init.student.firstName,
  middleName: init.student.middleName ?? "",
  lastName: init.student.lastName === "—" ? "" : init.student.lastName,
  birthday: init.student.birthday ?? "",
  email: init.student.email ?? init.email ?? "",
  mobile: init.student.contactNo ?? "",
  addressLine1: init.student.addressStreet ?? "",
  barangay: init.student.addressBarangay ?? "",
  city: init.student.addressMunicipality ?? "",
  province: init.student.addressProvince ?? "",
  zip: "",
  guardianName: init.student.guardianName ?? "",
  guardianRelationship: init.student.guardianRelationship ?? "",
  guardianMobile: init.student.guardianMobile ?? "",
  studentType: init.student.studentType ?? "",
  previousSchool: init.student.lastSchoolId ?? "",
  lastGradeCompleted: init.student.lastSchoolYearCompleted ?? "",
});

export function StudentSetupWizard({ initialData }: { initialData: ProfileInitialOk }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(() => initialState(initialData));
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const completedSteps = new Set(
    Array.from({ length: step - 1 }, (_, i) => i + 1)
  );

  const saveStep = useCallback(
    async (payload: ProfileStepPayload): Promise<boolean> => {
      setSaving(true);
      setError(null);
      const result = await saveStudentProfileStep(payload);
      setSaving(false);
      if (result.ok) {
        setSavedAt(Date.now());
        return true;
      }
      setError(result.error ?? "Save failed");
      return false;
    },
    []
  );

  const goNext = async () => {
    setError(null);
    if (step === 6) {
      if (!confirmed) {
        setError("Please confirm the information is correct.");
        return;
      }
      setSaving(true);
      setError(null);
      const result = await finalizeStudentProfile(true);
      if (!result.ok) {
        setSaving(false);
        setError(result.error ?? "Failed to complete");
        return;
      }
      router.push("/student");
      return;
    }

    if (step === 1) {
      const payload: ProfileStepPayload = {
        step: 1,
        data: {
          firstName: state.firstName,
          middleName: state.middleName || null,
          lastName: state.lastName,
          birthday: state.birthday,
        },
      };
      const ok = await saveStep(payload);
      if (ok) setStep(2);
    } else if (step === 2) {
      const payload: ProfileStepPayload = {
        step: 2,
        data: { email: state.email, mobile: state.mobile },
      };
      const ok = await saveStep(payload);
      if (ok) setStep(3);
    } else if (step === 3) {
      const payload: ProfileStepPayload = {
        step: 3,
        data: {
          addressLine1: state.addressLine1,
          barangay: state.barangay,
          city: state.city,
          province: state.province,
          zip: state.zip || null,
        },
      };
      const ok = await saveStep(payload);
      if (ok) setStep(4);
    } else if (step === 4) {
      const payload: ProfileStepPayload = {
        step: 4,
        data: {
          guardianName: state.guardianName,
          guardianRelationship: state.guardianRelationship,
          guardianMobile: state.guardianMobile,
        },
      };
      const ok = await saveStep(payload);
      if (ok) setStep(5);
    } else if (step === 5) {
      const payload: ProfileStepPayload = {
        step: 5,
        data: {
          studentType: state.studentType as "New" | "Transferee" | "Returnee",
          previousSchool: state.previousSchool || null,
          lastGradeCompleted: state.lastGradeCompleted || null,
        },
      };
      const ok = await saveStep(payload);
      if (ok) setStep(6);
    }
  };

  const canProceed = () => {
    if (step === 1)
      return !!(
        state.firstName.trim() &&
        state.lastName.trim() &&
        state.birthday
      );
    if (step === 2) return !!(state.email.trim() && state.mobile.trim());
    if (step === 3)
      return !!(
        state.addressLine1.trim() &&
        state.barangay.trim() &&
        state.city.trim() &&
        state.province.trim()
      );
    if (step === 4)
      return !!(
        state.guardianName.trim() &&
        state.guardianRelationship.trim() &&
        state.guardianMobile.trim()
      );
    if (step === 5) return !!state.studentType;
    return true;
  };

  const inputClass =
    "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#6A0000]/40 focus:border-[#6A0000]";

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#6A0000]">Student Setup</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Complete your profile to proceed.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <Progress
            value={(step / TOTAL_STEPS) * 100}
            className="h-2 flex-1 [&>div]:bg-[#6A0000]"
          />
          <span className="text-xs font-medium text-neutral-600">
            Step {step} of {TOTAL_STEPS}
          </span>
        </div>
      </div>

      <Card className="overflow-hidden rounded-xl border-[#6A0000]/15 bg-white shadow-lg">
        <div className="grid md:grid-cols-[220px_1fr]">
          <div className="border-b border-neutral-200 bg-neutral-50/50 p-4 md:border-b-0 md:border-r">
            <StepIndicator
              currentStep={step}
              completedSteps={completedSteps}
              onStepClick={setStep}
            />
            <StepIndicator
              currentStep={step}
              completedSteps={completedSteps}
              onStepClick={setStep}
              compact
            />
          </div>
          <div>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-neutral-900">
                {step === 1 && "Personal Details"}
                {step === 2 && "Contact Details"}
                {step === 3 && "Address"}
                {step === 4 && "Guardian / Emergency Contact"}
                {step === 5 && "Academic Background"}
                {step === 6 && "Review & Submit"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pb-6">
              {error && (
                <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              )}
              {savedAt && (
                <p className="text-xs text-emerald-600">Saved</p>
              )}

              {step === 1 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="firstName">First name *</Label>
                    <Input
                      id="firstName"
                      className={inputClass}
                      value={state.firstName}
                      onChange={(e) =>
                        setState((s) => ({ ...s, firstName: e.target.value }))
                      }
                      placeholder="Juan"
                    />
                  </div>
                  <div>
                    <Label htmlFor="middleName">Middle name</Label>
                    <Input
                      id="middleName"
                      className={inputClass}
                      value={state.middleName}
                      onChange={(e) =>
                        setState((s) => ({ ...s, middleName: e.target.value }))
                      }
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last name *</Label>
                    <Input
                      id="lastName"
                      className={inputClass}
                      value={state.lastName}
                      onChange={(e) =>
                        setState((s) => ({ ...s, lastName: e.target.value }))
                      }
                      placeholder="Dela Cruz"
                    />
                  </div>
                  <div>
                    <Label htmlFor="birthday">Date of birth *</Label>
                    <Input
                      id="birthday"
                      type="date"
                      className={inputClass}
                      value={state.birthday}
                      onChange={(e) =>
                        setState((s) => ({ ...s, birthday: e.target.value }))
                      }
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      className={inputClass}
                      value={state.email}
                      onChange={(e) =>
                        setState((s) => ({ ...s, email: e.target.value }))
                      }
                      placeholder="you@example.com"
                    />
                    <p className="mt-1 text-xs text-neutral-500">
                      Email we can reach you on
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="mobile">Mobile number *</Label>
                    <Input
                      id="mobile"
                      type="tel"
                      className={inputClass}
                      value={state.mobile}
                      onChange={(e) =>
                        setState((s) => ({ ...s, mobile: e.target.value }))
                      }
                      placeholder="09xxxxxxxxx"
                    />
                    <p className="mt-1 text-xs text-neutral-500">
                      Mobile number we can contact you on
                    </p>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="addressLine1">Street / House no. *</Label>
                    <Input
                      id="addressLine1"
                      className={inputClass}
                      value={state.addressLine1}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          addressLine1: e.target.value,
                        }))
                      }
                      placeholder="House No., Street, Purok"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="barangay">Barangay *</Label>
                      <Input
                        id="barangay"
                        className={inputClass}
                        value={state.barangay}
                        onChange={(e) =>
                          setState((s) => ({ ...s, barangay: e.target.value }))
                        }
                        placeholder="Barangay"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        className={inputClass}
                        value={state.city}
                        onChange={(e) =>
                          setState((s) => ({ ...s, city: e.target.value }))
                        }
                        placeholder="City / Municipality"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="province">Province *</Label>
                      <Input
                        id="province"
                        className={inputClass}
                        value={state.province}
                        onChange={(e) =>
                          setState((s) => ({ ...s, province: e.target.value }))
                        }
                        placeholder="Province"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zip">ZIP code</Label>
                      <Input
                        id="zip"
                        className={inputClass}
                        value={state.zip}
                        onChange={(e) =>
                          setState((s) => ({ ...s, zip: e.target.value }))
                        }
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="guardianName">Guardian name *</Label>
                    <Input
                      id="guardianName"
                      className={inputClass}
                      value={state.guardianName}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          guardianName: e.target.value,
                        }))
                      }
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="guardianRelationship">
                      Relationship *
                    </Label>
                    <Input
                      id="guardianRelationship"
                      className={inputClass}
                      value={state.guardianRelationship}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          guardianRelationship: e.target.value,
                        }))
                      }
                      placeholder="e.g. Mother, Father"
                    />
                  </div>
                  <div>
                    <Label htmlFor="guardianMobile">Guardian mobile *</Label>
                    <Input
                      id="guardianMobile"
                      type="tel"
                      className={inputClass}
                      value={state.guardianMobile}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          guardianMobile: e.target.value,
                        }))
                      }
                      placeholder="09xxxxxxxxx"
                    />
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="studentType">Student type *</Label>
                    <Select
                      value={state.studentType}
                      onValueChange={(v) =>
                        setState((s) => ({ ...s, studentType: v }))
                      }
                    >
                      <SelectTrigger className={inputClass}>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="Transferee">Transferee</SelectItem>
                        <SelectItem value="Returnee">Returnee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="previousSchool">Previous school</Label>
                    <Input
                      id="previousSchool"
                      className={inputClass}
                      value={state.previousSchool}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          previousSchool: e.target.value,
                        }))
                      }
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastGradeCompleted">
                      Last grade completed
                    </Label>
                    <Input
                      id="lastGradeCompleted"
                      className={inputClass}
                      value={state.lastGradeCompleted}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          lastGradeCompleted: e.target.value,
                        }))
                      }
                      placeholder="e.g. Grade 12"
                    />
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-4">
                  <ReviewCard
                    data={
                      {
                        personal: {
                          firstName: state.firstName,
                          middleName: state.middleName || null,
                          lastName: state.lastName,
                          birthday: state.birthday || null,
                        },
                        contact: { email: state.email, mobile: state.mobile },
                        address: {
                          addressLine1: state.addressLine1,
                          barangay: state.barangay,
                          city: state.city,
                          province: state.province,
                        },
                        guardian: {
                          guardianName: state.guardianName,
                          guardianRelationship: state.guardianRelationship,
                          guardianMobile: state.guardianMobile,
                        },
                        academic: {
                          studentType: state.studentType,
                          previousSchool: state.previousSchool || null,
                          lastGradeCompleted: state.lastGradeCompleted || null,
                        },
                      } as ReviewData
                    }
                    onEditStep={setStep}
                  />
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                      className="rounded border-neutral-300 text-[#6A0000] focus:ring-[#6A0000]"
                    />
                    <span className="text-sm">
                      I confirm the above information is correct. *
                    </span>
                  </label>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                {step > 1 && step < 6 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                  >
                    Back
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={goNext}
                  disabled={saving || (step < 6 && !canProceed())}
                >
                  {saving
                    ? "Saving…"
                    : step === 6
                      ? "Finish"
                      : "Next"}
                </Button>
              </div>
            </CardContent>
          </div>
        </div>
      </Card>
    </div>
  );
}
