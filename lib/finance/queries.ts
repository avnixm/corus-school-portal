import { db } from "@/lib/db";
import {
  enrollments,
  students,
  schoolYears,
  terms,
  feeItems,
  programFeeRules,
  assessments,
  assessmentLines,
  ledgerEntries,
  payments,
  paymentAllocations,
  enrollmentFinanceStatus,
} from "@/db/schema";
import { eq, and, desc, sql, or, like, ilike, gte, lte, isNull, isNotNull } from "drizzle-orm";

export async function getApprovedEnrollmentsNeedingAssessment() {
  try {
    const withAssessments = await db
      .select({ enrollmentId: assessments.enrollmentId })
      .from(assessments);
    const excludedIds = new Set(withAssessments.map((a) => a.enrollmentId));

    const rows = await db
      .select({
        id: enrollments.id,
        studentId: enrollments.studentId,
        schoolYearName: schoolYears.name,
        termName: terms.name,
        program: enrollments.program,
        yearLevel: enrollments.yearLevel,
        firstName: students.firstName,
        middleName: students.middleName,
        lastName: students.lastName,
        studentCode: students.studentCode,
      })
      .from(enrollments)
      .innerJoin(students, eq(enrollments.studentId, students.id))
      .innerJoin(schoolYears, eq(enrollments.schoolYearId, schoolYears.id))
      .innerJoin(terms, eq(enrollments.termId, terms.id))
      .innerJoin(
        enrollmentFinanceStatus,
        eq(enrollments.id, enrollmentFinanceStatus.enrollmentId)
      )
      .where(
        and(
          eq(enrollments.status, "approved"),
          eq(enrollmentFinanceStatus.status, "unassessed")
        ) ?? sql`true`
      )
      .orderBy(desc(enrollments.createdAt));

    return rows.filter((r) => !excludedIds.has(r.id));
  } catch {
    return [];
  }
}

export async function getFeeItems(activeOnly = true) {
  try {
    if (activeOnly) {
      return await db
        .select()
        .from(feeItems)
        .where(eq(feeItems.active, true))
        .orderBy(feeItems.code);
    }
    return await db.select().from(feeItems).orderBy(feeItems.code);
  } catch {
    return [];
  }
}

export async function getProgramFeeRules(filters?: {
  program?: string;
  yearLevel?: string;
  schoolYearId?: string;
  termId?: string;
}) {
  try {
    const conds: ReturnType<typeof eq>[] = [];
    if (filters?.program) conds.push(eq(programFeeRules.program, filters.program));
    if (filters?.yearLevel)
      conds.push(eq(programFeeRules.yearLevel, filters.yearLevel));
    if (filters?.schoolYearId)
      conds.push(eq(programFeeRules.schoolYearId, filters.schoolYearId));
    if (filters?.termId)
      conds.push(eq(programFeeRules.termId, filters.termId));

    const base = db
      .select({
        id: programFeeRules.id,
        program: programFeeRules.program,
        yearLevel: programFeeRules.yearLevel,
        schoolYearId: programFeeRules.schoolYearId,
        termId: programFeeRules.termId,
        feeItemId: programFeeRules.feeItemId,
        amount: programFeeRules.amount,
        feeCode: feeItems.code,
        feeName: feeItems.name,
        feeCategory: feeItems.category,
      })
      .from(programFeeRules)
      .innerJoin(feeItems, eq(programFeeRules.feeItemId, feeItems.id))
      .orderBy(programFeeRules.program, programFeeRules.yearLevel);

    if (conds.length > 0) {
      return await base.where(and(...conds));
    }
    return await base;
  } catch {
    return [];
  }
}

export async function getAssessmentsByEnrollment(enrollmentId: string) {
  return db
    .select()
    .from(assessments)
    .where(eq(assessments.enrollmentId, enrollmentId))
    .orderBy(desc(assessments.assessedAt));
}

export async function getAssessmentById(assessmentId: string) {
  const [row] = await db
    .select()
    .from(assessments)
    .where(eq(assessments.id, assessmentId))
    .limit(1);
  return row ?? null;
}

