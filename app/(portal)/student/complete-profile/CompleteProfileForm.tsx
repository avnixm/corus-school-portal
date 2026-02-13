"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import { submitPendingApplication } from "@/app/actions/pendingStudents";

const PROGRAMS = [
  { value: "BSIT", label: "BSIT" },
  { value: "BSBA", label: "BSBA" },
  { value: "BSED", label: "BSED" },
  { value: "BEED", label: "BEED" },
];

const LOCALITIES: Record<string, Record<string, string[]>> = {
  "Nueva Ecija": {
    Guimba: [
      "Agcano",
      "Ayos Lomboy",
      "Bacayao",
      "Bagong Barrio",
      "Balbalino",
      "Balingog East",
      "Balingog West",
      "Banitan",
      "Bantug",
      "Bulakid",
      "Bunol",
      "Caballero",
      "Cabaruan",
      "Caingin Tabing Ilog",
      "Calem",
      "Camiing",
      "Cardinal",
      "Casongsong",
      "Catimon",
      "Cavite",
      "Cawayan Bugtong",
      "Consuelo",
      "Culong",
      "Escaño",
      "Faigal",
      "Galvan",
      "Guiset",
      "Lamorito",
      "Lennec",
      "Macamias",
      "Macapabellag",
      "Macatcatuit",
      "Manacsac",
      "Manggang Marikit",
      "Maturanoc",
      "Maybubon",
      "Naglabrahan",
      "Nagpandayan",
      "Narvacan I",
      "Narvacan II",
      "Pacac",
      "Partida I",
      "Partida II",
      "Pasong Intsik",
      "Saint John District (Poblacion)",
      "San Agustin",
      "San Andres",
      "San Bernardino",
      "San Marcelino",
      "San Miguel",
      "San Rafael",
      "San Roque",
      "Santa Ana",
      "Santa Cruz",
      "Santa Lucia",
      "Santa Veronica District (Poblacion)",
      "Santo Cristo District (Poblacion)",
      "Saranay District (Poblacion)",
      "Sinulatan",
      "Subol",
      "Tampac I",
      "Tampac II & III",
      "Triala",
      "Yuson",
    ],
    Cuyapo: ["Poblacion", "Sta. Rita", "Rizal", "San Antonio"],
  },
  Tarlac: {
    Tarlac: ["San Vicente", "San Rafael", "Matatalaib"],
  },
};

