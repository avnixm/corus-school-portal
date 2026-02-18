"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import {
  postPaymentAction,
  searchStudentsAction,
  getEnrollmentsForStudentAction,
} from "./actions";

function fullName(r: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
}) {
  return [r.firstName, r.middleName, r.lastName].filter(Boolean).join(" ");
}

export function PostPaymentForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<
    { id: string; studentCode: string | null; firstName: string; middleName: string | null; lastName: string }[]
  >([]);
  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    studentCode: string | null;
    firstName: string;
    middleName: string | null;
    lastName: string;
  } | null>(null);
  const [enrollments, setEnrollments] = useState<
    {
      id: string;
      schoolYearName: string;
      termName: string;
      program: string | null;
      yearLevel: string | null;
      balance: string | null;
      financeStatus: string | null;
    }[]
  >([]);
  const [enrollmentId, setEnrollmentId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"cash" | "gcash" | "bank" | "card" | "other">("cash");
  const [paymentFor, setPaymentFor] = useState<"installment" | "downpayment" | "fullpayment" | "misc">("installment");
  const [miscSpecify, setMiscSpecify] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [lastPaymentId, setLastPaymentId] = useState<string | null>(null);

  const selectedEnrollment = enrollments.find((e) => e.id === enrollmentId);
  const currentBalance = selectedEnrollment ? parseFloat(selectedEnrollment.balance ?? "0") : 0;
  const paymentAmount = parseFloat(amount || "0");
  const rawNewBalance = currentBalance - paymentAmount;
  const newBalance = Math.round(rawNewBalance * 100) / 100;

  async function handleSearch() {
    if (!search.trim()) return;
    const results = await searchStudentsAction(search);
    setSearchResults(results);
    setSelectedStudent(null);
    setEnrollments([]);
    setEnrollmentId("");
    setLastPaymentId(null);
  }

  async function handleSelectStudent(student: (typeof searchResults)[0]) {
    setSelectedStudent(student);
    setLastPaymentId(null);
    setPaymentFor("installment");
    setMiscSpecify("");
    const encs = await getEnrollmentsForStudentAction(student.id);
    setEnrollments(encs);
    setEnrollmentId(encs[0]?.id ?? "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selectedStudent) {
      setError("Search and select a student first");
      return;
    }
    if (!enrollmentId) {
      setError("Select an enrollment");
      return;
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (amt > currentBalance && !confirm("Payment exceeds current balance. Continue with overpayment?")) {
      return;
    }
    if (paymentFor === "misc" && !miscSpecify.trim()) {
      setError("Specify what the miscellaneous payment is for (e.g. t-shirt, ID)");
      return;
    }
    let remarks = "";
    if (paymentFor === "installment" && selectedEnrollment) {
      remarks = `Installment - ${selectedEnrollment.schoolYearName} ${selectedEnrollment.termName}`;
    } else if (paymentFor === "downpayment") {
      remarks = "Down payment";
    } else if (paymentFor === "fullpayment") {
      remarks = "Full payment";
    } else if (paymentFor === "misc") {
      remarks = `Miscellaneous - ${miscSpecify.trim()}`;
    }
    if (additionalNotes.trim()) {
      remarks += (remarks ? ". " : "") + additionalNotes.trim();
    }
    startTransition(async () => {
      const formData = new FormData();
      formData.set("studentId", selectedStudent.id);
      formData.set("enrollmentId", enrollmentId);
      formData.set("amount", amt.toFixed(2));
      formData.set("method", method);
      formData.set("remarks", remarks);
      const result = await postPaymentAction(formData);
      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success(`Payment of ₱${amt.toFixed(2)} posted successfully`);
      setAmount("");
      setMiscSpecify("");
      setAdditionalNotes("");
      if ("paymentId" in result && result.paymentId) {
        setLastPaymentId(result.paymentId);
      }
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-[#6A0000]">
          Post Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div>
          <Label>Search Student</Label>
          <div className="flex gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
              placeholder="Student number or name"
            />
            <Button type="button" onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 max-h-40 overflow-y-auto rounded border">
              {searchResults.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectStudent(s)}
                  className={`block w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 ${
                    selectedStudent?.id === s.id ? "bg-[#6A0000]/10" : ""
                  }`}
                >
                  {s.studentCode ?? ""} – {fullName(s)}
                </button>
              ))}
            </div>
          )}
        </div>
        {selectedStudent && (
          <div className="space-y-2">
            <div className="rounded border bg-neutral-50 p-3 text-sm">
              <span className="font-medium text-[#6A0000]">
                {selectedStudent.studentCode ?? ""} – {fullName(selectedStudent)}
              </span>
            </div>
            {enrollments.length === 0 && (
              <p className="text-sm text-amber-700">
                No approved enrollments for this student. The student must have an approved enrollment before payments can be posted.
              </p>
            )}
          </div>
        )}
        {enrollments.length > 0 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="enrollmentId">Enrollment *</Label>
              <select
                id="enrollmentId"
                value={enrollmentId}
                onChange={(e) => {
                  setEnrollmentId(e.target.value);
                  setPaymentFor("installment");
                }}
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                {enrollments.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.schoolYearName} / {e.termName} – {e.program ?? "—"}{" "}
                    {e.yearLevel ?? ""} (Balance: ₱
                    {parseFloat(e.balance ?? "0").toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                {paymentAmount > 0 && selectedEnrollment && (
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between text-neutral-700">
                      <span>Current balance:</span>
                      <span>₱{currentBalance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>New balance:</span>
                      <span className={newBalance < 0 ? "text-amber-700" : "text-green-700"}>
                        ₱{newBalance.toLocaleString()}
                      </span>
                    </div>
                    {newBalance < 0 && (
                      <p className="text-xs text-amber-700">
                        ⚠️ Payment exceeds balance (overpayment)
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="method">Method *</Label>
                <select
                  id="method"
                  value={method}
                  onChange={(e) =>
                    setMethod(e.target.value as "cash" | "gcash" | "bank" | "card" | "other")
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  <option value="cash">Cash</option>
                  <option value="gcash">GCash</option>
                  <option value="bank">Bank</option>
                  <option value="card">Card</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="paymentFor">Payment for *</Label>
              <select
                id="paymentFor"
                value={paymentFor}
                onChange={(e) => {
                  const val = e.target.value as "installment" | "downpayment" | "fullpayment" | "misc";
                  setPaymentFor(val);
                  if (val !== "misc") setMiscSpecify("");
                  if (val === "fullpayment") {
                    setAmount(currentBalance > 0 ? currentBalance.toFixed(2) : "");
                  }
                }}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="installment">
                  Installment - {selectedEnrollment?.schoolYearName ?? "—"} {selectedEnrollment?.termName ?? "—"}
                </option>
                <option value="downpayment">Down payment</option>
                <option value="fullpayment">Full payment</option>
                <option value="misc">Miscellaneous</option>
              </select>
            </div>
            {paymentFor === "misc" && (
              <div>
                <Label htmlFor="miscSpecify">Specify (e.g. t-shirt, ID, lab coat) *</Label>
                <Input
                  id="miscSpecify"
                  value={miscSpecify}
                  onChange={(e) => setMiscSpecify(e.target.value)}
                  placeholder="Required when Miscellaneous is selected"
                />
              </div>
            )}
            <div>
              <Label htmlFor="additionalNotes">Additional notes</Label>
              <Input
                id="additionalNotes"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Post Payment
              </Button>
              {lastPaymentId && (
                <a
                  href={`/finance/payments/${lastPaymentId}/receipt`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#6A0000] hover:underline"
                >
                  <Printer className="h-4 w-4" />
                  Print receipt
                </a>
              )}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