export async function getAssessmentWithLines(assessmentId: string) {
  const [assessment] = await db
    .select()
    .from(assessments)
    .where(eq(assessments.id, assessmentId))
    .limit(1);
  if (!assessment) return null;

  const lines = await db
    .select({
      id: assessmentLines.id,
      feeItemId: assessmentLines.feeItemId,
      description: assessmentLines.description,
      category: assessmentLines.category,
      amount: assessmentLines.amount,
      qty: assessmentLines.qty,
      lineTotal: assessmentLines.lineTotal,
      sortOrder: assessmentLines.sortOrder,
      feeCode: feeItems.code,
    })
    .from(assessmentLines)
    .leftJoin(feeItems, eq(assessmentLines.feeItemId, feeItems.id))
    .where(eq(assessmentLines.assessmentId, assessmentId))
    .orderBy(assessmentLines.sortOrder);

  return { assessment, lines };
}

export async function getLedgerEntriesByEnrollment(
  enrollmentId: string,
  limit = 100
) {
  // Exclude ledger entries that reference voided payments (original payment + void reversal)
  const excludeVoidedPayments = sql`NOT (
    ${ledgerEntries.referenceType} = 'payment'::ledger_reference_type
    AND EXISTS (
      SELECT 1 FROM ${payments} p
      WHERE p.id = ${ledgerEntries.referenceId}
      AND p.status = 'void'
    )
  )`;
  return db
    .select()
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.enrollmentId, enrollmentId),
        excludeVoidedPayments
      )
    )
    .orderBy(desc(ledgerEntries.postedAt))
    .limit(limit);
}

export async function getLedgerEntriesByStudent(
  studentId: string,
  limit = 100
) {
  // Exclude ledger entries that reference voided payments (original payment + void reversal)
  const excludeVoidedPayments = sql`NOT (
    ${ledgerEntries.referenceType} = 'payment'::ledger_reference_type
    AND EXISTS (
      SELECT 1 FROM ${payments} p
      WHERE p.id = ${ledgerEntries.referenceId}
      AND p.status = 'void'
    )
  )`;
  return db
    .select()
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.studentId, studentId),
        excludeVoidedPayments
      )
    )
    .orderBy(desc(ledgerEntries.postedAt))
    .limit(limit);
}

export async function getPaymentById(paymentId: string) {
  const [row] = await db
    .select()
    .from(payments)
    .where(eq(payments.id, paymentId))
    .limit(1);
  return row ?? null;
}

export async function getPaymentWithDetails(paymentId: string) {
  const [row] = await db
    .select({
      paymentId: payments.id,
      amount: payments.amount,
      method: payments.method,
      referenceNo: payments.referenceNo,
      remarks: payments.remarks,
      status: payments.status,
      receivedAt: payments.receivedAt,
      enrollmentId: payments.enrollmentId,
      studentId: students.id,
      studentCode: students.studentCode,
      firstName: students.firstName,
      middleName: students.middleName,
      lastName: students.lastName,
      schoolYearName: schoolYears.name,
      termName: terms.name,
      program: enrollments.program,
      yearLevel: enrollments.yearLevel,
      balance: enrollmentFinanceStatus.balance,
      assessmentDiscounts: assessments.discounts,
    })
    .from(payments)
    .innerJoin(enrollments, eq(payments.enrollmentId, enrollments.id))
    .innerJoin(students, eq(payments.studentId, students.id))
    .innerJoin(schoolYears, eq(enrollments.schoolYearId, schoolYears.id))
    .innerJoin(terms, eq(enrollments.termId, terms.id))
    .leftJoin(
      enrollmentFinanceStatus,
      eq(enrollments.id, enrollmentFinanceStatus.enrollmentId)
    )
    .leftJoin(assessments, eq(assessments.enrollmentId, enrollments.id))
    .where(and(eq(payments.id, paymentId), eq(payments.status, "posted")))
    .limit(1);
  if (!row) return null;

  const isFullPayment =
    row.remarks?.toLowerCase().includes("full payment") ?? false;
  let discountAmount = parseFloat(row.assessmentDiscounts ?? "0");

  // Fallback: if full payment but no discount from join, fetch assessment directly
  if (isFullPayment && discountAmount <= 0 && row.enrollmentId) {
    const [ass] = await db
      .select({ discounts: assessments.discounts })
      .from(assessments)
      .where(eq(assessments.enrollmentId, row.enrollmentId))
      .orderBy(desc(assessments.updatedAt))
      .limit(1);
    if (ass) discountAmount = parseFloat(ass.discounts ?? "0");
  }

  const showDiscount = isFullPayment && discountAmount > 0;

  return {
    id: row.paymentId,
    amount: row.amount,
    method: row.method,
    referenceNo: row.referenceNo,
    remarks: row.remarks,
    receivedAt: row.receivedAt,
    studentId: row.studentId,
    studentCode: row.studentCode,
    fullName: [row.firstName, row.middleName, row.lastName]
      .filter(Boolean)
      .join(" "),
    schoolYearName: row.schoolYearName,
    termName: row.termName,
    program: row.program,
    yearLevel: row.yearLevel,
    balanceAfter: row.balance,
    ...(showDiscount && {
      discountAmount: discountAmount.toFixed(2),
      originalAmount: (parseFloat(row.amount ?? "0") + discountAmount).toFixed(2),
    }),
  };
}