export default function CompleteProfileForm({
  defaultName,
  defaultEmail,
}: {
  defaultName: string;
  defaultEmail: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState(defaultName);
  const [email] = useState(defaultEmail);
  const [birthday, setBirthday] = useState("");
  const [street, setStreet] = useState("");
  const [province, setProvince] = useState<string>(Object.keys(LOCALITIES)[0] ?? "");
  const [municipality, setMunicipality] = useState<string>(
    Object.keys(LOCALITIES[Object.keys(LOCALITIES)[0]] ?? {})[0] ?? ""
  );
  const [barangay, setBarangay] = useState<string>(
    (LOCALITIES[Object.keys(LOCALITIES)[0]] &&
      LOCALITIES[Object.keys(LOCALITIES)[0]][
        Object.keys(LOCALITIES[Object.keys(LOCALITIES)[0]] ?? {})[0]
      ]?.[0]) || ""
  );
  const [program, setProgram] = useState("BSIT");
  const [yearLevel, setYearLevel] = useState("");
  const [notes, setNotes] = useState("");
  const [showRequirements, setShowRequirements] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const provinceKeys = Object.keys(LOCALITIES);
  const municipalityKeys = Object.keys(LOCALITIES[province] ?? {});
  const barangayOptions = LOCALITIES[province]?.[municipality] ?? [];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("name", name);
      form.set("email", email);
      form.set("birthday", birthday);
      form.set("street", street);
      form.set("province", province);
      form.set("municipality", municipality);
      form.set("barangay", barangay);
      form.set("program", program);
      form.set("yearLevel", yearLevel);
      form.set("notes", notes);

      await submitPendingApplication(form);
      router.replace("/student/pending-approval");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#6A0000]/40 focus:border-[#6A0000]";

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Card className="rounded-xl border-[#6A0000]/15 bg-white/90 shadow-xl backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl text-[#6A0000]">
            Complete Student Information
          </CardTitle>
          <p className="text-sm text-neutral-900">
            Please provide the following details to finish setting up your CORUS
            account.
          </p>
          <div className="flex gap-2 pt-2">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStep(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  step === s
                    ? "bg-[#6A0000] text-white"
                    : "bg-[#6A0000]/10 text-[#6A0000] hover:bg-[#6A0000]/20"
                }`}
              >
                Step {s}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={onSubmit} className="space-y-8">
            {error && (
              <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            {step === 1 && (
              <div>
                <div className="mb-3 text-xs uppercase tracking-wide text-neutral-700">
                  Personal information
                </div>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-900">
                      Full name<span className="text-red-600">*</span>
                    </label>
                    <input
                      className={inputClass}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-900">
                      Email
                    </label>
                    <input
                      className="w-full rounded-md border border-neutral-300 bg-neutral-100 px-3 py-2 text-neutral-900"
                      value={email}
                      disabled
                    />
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-900">
                      Birthday
                    </label>
                    <input
                      type="date"
                      className={inputClass}
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-900">
                      Program
                    </label>
                    <select
                      className={inputClass}
                      value={program}
                      onChange={(e) => setProgram(e.target.value)}
                    >
                      {PROGRAMS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="mb-3 text-xs uppercase tracking-wide text-neutral-700">
                  Enrollment details
                </div>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-900">
                      Year level
                    </label>
                    <select
                      className={inputClass}
                      value={yearLevel}
                      onChange={(e) => setYearLevel(e.target.value)}
                    >
                      <option value="">Select year level</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-900">
                      Province
                    </label>
                    <select
                      className={inputClass}
                      value={province}
                      onChange={(e) => {
                        const prov = e.target.value;
                        setProvince(prov);
                        const firstMun =
                          Object.keys(LOCALITIES[prov] ?? {})[0] ?? "";
                        setMunicipality(firstMun);
                        const firstBar =
                          LOCALITIES[prov]?.[firstMun]?.[0] ?? "";
                        setBarangay(firstBar);
                      }}
                    >
                      {provinceKeys.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-900">
                      Municipality / City
                    </label>
                    <select
                      className={inputClass}
                      value={municipality}
                      onChange={(e) => {
                        const mun = e.target.value;
                        setMunicipality(mun);
                        const firstBar =
                          LOCALITIES[province]?.[mun]?.[0] ?? "";
                        setBarangay(firstBar);
                      }}
                    >
                      {municipalityKeys.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-900">
                      Barangay
                    </label>
                    <select
                      className={inputClass}
                      value={barangay}
                      onChange={(e) => setBarangay(e.target.value)}
                    >
                      {barangayOptions.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-5">
                  <label className="mb-1 block text-sm font-medium text-neutral-900">
                    House / Street / Purok
                  </label>
                  <input
                    className={inputClass}
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="House No., Street, Subdivision / Purok"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <label className="block text-sm font-medium text-neutral-900">
                    Upload requirements
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowRequirements((s) => !s)}
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#6A0000]/40 text-[#6A0000] hover:bg-[#6A0000]/10"
                    aria-label="Show required documents"
                  >
                    <Info size={12} />
                  </button>
                  <span className="text-xs text-neutral-700">
                    Tap the i for the checklist
                  </span>
                </div>
                {showRequirements && (
                  <div className="mb-2 rounded-md border border-[#6A0000]/20 bg-white p-3 text-sm text-neutral-900">
                    <div className="mb-1 font-medium text-[#6A0000]">
                      Typical new student requirements:
                    </div>
                    <ul className="list-disc space-y-1 pl-5">
                      <li>Form 138 / Report Card</li>
                      <li>PSA Birth Certificate</li>
                      <li>Certificate of Good Moral Character</li>
                      <li>2x2 ID Photo (JPEG/PNG)</li>
                      <li>Any other program-specific documents</li>
                    </ul>
                  </div>
                )}
                <p className="mb-2 text-xs text-neutral-700">
                  File upload will be available in a future update. Add any notes
                  for the registrar below.
                </p>
                <textarea
                  className={`${inputClass} min-h-[120px]`}
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes to registrar (e.g., remarks about documents)"
                />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                >
                  Back
                </Button>
              )}
              {step < 3 ? (
                <Button type="button" onClick={() => setStep(step + 1)}>
                  Next
                </Button>
              ) : (
                <Button type="submit" size="lg" disabled={submitting}>
                  {submitting ? "Saving..." : "Submit"}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