export async function getPaymentsByEnrollment(enrollmentId: string) {
  return db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.enrollmentId, enrollmentId),
        eq(payments.status, "posted")
      )
    )
    .orderBy(desc(payments.receivedAt));
}

export async function getRecentPayments(limit = 20) {
  try {
    return await db
      .select({
        id: payments.id,
        amount: payments.amount,
        method: payments.method,
        referenceNo: payments.referenceNo,
        receivedAt: payments.receivedAt,
        studentCode: students.studentCode,
        firstName: students.firstName,
        middleName: students.middleName,
        lastName: students.lastName,
        schoolYearName: schoolYears.name,
        termName: terms.name,
        program: enrollments.program,
        yearLevel: enrollments.yearLevel,
      })
      .from(payments)
      .innerJoin(students, eq(payments.studentId, students.id))
      .innerJoin(enrollments, eq(payments.enrollmentId, enrollments.id))
      .innerJoin(schoolYears, eq(enrollments.schoolYearId, schoolYears.id))
      .innerJoin(terms, eq(enrollments.termId, terms.id))
      .where(eq(payments.status, "posted"))
      .orderBy(desc(payments.receivedAt))
      .limit(limit);
  } catch {
    return [];
  }
}

export async function getStudentBalance(enrollmentId: string) {
  const [efs] = await db
    .select()
    .from(enrollmentFinanceStatus)
    .where(eq(enrollmentFinanceStatus.enrollmentId, enrollmentId))
    .limit(1);
  return efs ?? null;
}

export async function getEnrollmentsForClearance(
  schoolYearId?: string,
  termId?: string
) {
  try {
    const conds: ReturnType<typeof eq>[] = [
      eq(enrollments.status, "approved"),
      eq(enrollmentFinanceStatus.status, "paid"),
    ];
    if (schoolYearId) conds.push(eq(enrollments.schoolYearId, schoolYearId));
    if (termId) conds.push(eq(enrollments.termId, termId));

    return await db
      .select({
        id: enrollments.id,
        studentId: enrollments.studentId,
        schoolYearName: schoolYears.name,
        termName: terms.name,
        program: enrollments.program,
        yearLevel: enrollments.yearLevel,
        balance: enrollmentFinanceStatus.balance,
        financeStatus: enrollmentFinanceStatus.status,
        firstName: students.firstName,
        middleName: students.middleName,
        lastName: students.lastName,
        studentCode: students.studentCode,
      })
      .from(enrollments)
      .innerJoin(students, eq(enrollments.studentId, students.id))
      .innerJoin(schoolYears, eq(enrollments.schoolYearId, schoolYears.id))
      .innerJoin(terms, eq(enrollments.termId, terms.id))
      .innerJoin(
        enrollmentFinanceStatus,
        eq(enrollments.id, enrollmentFinanceStatus.enrollmentId)
      )
      .where(and(...conds))
      .orderBy(desc(enrollments.updatedAt));
  } catch {
    return [];
  }
}

export async function getCollectionsReport(startDate: Date, endDate: Date) {
  try {
    const paymentsResult = await db
      .select({
        method: payments.method,
        amount: payments.amount,
      })
      .from(payments)
      .where(
        and(
          eq(payments.status, "posted"),
          gte(payments.receivedAt, startDate),
          lte(payments.receivedAt, endDate)
        )
      );

    const total = paymentsResult.reduce(
      (acc, p) => acc + parseFloat(p.amount ?? "0"),
      0
    );
    const byMethod: Record<string, number> = {};
    for (const p of paymentsResult) {
      const m = p.method ?? "other";
      byMethod[m] = (byMethod[m] ?? 0) + parseFloat(p.amount ?? "0");
    }

    return { total, byMethod, count: paymentsResult.length };
  } catch {
    return { total: 0, byMethod: {}, count: 0 };
  }
}

export async function getStudentsWithBalances(filters?: {
  schoolYearId?: string;
  termId?: string;
  balanceMin?: number;
}) {
  try {
    const conds: Parameters<typeof and>[0][] = [
      eq(enrollments.status, "approved"),
      sql`${enrollmentFinanceStatus.balance}::numeric > 0`,
    ];
    if (filters?.schoolYearId)
      conds.push(eq(enrollments.schoolYearId, filters.schoolYearId));
    if (filters?.termId) conds.push(eq(enrollments.termId, filters.termId));
    if (filters?.balanceMin !== undefined)
      conds.push(sql`${enrollmentFinanceStatus.balance}::numeric > ${filters.balanceMin}`);

    return await db
      .select({
        id: students.id,
        studentCode: students.studentCode,
        firstName: students.firstName,
        middleName: students.middleName,
        lastName: students.lastName,
        enrollmentId: enrollments.id,
        schoolYearName: schoolYears.name,
        termName: terms.name,
        program: enrollments.program,
        yearLevel: enrollments.yearLevel,
        balance: enrollmentFinanceStatus.balance,
        financeStatus: enrollmentFinanceStatus.status,
      })
      .from(students)
      .innerJoin(enrollments, eq(students.id, enrollments.studentId))
      .innerJoin(schoolYears, eq(enrollments.schoolYearId, schoolYears.id))
      .innerJoin(terms, eq(enrollments.termId, terms.id))
      .innerJoin(
        enrollmentFinanceStatus,
        eq(enrollments.id, enrollmentFinanceStatus.enrollmentId)
      )
      .where(and(...conds))
      .orderBy(desc(enrollmentFinanceStatus.balance));
  } catch {
    return [];
  }
}

export async function createFeeItem(values: {
  code: string;
  name: string;
  category: "tuition" | "misc" | "other";
  defaultAmount?: string | null;
}) {
  return db.insert(feeItems).values({
    ...values,
    defaultAmount: values.defaultAmount ?? null,
  });
}

export async function updateFeeItem(
  id: string,
  values: {
    code?: string;
    name?: string;
    category?: "tuition" | "misc" | "other";
    defaultAmount?: string | null;
  }
) {
  return db.update(feeItems).set({ ...values, updatedAt: new Date() }).where(eq(feeItems.id, id));
}

export async function toggleFeeItemActive(id: string, active: boolean) {
  return db.update(feeItems).set({ active, updatedAt: new Date() }).where(eq(feeItems.id, id));
}

export async function createProgramFeeRule(values: {
  program: string;
  yearLevel?: string | null;
  schoolYearId?: string | null;
  termId?: string | null;
  feeItemId: string;
  amount: string;
}) {
  return db.insert(programFeeRules).values(values);
}

export async function updateProgramFeeRule(
  id: string,
  values: {
    program?: string;
    yearLevel?: string | null;
    schoolYearId?: string | null;
    termId?: string | null;
    feeItemId?: string;
    amount?: string;
  }
) {
  return db
    .update(programFeeRules)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(programFeeRules.id, id));
}

export async function deleteProgramFeeRule(id: string) {
  return db.delete(programFeeRules).where(eq(programFeeRules.id, id));
}

// Assessments
export type AssessmentLineInput = {
  feeItemId?: string | null;
  description: string;
  category: "tuition" | "lab" | "misc" | "other";
  amount: string;
  qty?: number;
  sourceFeeSetupLineId?: string | null;
};

export async function getProgramFeeRulesForEnrollment(enrollmentId: string) {
  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.id, enrollmentId))
    .limit(1);
  if (!enrollment) return [];

  const programMatch = enrollment.programId
    ? or(
        and(isNotNull(programFeeRules.programId), eq(programFeeRules.programId, enrollment.programId)),
        and(isNull(programFeeRules.programId), eq(programFeeRules.program, enrollment.program ?? ""))
      )
    : eq(programFeeRules.program, enrollment.program ?? "");

  return db
    .select({
      feeItemId: programFeeRules.feeItemId,
      amount: programFeeRules.amount,
      feeCode: feeItems.code,
      feeName: feeItems.name,
      category: feeItems.category,
    })
    .from(programFeeRules)
    .innerJoin(feeItems, eq(programFeeRules.feeItemId, feeItems.id))
    .where(
      and(
        programMatch,
        or(
          isNull(programFeeRules.yearLevel),
          eq(programFeeRules.yearLevel, enrollment.yearLevel ?? "")
        ),
        or(
          isNull(programFeeRules.schoolYearId),
          eq(programFeeRules.schoolYearId, enrollment.schoolYearId)
        ),
        or(
          isNull(programFeeRules.termId),
          eq(programFeeRules.termId, enrollment.termId)
        ),
        eq(feeItems.active, true)
      )
    );
}

export async function createAssessmentDraft(
  enrollmentId: string,
  lines: AssessmentLineInput[],
  notes?: string | null,
  fullPaymentDiscount?: boolean
) {
  let discountAmount = 0;
  const lineTotals: string[] = [];
  for (const l of lines) {
    const qty = l.qty ?? 1;
    const baseTotal = parseFloat(l.amount) * qty;
    const isDiscountable = l.category === "tuition" || l.category === "lab";
    const lineTotal = fullPaymentDiscount && isDiscountable ? baseTotal * 0.9 : baseTotal;
    if (fullPaymentDiscount && isDiscountable) {
      discountAmount += baseTotal * 0.1;
    }
    lineTotals.push(lineTotal.toFixed(2));
  }
  const subtotal = lines.reduce(
    (sum, l) => sum + parseFloat(l.amount) * (l.qty ?? 1),
    0
  );
  const total = subtotal - discountAmount;

  const [assessment] = await db
    .insert(assessments)
    .values({
      enrollmentId,
      status: "draft",
      subtotal: String(subtotal.toFixed(2)),
      discounts: String(discountAmount.toFixed(2)),
      total: String(total.toFixed(2)),
      notes: notes ?? null,
    })
    .returning();
  if (!assessment) return null;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const qty = l.qty ?? 1;
    await db.insert(assessmentLines).values({
      assessmentId: assessment.id,
      feeItemId: l.feeItemId || null,
      description: l.description,
      category: l.category,
      amount: l.amount,
      qty,
      lineTotal: lineTotals[i],
      sortOrder: i,
    });
  }
  return assessment;
}

export async function updateAssessmentDraft(
  assessmentId: string,
  lines: AssessmentLineInput[],
  notes?: string | null,
  fullPaymentDiscount?: boolean
) {
  await db.delete(assessmentLines).where(eq(assessmentLines.assessmentId, assessmentId));
  let discountAmount = 0;
  const lineTotals: string[] = [];
  for (const l of lines) {
    const qty = l.qty ?? 1;
    const baseTotal = parseFloat(l.amount) * qty;
    const isDiscountable = l.category === "tuition" || l.category === "lab";
    const lineTotal = fullPaymentDiscount && isDiscountable ? baseTotal * 0.9 : baseTotal;
    if (fullPaymentDiscount && isDiscountable) {
      discountAmount += baseTotal * 0.1;
    }
    lineTotals.push(lineTotal.toFixed(2));
  }
  const subtotal = lines.reduce(
    (sum, l) => sum + parseFloat(l.amount) * (l.qty ?? 1),
    0
  );
  const total = subtotal - discountAmount;

  await db
    .update(assessments)
    .set({
      subtotal: String(subtotal.toFixed(2)),
      discounts: String(discountAmount.toFixed(2)),
      total: String(total.toFixed(2)),
      notes: notes ?? null,
      updatedAt: new Date(),
    })
    .where(eq(assessments.id, assessmentId));
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const qty = l.qty ?? 1;
    await db.insert(assessmentLines).values({
      assessmentId,
      feeItemId: l.feeItemId || null,
      description: l.description,
      category: l.category,
      amount: l.amount,
      qty,
      lineTotal: lineTotals[i],
      sortOrder: i,
    });
  }
}

export async function postAssessment(
  assessmentId: string,
  postedByUserId: string
) {
  const { assessment, lines } = (await getAssessmentWithLines(assessmentId)) ?? {};
  if (!assessment || assessment.status !== "draft") return null;

  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.id, assessment.enrollmentId))
    .limit(1);
  if (!enrollment) return null;
  if (enrollment.status !== "approved") return null;

  const { recomputeEnrollmentBalance } = await import("./recomputeEnrollmentBalance");

  const lineList = lines ?? [];
  for (const line of lineList) {
    await db.insert(ledgerEntries).values({
      studentId: enrollment.studentId,
      enrollmentId: enrollment.id,
      entryType: "charge",
      referenceType: "assessment",
      referenceId: assessmentId,
      description: line.description,
      debit: line.lineTotal ?? String(parseFloat(line.amount) * (line.qty ?? 1)),
      credit: "0",
      postedByUserId,
      postedAt: new Date(),
    });
  }

  await db
    .update(assessments)
    .set({
      status: "posted",
      assessedByUserId: postedByUserId,
      assessedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(assessments.id, assessmentId));

  await db
    .update(enrollmentFinanceStatus)
    .set({
      status: "assessed",
      updatedByUserId: postedByUserId,
      updatedAt: new Date(),
    })
    .where(eq(enrollmentFinanceStatus.enrollmentId, enrollment.id));

  await recomputeEnrollmentBalance(enrollment.id, postedByUserId);
  return assessment;
}

export async function getAssessmentsList(includePosted = true) {
  const base = db
    .select({
      id: assessments.id,
      enrollmentId: assessments.enrollmentId,
      status: assessments.status,
      subtotal: assessments.subtotal,
      discounts: assessments.discounts,
      total: assessments.total,
      assessedAt: assessments.assessedAt,
      firstName: students.firstName,
      middleName: students.middleName,
      lastName: students.lastName,
      studentCode: students.studentCode,
      schoolYearName: schoolYears.name,
      termName: terms.name,
      program: enrollments.program,
      yearLevel: enrollments.yearLevel,
    })
    .from(assessments)
    .innerJoin(enrollments, eq(assessments.enrollmentId, enrollments.id))
    .innerJoin(students, eq(enrollments.studentId, students.id))
    .innerJoin(schoolYears, eq(enrollments.schoolYearId, schoolYears.id))
    .innerJoin(terms, eq(enrollments.termId, terms.id))
    .orderBy(desc(assessments.updatedAt));
  if (!includePosted) {
    return base.where(eq(assessments.status, "draft"));
  }
  return base;
}

async function generateReceiptReferenceNo(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `OR-${year}-`;
  const existing = await db
    .select({ referenceNo: payments.referenceNo })
    .from(payments)
    .where(like(payments.referenceNo, `${prefix}%`));
  const numbers = existing
    .map((r) => parseInt(String(r.referenceNo || "").replace(prefix, ""), 10))
    .filter((n) => !isNaN(n) && n > 0);
  const nextNum = numbers.length === 0 ? 1 : Math.max(...numbers) + 1;
  return `${prefix}${String(nextNum).padStart(5, "0")}`;
}

export async function postPayment(params: {
  studentId: string;
  enrollmentId: string;
  amount: string;
  method: "cash" | "gcash" | "bank" | "card" | "other";
  referenceNo?: string | null;
  remarks?: string | null;
  receivedByUserId: string;
}) {
  const { recomputeEnrollmentBalance } = await import("./recomputeEnrollmentBalance");
  const referenceNo = params.referenceNo?.trim() || (await generateReceiptReferenceNo());

  const [payment] = await db
    .insert(payments)
    .values({
      studentId: params.studentId,
      enrollmentId: params.enrollmentId,
      method: params.method,
      amount: params.amount,
      referenceNo,
      remarks: params.remarks ?? null,
      receivedByUserId: params.receivedByUserId,
      status: "posted",
    })
    .returning();

  if (payment) {
    const [ledgerEntry] = await db
      .insert(ledgerEntries)
      .values({
        studentId: params.studentId,
        enrollmentId: params.enrollmentId,
        entryType: "payment",
        referenceType: "payment",
        referenceId: payment.id,
        description: `Payment Ref: ${referenceNo}`,
        debit: "0",
        credit: params.amount,
        postedByUserId: params.receivedByUserId,
        postedAt: new Date(),
      })
      .returning();

    if (ledgerEntry) {
      await db.insert(paymentAllocations).values({
        paymentId: payment.id,
        ledgerEntryId: ledgerEntry.id,
        amount: params.amount,
      });
    }

    await recomputeEnrollmentBalance(params.enrollmentId, params.receivedByUserId);
  }
  return payment;
}

export async function markCleared(enrollmentId: string, userId: string) {
  return db
    .update(enrollmentFinanceStatus)
    .set({
      status: "cleared",
      updatedByUserId: userId,
      updatedAt: new Date(),
    })
    .where(eq(enrollmentFinanceStatus.enrollmentId, enrollmentId));
}

export async function putOnHold(
  enrollmentId: string,
  userId: string,
  reason?: string
) {
  return db
    .update(enrollmentFinanceStatus)
    .set({
      status: "hold",
      updatedByUserId: userId,
      updatedAt: new Date(),
    })
    .where(eq(enrollmentFinanceStatus.enrollmentId, enrollmentId));
}

export async function voidPayment(paymentId: string, userId: string) {
  const [payment] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.id, paymentId), eq(payments.status, "posted")))
    .limit(1);
  if (!payment) return null;

  await db
    .update(payments)
    .set({ status: "void", updatedAt: new Date() })
    .where(eq(payments.id, paymentId));

  await db.insert(ledgerEntries).values({
    studentId: payment.studentId,
    enrollmentId: payment.enrollmentId,
    entryType: "refund",
    referenceType: "payment",
    referenceId: paymentId,
    description: "Void payment reversal",
    debit: payment.amount,
    credit: "0",
    postedByUserId: userId,
    postedAt: new Date(),
  });

  const { recomputeEnrollmentBalance } = await import("./recomputeEnrollmentBalance");
  await recomputeEnrollmentBalance(payment.enrollmentId, userId);
  return payment;
}

export async function getApprovedEnrollmentsByStudent(studentId: string) {
  const rows = await db
    .select({
      id: enrollments.id,
      schoolYearName: schoolYears.name,
      termName: terms.name,
      program: enrollments.program,
      yearLevel: enrollments.yearLevel,
      balance: enrollmentFinanceStatus.balance,
      financeStatus: enrollmentFinanceStatus.status,
    })
    .from(enrollments)
    .innerJoin(schoolYears, eq(enrollments.schoolYearId, schoolYears.id))
    .innerJoin(terms, eq(enrollments.termId, terms.id))
    .leftJoin(
      enrollmentFinanceStatus,
      eq(enrollments.id, enrollmentFinanceStatus.enrollmentId)
    )
    .where(
      and(
        eq(enrollments.studentId, studentId),
        eq(enrollments.status, "approved")
      )
    )
    .orderBy(desc(enrollments.updatedAt));
  return rows.map((r) => ({
    ...r,
    balance: r.balance ?? "0",
    financeStatus: r.financeStatus ?? "unassessed",
  }));
}

export async function getApprovedEnrollmentsByStudentId(studentId: string) {
  return db
    .select({
      id: enrollments.id,
      schoolYearName: schoolYears.name,
      termName: terms.name,
      program: enrollments.program,
      yearLevel: enrollments.yearLevel,
      balance: enrollmentFinanceStatus.balance,
      financeStatus: enrollmentFinanceStatus.status,
    })
    .from(enrollments)
    .innerJoin(schoolYears, eq(enrollments.schoolYearId, schoolYears.id))
    .innerJoin(terms, eq(enrollments.termId, terms.id))
    .leftJoin(
      enrollmentFinanceStatus,
      eq(enrollments.id, enrollmentFinanceStatus.enrollmentId)
    )
    .where(
      and(
        eq(enrollments.studentId, studentId),
        eq(enrollments.status, "approved")
      )
    )
    .orderBy(desc(enrollments.createdAt));
}

export async function searchStudentsByCodeOrName(search: string) {
  if (!search?.trim()) return [];
  const s = `%${search.trim()}%`;
  return db
    .select({
      id: students.id,
      studentCode: students.studentCode,
      firstName: students.firstName,
      middleName: students.middleName,
      lastName: students.lastName,
    })
    .from(students)
    .where(
      and(
        isNull(students.deletedAt),
        or(
          ilike(students.firstName, s),
          ilike(students.lastName, s),
          ilike(students.middleName, s),
          sql`${students.studentCode}::text ILIKE ${s}`
        )
      )
    )
    .limit(20);
}

