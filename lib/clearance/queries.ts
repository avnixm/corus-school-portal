import { db } from "@/lib/db";
import {
  clearanceRequests,
  clearanceItems,
  promissoryNotes,
  gradingPeriods,
  enrollments,
  students,
  schoolYears,
  terms,
  enrollmentFinanceStatus,
  governanceFlags,
  enrollmentSubjects,
  subjects,
  sections,
  classSchedules,
  userProfile,
} from "@/db/schema";
import { getSystemSetting } from "@/db/queries";
import { getApprovedEnrollmentsByStudent } from "@/lib/finance/queries";
import { eq, and, desc, inArray, or, sql } from "drizzle-orm";

const BLOCKING_EFS_STATUSES = ["assessed", "partially_paid", "hold"] as const;

/** True if enrollment has balance due or active finance hold (finance clearance blocked). */
export async function isFinanceBlocked(enrollmentId: string): Promise<boolean> {
  const [efs] = await db
    .select({
      status: enrollmentFinanceStatus.status,
      balance: enrollmentFinanceStatus.balance,
    })
    .from(enrollmentFinanceStatus)
    .where(eq(enrollmentFinanceStatus.enrollmentId, enrollmentId))
    .limit(1);

  if (!efs) return false;
  const hasBalance = parseFloat(efs.balance ?? "0") > 0;
  if (BLOCKING_EFS_STATUSES.includes(efs.status as (typeof BLOCKING_EFS_STATUSES)[number]) && hasBalance)
    return true;

  const [enrollment] = await db
    .select({ studentId: enrollments.studentId })
    .from(enrollments)
    .where(eq(enrollments.id, enrollmentId))
    .limit(1);
  if (!enrollment) return false;

  const [flag] = await db
    .select({ id: governanceFlags.id })
    .from(governanceFlags)
    .where(
      and(
        eq(governanceFlags.status, "active"),
        eq(governanceFlags.flagType, "finance_hold"),
        or(
          eq(governanceFlags.enrollmentId, enrollmentId),
          eq(governanceFlags.studentId, enrollment.studentId)
        )!
      )
    )
    .limit(1);
  return !!flag;
}

/** Heuristic: subject is lab-related (add Computer Lab clearance item). */
function isLabSubject(code: string | null, title: string | null): boolean {
  const c = (code ?? "").toLowerCase();
  const t = (title ?? "").toLowerCase();
  return /lab|computer|programming|nstp/i.test(c) || /lab|computer|programming/i.test(t);
}

/** Get or create a clearance request for (enrollmentId, periodId). Creates items and sets finance blocked when applicable. */
export async function getOrCreateClearanceRequest(
  enrollmentId: string,
  periodId: string,
  createdByUserId?: string | null
) {
  const [existing] = await db
    .select()
    .from(clearanceRequests)
    .where(
      and(
        eq(clearanceRequests.enrollmentId, enrollmentId),
        eq(clearanceRequests.periodId, periodId)
      )
    )
    .limit(1);

  if (existing) {
    const items = await db
      .select()
      .from(clearanceItems)
      .where(eq(clearanceItems.clearanceRequestId, existing.id))
      .orderBy(clearanceItems.officeType);
    return { request: existing, items };
  }

  const [enrollment] = await db
    .select({
      id: enrollments.id,
      studentId: enrollments.studentId,
      schoolYearId: enrollments.schoolYearId,
      termId: enrollments.termId,
    })
    .from(enrollments)
    .where(eq(enrollments.id, enrollmentId))
    .limit(1);

  if (!enrollment) return null;

  const [period] = await db
    .select()
    .from(gradingPeriods)
    .where(eq(gradingPeriods.id, periodId))
    .limit(1);
  if (!period) return null;

  const financeBlocked = await isFinanceBlocked(enrollmentId);

  const [inserted] = await db
    .insert(clearanceRequests)
    .values({
      enrollmentId: enrollment.id,
      studentId: enrollment.studentId,
      schoolYearId: enrollment.schoolYearId,
      termId: enrollment.termId,
      periodId: period.id,
      status: "in_progress",
      createdByUserId: createdByUserId ?? null,
    })
    .returning();

  if (!inserted) return null;

  const officeTypes: Array<"finance" | "registrar" | "program_head" | "library" | "lab"> = [
    "finance",
    "registrar",
    "program_head",
    "library",
  ];

  const subs = await db
    .select({ code: subjects.code, title: subjects.title })
    .from(enrollmentSubjects)
    .innerJoin(subjects, eq(enrollmentSubjects.subjectId, subjects.id))
    .where(eq(enrollmentSubjects.enrollmentId, enrollmentId));
  const hasLab = subs.some((s) => isLabSubject(s.code, s.title));
  if (hasLab) officeTypes.push("lab");

  const itemValues = officeTypes.map((officeType) => ({
    clearanceRequestId: inserted.id,
    officeType,
    officeId: null,
    status:
      officeType === "finance" && financeBlocked ? ("blocked" as const) : ("pending" as const),
    remarks: officeType === "finance" && financeBlocked ? "Balance due or hold" : null,
  }));

  await db.insert(clearanceItems).values(itemValues);

  const items = await db
    .select()
    .from(clearanceItems)
    .where(eq(clearanceItems.clearanceRequestId, inserted.id))
    .orderBy(clearanceItems.officeType);

  return { request: inserted, items };
}

export type ClearanceForStudentRow = {
  requestId: string;
  enrollmentId: string;
  periodId: string;
  periodName: string;
  schoolYearName: string;
  termName: string;
  status: string;
  items: Array<{
    id: string;
    officeType: string;
    status: string;
    remarks: string | null;
  }>;
};

/** List clearance requests for a student (optionally filtered by school year / term). */
export async function listClearanceForStudent(
  studentId: string,
  schoolYearId?: string,
  termId?: string
): Promise<ClearanceForStudentRow[]> {
  const conds = [eq(clearanceRequests.studentId, studentId)];
  if (schoolYearId) conds.push(eq(clearanceRequests.schoolYearId, schoolYearId));
  if (termId) conds.push(eq(clearanceRequests.termId, termId));

  const requests = await db
    .select({
      id: clearanceRequests.id,
      enrollmentId: clearanceRequests.enrollmentId,
      periodId: clearanceRequests.periodId,
      status: clearanceRequests.status,
      schoolYearName: schoolYears.name,
      termName: terms.name,
      periodName: gradingPeriods.name,
    })
    .from(clearanceRequests)
    .innerJoin(schoolYears, eq(clearanceRequests.schoolYearId, schoolYears.id))
    .innerJoin(terms, eq(clearanceRequests.termId, terms.id))
    .innerJoin(gradingPeriods, eq(clearanceRequests.periodId, gradingPeriods.id))
    .where(and(...conds))
    .orderBy(desc(gradingPeriods.sortOrder), desc(clearanceRequests.generatedAt));

  if (requests.length === 0) return [];

  const requestIds = requests.map((r) => r.id);
  const items = await db
    .select({
      id: clearanceItems.id,
      clearanceRequestId: clearanceItems.clearanceRequestId,
      officeType: clearanceItems.officeType,
      status: clearanceItems.status,
      remarks: clearanceItems.remarks,
    })
    .from(clearanceItems)
    .where(inArray(clearanceItems.clearanceRequestId, requestIds));

  const itemsByRequest = new Map<string, typeof items>();
  for (const it of items) {
    const list = itemsByRequest.get(it.clearanceRequestId) ?? [];
    list.push(it);
    itemsByRequest.set(it.clearanceRequestId, list);
  }

  return requests.map((r) => ({
    requestId: r.id,
    enrollmentId: r.enrollmentId,
    periodId: r.periodId,
    periodName: r.periodName,
    schoolYearName: r.schoolYearName,
    termName: r.termName,
    status: r.status,
    items: (itemsByRequest.get(r.id) ?? []).map((i) => ({
      id: i.id,
      officeType: i.officeType,
      status: i.status,
      remarks: i.remarks,
    })),
  }));
}

export type ClearanceQueueFilters = {
  schoolYearId?: string;
  termId?: string;
  periodId?: string;
  programId?: string;
  officeType: "finance" | "registrar" | "program_head" | "library" | "lab";
  itemStatus?: "pending" | "blocked";
};

export type ClearanceQueueRow = {
  requestId: string;
  periodId: string;
  enrollmentId: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  schoolYearName: string;
  termId: string;
  termName: string;
  periodName: string;
  program: string | null;
  yearLevel: string | null;
  itemId: string;
  officeType: string;
  itemStatus: string;
  remarks: string | null;
  balance: string | null;
};

/** Enrollments that are financially blocked (balance or hold) but may not have a clearance request yet. Used so Finance can create PN for any student with balance. */
export async function listEnrollmentsBlockedByFinance(): Promise<ClearanceQueueRow[]> {
  const blockedEfs = await db
    .select({
      enrollmentId: enrollments.id,
      studentId: enrollments.studentId,
      schoolYearId: enrollments.schoolYearId,
      termId: enrollments.termId,
      program: enrollments.program,
      yearLevel: enrollments.yearLevel,
      balance: enrollmentFinanceStatus.balance,
      status: enrollmentFinanceStatus.status,
      firstName: students.firstName,
      middleName: students.middleName,
      lastName: students.lastName,
      studentCode: students.studentCode,
      schoolYearName: schoolYears.name,
      termName: terms.name,
    })
    .from(enrollments)
    .innerJoin(students, eq(enrollments.studentId, students.id))
    .innerJoin(schoolYears, eq(enrollments.schoolYearId, schoolYears.id))
    .innerJoin(terms, eq(enrollments.termId, terms.id))
    .leftJoin(
      enrollmentFinanceStatus,
      eq(enrollments.id, enrollmentFinanceStatus.enrollmentId)
    )
    .where(
      and(
        eq(enrollments.status, "approved"),
        or(
          and(
            inArray(enrollmentFinanceStatus.status, ["assessed", "partially_paid", "hold"]),
            sql`CAST(${enrollmentFinanceStatus.balance} AS numeric) > 0`
          ),
          sql`EXISTS (
            SELECT 1 FROM governance_flags gf
            WHERE gf.status = 'active' AND gf.flag_type = 'finance_hold'
            AND (gf.enrollment_id = ${enrollments.id} OR gf.student_id = ${enrollments.studentId})
          )`
        )
    )
  );

  const rows: ClearanceQueueRow[] = [];
  for (const r of blockedEfs) {
    if (!r.enrollmentId || !r.schoolYearId || !r.termId) continue;
    const [period] = await db
      .select({ id: gradingPeriods.id, name: gradingPeriods.name })
      .from(gradingPeriods)
      .where(
        and(
          eq(gradingPeriods.schoolYearId, r.schoolYearId),
          eq(gradingPeriods.termId, r.termId),
          eq(gradingPeriods.isActive, true)
        )
      )
      .orderBy(gradingPeriods.sortOrder)
      .limit(1);
    if (!period) continue;
    rows.push({
      requestId: "",
      periodId: period.id,
      enrollmentId: r.enrollmentId,
      studentId: r.studentId,
      studentCode: r.studentCode ?? "",
      studentName: [r.firstName, r.middleName, r.lastName].filter(Boolean).join(" "),
      schoolYearName: r.schoolYearName,
      termId: r.termId,
      termName: r.termName,
      periodName: period.name,
      program: r.program,
      yearLevel: r.yearLevel,
      itemId: "",
      officeType: "finance",
      itemStatus: "blocked",
      remarks: "Balance due or hold",
      balance: r.balance ?? "0",
    });
  }
  return rows;
}

export type PromissoryNoteTotals = {
  currentTermBalance: string;
  previousUnpaidTotal: string;
  totalOutstanding: string;
  totalPromisedDefault: string;
};

/** Totals for creating a promissory note: current balance, previous unpaid (other terms), and combined. */
export async function getTotalsForPromissoryNote(
  enrollmentId: string,
  studentId: string,
  includePreviousBalances: boolean
): Promise<PromissoryNoteTotals> {
  const all = await getApprovedEnrollmentsByStudent(studentId);
  const current = all.find((r) => r.id === enrollmentId);
  const currentTermBalance = current ? (current.balance ?? "0") : "0";
  const previousEnrollments = all.filter((r) => r.id !== enrollmentId);
  let previousUnpaidTotal = "0";
  for (const r of previousEnrollments) {
    const b = parseFloat(r.balance ?? "0");
    if (b > 0) previousUnpaidTotal = (parseFloat(previousUnpaidTotal) + b).toFixed(2);
  }
  const currentNum = parseFloat(currentTermBalance);
  const previousNum = parseFloat(previousUnpaidTotal);
  const totalOutstanding = includePreviousBalances
    ? (currentNum + previousNum).toFixed(2)
    : currentTermBalance;
  return {
    currentTermBalance,
    previousUnpaidTotal,
    totalOutstanding,
    totalPromisedDefault: totalOutstanding,
  };
}

/** List clearance queue for an office (e.g. finance blocked, registrar pending). */
export async function listClearanceQueue(
  filters: ClearanceQueueFilters
): Promise<ClearanceQueueRow[]> {
  const itemConds = [eq(clearanceItems.officeType, filters.officeType)];
  if (filters.itemStatus) itemConds.push(eq(clearanceItems.status, filters.itemStatus));

  const requestConds = [eq(clearanceRequests.status, "in_progress")];
  if (filters.schoolYearId) requestConds.push(eq(clearanceRequests.schoolYearId, filters.schoolYearId));
  if (filters.termId) requestConds.push(eq(clearanceRequests.termId, filters.termId));
  if (filters.periodId) requestConds.push(eq(clearanceRequests.periodId, filters.periodId));
  if (filters.programId) requestConds.push(eq(enrollments.programId, filters.programId));

  const q = db
    .select({
      requestId: clearanceRequests.id,
      periodId: clearanceRequests.periodId,
      enrollmentId: clearanceRequests.enrollmentId,
      studentId: clearanceRequests.studentId,
      schoolYearName: schoolYears.name,
      termId: clearanceRequests.termId,
      termName: terms.name,
      periodName: gradingPeriods.name,
      program: enrollments.program,
      yearLevel: enrollments.yearLevel,
      itemId: clearanceItems.id,
      officeType: clearanceItems.officeType,
      itemStatus: clearanceItems.status,
      remarks: clearanceItems.remarks,
      firstName: students.firstName,
      middleName: students.middleName,
      lastName: students.lastName,
      studentCode: students.studentCode,
    })
    .from(clearanceItems)
    .innerJoin(clearanceRequests, eq(clearanceItems.clearanceRequestId, clearanceRequests.id))
    .innerJoin(enrollments, eq(clearanceRequests.enrollmentId, enrollments.id))
    .innerJoin(students, eq(clearanceRequests.studentId, students.id))
    .innerJoin(schoolYears, eq(clearanceRequests.schoolYearId, schoolYears.id))
    .innerJoin(terms, eq(clearanceRequests.termId, terms.id))
    .innerJoin(gradingPeriods, eq(clearanceRequests.periodId, gradingPeriods.id))
    .where(and(...requestConds, ...itemConds))
    .orderBy(desc(clearanceRequests.generatedAt));

  const rows = await q;
  const enrollmentIds = [...new Set(rows.map((r) => r.enrollmentId))];
  let balanceMap = new Map<string, string>();
  if (filters.officeType === "finance" && enrollmentIds.length > 0) {
    const efsRows = await db
      .select({ enrollmentId: enrollmentFinanceStatus.enrollmentId, balance: enrollmentFinanceStatus.balance })
      .from(enrollmentFinanceStatus)
      .where(inArray(enrollmentFinanceStatus.enrollmentId, enrollmentIds));
    efsRows.forEach((r) => balanceMap.set(r.enrollmentId, r.balance ?? "0"));
  }

  return rows.map((r) => ({
    requestId: r.requestId,
    periodId: r.periodId,
    enrollmentId: r.enrollmentId,
    studentId: r.studentId,
    studentCode: r.studentCode ?? "",
    studentName: [r.firstName, r.middleName, r.lastName].filter(Boolean).join(" "),
    schoolYearName: r.schoolYearName,
    termId: r.termId,
    termName: r.termName,
    periodName: r.periodName,
    program: r.program,
    yearLevel: r.yearLevel,
    itemId: r.itemId,
    officeType: r.officeType,
    itemStatus: r.itemStatus,
    remarks: r.remarks,
    balance: balanceMap.get(r.enrollmentId) ?? null,
  }));
}

/** Recompute overall clearance request status from items + promissory policy. */
export async function recomputeClearanceStatus(clearanceRequestId: string): Promise<void> {
  const [setting] = await Promise.all([
    getSystemSetting("clearance_allow_promissory_override"),
  ]);
  const allowPromissory = (setting?.value as boolean) === true;

  const items = await db
    .select({
      id: clearanceItems.id,
      officeType: clearanceItems.officeType,
      status: clearanceItems.status,
      promissoryNoteId: clearanceItems.promissoryNoteId,
    })
    .from(clearanceItems)
    .where(eq(clearanceItems.clearanceRequestId, clearanceRequestId));

  let allCleared = true;
  let anyBlocked = false;
  for (const it of items) {
    if (it.status === "blocked") {
      anyBlocked = true;
      if (it.officeType === "finance" && allowPromissory && it.promissoryNoteId) {
        const [pn] = await db
          .select({ status: promissoryNotes.status })
          .from(promissoryNotes)
          .where(eq(promissoryNotes.id, it.promissoryNoteId))
          .limit(1);
        if (pn?.status === "approved") continue;
      }
      allCleared = false;
    } else if (it.status !== "cleared") {
      allCleared = false;
    }
  }

  const newStatus = allCleared ? "cleared" : anyBlocked ? "blocked" : "in_progress";
  const updates: Record<string, unknown> = { status: newStatus, updatedAt: new Date() };
  if (newStatus === "cleared") updates.clearedAt = new Date();

  await db
    .update(clearanceRequests)
    .set(updates as Record<string, unknown>)
    .where(eq(clearanceRequests.id, clearanceRequestId));
}

/** Get single clearance request with items. */
export async function getClearanceRequestById(clearanceRequestId: string) {
  const [request] = await db
    .select()
    .from(clearanceRequests)
    .where(eq(clearanceRequests.id, clearanceRequestId))
    .limit(1);
  if (!request) return null;
  const items = await db
    .select()
    .from(clearanceItems)
    .where(eq(clearanceItems.clearanceRequestId, request.id))
    .orderBy(clearanceItems.officeType);
  return { request, items };
}

/** Get single clearance item by id. */
export async function getClearanceItemById(itemId: string) {
  const [item] = await db
    .select()
    .from(clearanceItems)
    .where(eq(clearanceItems.id, itemId))
    .limit(1);
  return item ?? null;
}

/** Mark a clearance item as cleared. Call after role check. */
export async function clearClearanceItem(
  itemId: string,
  userId: string
): Promise<{ success: true } | { error: string }> {
  const item = await getClearanceItemById(itemId);
  if (!item) return { error: "Item not found" };
  await db
    .update(clearanceItems)
    .set({
      status: "cleared",
      clearedByUserId: userId,
      clearedAt: new Date(),
      remarks: null,
    })
    .where(eq(clearanceItems.id, itemId));
  await recomputeClearanceStatus(item.clearanceRequestId);
  return { success: true };
}

/** Mark a clearance item as blocked with remarks. */
export async function blockClearanceItem(
  itemId: string,
  remarks: string,
  userId?: string | null
): Promise<{ success: true } | { error: string }> {
  const item = await getClearanceItemById(itemId);
  if (!item) return { error: "Item not found" };
  await db
    .update(clearanceItems)
    .set({
      status: "blocked",
      remarks,
      clearedByUserId: null,
      clearedAt: null,
    })
    .where(eq(clearanceItems.id, itemId));
  await recomputeClearanceStatus(item.clearanceRequestId);
  return { success: true };
}

/** Mark finance clearance item as cleared using an approved promissory note. Call after role check. */
export async function signClearanceWithPromissoryNote(
  itemId: string,
  noteId: string,
  userId: string
): Promise<{ success: true } | { error: string }> {
  const item = await getClearanceItemById(itemId);
  if (!item) return { error: "Item not found" };
  if (item.officeType !== "finance") return { error: "Not a finance clearance item" };

  const data = await getClearanceRequestById(item.clearanceRequestId);
  if (!data) return { error: "Clearance request not found" };

  const [note] = await db
    .select({
      id: promissoryNotes.id,
      status: promissoryNotes.status,
      enrollmentId: promissoryNotes.enrollmentId,
      periodId: promissoryNotes.periodId,
    })
    .from(promissoryNotes)
    .where(eq(promissoryNotes.id, noteId))
    .limit(1);
  if (!note) return { error: "Promissory note not found" };
  if (note.status !== "approved") return { error: "Promissory note is not approved" };
  if (note.enrollmentId !== data.request.enrollmentId) return { error: "Promissory note does not match this clearance" };
  const [notePeriod, reqPeriod] = await Promise.all([
    db.select({ termId: gradingPeriods.termId }).from(gradingPeriods).where(eq(gradingPeriods.id, note.periodId)).limit(1),
    db.select({ termId: gradingPeriods.termId }).from(gradingPeriods).where(eq(gradingPeriods.id, data.request.periodId)).limit(1),
  ]);
  if (!notePeriod[0] || !reqPeriod[0] || notePeriod[0].termId !== reqPeriod[0].termId)
    return { error: "Promissory note does not match this clearance (different semester)" };

  await db
    .update(clearanceItems)
    .set({
      status: "cleared",
      clearedByUserId: userId,
      clearedAt: new Date(),
      promissoryNoteId: noteId,
      remarks: "Cleared with approved promissory note",
    })
    .where(eq(clearanceItems.id, itemId));
  await recomputeClearanceStatus(item.clearanceRequestId);
  return { success: true };
}

/** List all clearance requests for an enrollment (e.g. for program head detail page). */
export async function getClearanceRequestsByEnrollment(enrollmentId: string) {
  const requests = await db
    .select({
      id: clearanceRequests.id,
      periodId: clearanceRequests.periodId,
      status: clearanceRequests.status,
      periodName: gradingPeriods.name,
    })
    .from(clearanceRequests)
    .innerJoin(gradingPeriods, eq(clearanceRequests.periodId, gradingPeriods.id))
    .where(eq(clearanceRequests.enrollmentId, enrollmentId))
    .orderBy(gradingPeriods.sortOrder);

  if (requests.length === 0) return [];

  const requestIds = requests.map((r) => r.id);
  const items = await db
    .select()
    .from(clearanceItems)
    .where(inArray(clearanceItems.clearanceRequestId, requestIds));

  const itemsByRequest = new Map<string, typeof items>();
  for (const it of items) {
    const list = itemsByRequest.get(it.clearanceRequestId) ?? [];
    list.push(it);
    itemsByRequest.set(it.clearanceRequestId, list);
  }

  return requests.map((r) => ({
    requestId: r.id,
    periodId: r.periodId,
    periodName: r.periodName,
    status: r.status,
    items: itemsByRequest.get(r.id) ?? [],
  }));
}

/** Get clearance request by enrollment + period. */
export async function getClearanceRequestByEnrollmentAndPeriod(
  enrollmentId: string,
  periodId: string
) {
  const [request] = await db
    .select()
    .from(clearanceRequests)
    .where(
      and(
        eq(clearanceRequests.enrollmentId, enrollmentId),
        eq(clearanceRequests.periodId, periodId)
      )
    )
    .limit(1);
  if (!request) return null;
  const items = await db
    .select()
    .from(clearanceItems)
    .where(eq(clearanceItems.clearanceRequestId, request.id))
    .orderBy(clearanceItems.officeType);
  return { request, items };
}

/** Data for clearance form print: student, enrollment, period, subjects, items. Caller must verify student owns enrollment. */
export async function getClearancePrintData(
  enrollmentId: string,
  periodId: string
): Promise<{
  studentName: string;
  studentCode: string | null;
  program: string | null;
  yearLevel: string | null;
  sectionName: string | null;
  termName: string;
  schoolYearName: string;
  periodName: string;
  subjects: Array<{ code: string; title: string; units: string | number; teacher?: string | null }>;
  items: Array<{ officeType: string; officeLabel: string; status: string }>;
  requestId: string;
} | null> {
  const data = await getClearanceRequestByEnrollmentAndPeriod(enrollmentId, periodId);
  if (!data) return null;

  const [enrollment] = await db
    .select({
      program: enrollments.program,
      yearLevel: enrollments.yearLevel,
      sectionId: enrollments.sectionId,
      schoolYearId: enrollments.schoolYearId,
      termId: enrollments.termId,
      studentId: enrollments.studentId,
    })
    .from(enrollments)
    .where(eq(enrollments.id, enrollmentId))
    .limit(1);
  if (!enrollment) return null;

  const [student] = await db
    .select({
      firstName: students.firstName,
      middleName: students.middleName,
      lastName: students.lastName,
      studentCode: students.studentCode,
    })
    .from(students)
    .where(eq(students.id, enrollment.studentId))
    .limit(1);
  if (!student) return null;

  const [sy] = await db
    .select({ name: schoolYears.name })
    .from(schoolYears)
    .where(eq(schoolYears.id, data.request.schoolYearId))
    .limit(1);
  const [term] = await db
    .select({ name: terms.name })
    .from(terms)
    .where(eq(terms.id, data.request.termId))
    .limit(1);
  const [period] = await db
    .select({ name: gradingPeriods.name })
    .from(gradingPeriods)
    .where(eq(gradingPeriods.id, periodId))
    .limit(1);

  const sectionName = enrollment.sectionId
    ? (await db
        .select({ name: sections.name })
        .from(sections)
        .where(eq(sections.id, enrollment.sectionId))
        .limit(1))[0]?.name ?? null
    : null;

  const subs = await db
    .select({
      code: subjects.code,
      title: subjects.title,
      units: enrollmentSubjects.units,
      teacherName: classSchedules.teacherName,
      teacherFullName: userProfile.fullName,
    })
    .from(enrollmentSubjects)
    .innerJoin(subjects, eq(enrollmentSubjects.subjectId, subjects.id))
    .innerJoin(enrollments, eq(enrollmentSubjects.enrollmentId, enrollments.id))
    .leftJoin(
      classSchedules,
      and(
        eq(classSchedules.sectionId, enrollments.sectionId!),
        eq(classSchedules.subjectId, subjects.id),
        eq(classSchedules.schoolYearId, enrollments.schoolYearId),
        eq(classSchedules.termId, enrollments.termId)
      )
    )
    .leftJoin(userProfile, eq(classSchedules.teacherUserProfileId, userProfile.id))
    .where(eq(enrollmentSubjects.enrollmentId, enrollmentId));

  const OFFICE_LABELS: Record<string, string> = {
    finance: "Finance (Cashier/Accounting)",
    registrar: "Registrar",
    program_head: "Program Head / Department",
    library: "Library",
    lab: "Computer Lab",
  };

  return {
    studentName: [student.firstName, student.middleName, student.lastName].filter(Boolean).join(" "),
    studentCode: student.studentCode,
    program: enrollment.program,
    yearLevel: enrollment.yearLevel,
    sectionName,
    termName: term?.name ?? "",
    schoolYearName: sy?.name ?? "",
    periodName: period?.name ?? "",
    subjects: subs.map((s) => ({
      code: s.code,
      title: s.title,
      units: s.units,
      teacher:
        (s.teacherName?.trim() || s.teacherFullName?.trim() || null) ?? null,
    })),
    items: data.items.map((i) => ({
      officeType: i.officeType,
      officeLabel: OFFICE_LABELS[i.officeType] ?? i.officeType,
      status: i.status,
    })),
    requestId: data.request.id,
  };
}

/** Get grading periods for a school year + term. */
export async function getGradingPeriodsBySchoolYearAndTerm(
  schoolYearId: string,
  termId: string
) {
  return db
    .select()
    .from(gradingPeriods)
    .where(
      and(
        eq(gradingPeriods.schoolYearId, schoolYearId),
        eq(gradingPeriods.termId, termId),
        eq(gradingPeriods.isActive, true)
      )
    )
    .orderBy(gradingPeriods.sortOrder);
}

// ---------- Promissory notes ----------

export type InstallmentScheduleItem = {
  sequence: number;
  dueDate: string;
  amount: string;
};

export type PromissoryNoteWithDetails = {
  id: string;
  enrollmentId: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  periodId: string;
  periodName: string;
  schoolYearName: string;
  termName: string;
  program: string | null;
  yearLevel: string | null;
  amountPromised: string;
  dueDate: string;
  totalOutstandingAmount: string | null;
  totalPromisedAmount: string | null;
  installmentMonths: number | null;
  installmentSchedule: InstallmentScheduleItem[] | null;
  startDate: string | null;
  finalDueDate: string | null;
  reason: string;
  financeRemarks: string | null;
  status: string;
  createdByUserId: string | null;
  submittedAt: Date | null;
  deanByUserId: string | null;
  deanAt: Date | null;
  deanRemarks: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

/** Returns any promissory note for (enrollmentId, periodId)'s term (draft, submitted, or approved). PN is per-semester. */
export async function getExistingPromissoryNoteByEnrollmentAndPeriod(
  enrollmentId: string,
  periodId: string
): Promise<{ id: string; status: string } | null> {
  const [clearancePeriod] = await db
    .select({ termId: gradingPeriods.termId })
    .from(gradingPeriods)
    .where(eq(gradingPeriods.id, periodId))
    .limit(1);
  if (!clearancePeriod) return null;

  const [row] = await db
    .select({
      id: promissoryNotes.id,
      status: promissoryNotes.status,
    })
    .from(promissoryNotes)
    .innerJoin(gradingPeriods, eq(promissoryNotes.periodId, gradingPeriods.id))
    .where(
      and(
        eq(promissoryNotes.enrollmentId, enrollmentId),
        eq(gradingPeriods.termId, clearancePeriod.termId)
      )
    )
    .limit(1);
  if (!row) return null;
  return { id: row.id, status: row.status };
}

/** Returns the approved promissory note for (enrollmentId, periodId)'s term), if any. PN is per-semester: one approved PN covers all grading periods in that term. */
export async function getApprovedPromissoryNoteByEnrollmentAndPeriod(
  enrollmentId: string,
  periodId: string
): Promise<{ id: string; refNo: string } | null> {
  const existing = await getExistingPromissoryNoteByEnrollmentAndPeriod(enrollmentId, periodId);
  if (!existing || existing.status !== "approved") return null;
  return { id: existing.id, refNo: existing.id.slice(0, 8) };
}

/** Returns the promissory note installment schedule for an enrollment (that term's PN), if any. Used e.g. by Post Payment form to show correct number of installments and amounts. */
export async function getPromissoryNoteScheduleByEnrollmentId(
  enrollmentId: string
): Promise<InstallmentScheduleItem[] | null> {
  const [enrollment] = await db
    .select({
      schoolYearId: enrollments.schoolYearId,
      termId: enrollments.termId,
    })
    .from(enrollments)
    .where(eq(enrollments.id, enrollmentId))
    .limit(1);
  if (!enrollment) return null;
  const periods = await getGradingPeriodsBySchoolYearAndTerm(
    enrollment.schoolYearId,
    enrollment.termId
  );
  const firstPeriod = periods[0];
  if (!firstPeriod) return null;
  const existing = await getExistingPromissoryNoteByEnrollmentAndPeriod(
    enrollmentId,
    firstPeriod.id
  );
  if (!existing) return null;
  const pn = await getPromissoryNote(existing.id);
  if (!pn?.installmentSchedule || !Array.isArray(pn.installmentSchedule) || pn.installmentSchedule.length === 0)
    return null;
  return pn.installmentSchedule;
}

export async function getPromissoryNote(id: string): Promise<PromissoryNoteWithDetails | null> {
  const [row] = await db
    .select({
      id: promissoryNotes.id,
      enrollmentId: promissoryNotes.enrollmentId,
      studentId: promissoryNotes.studentId,
      periodId: promissoryNotes.periodId,
      amountPromised: promissoryNotes.amountPromised,
      dueDate: promissoryNotes.dueDate,
      totalOutstandingAmount: promissoryNotes.totalOutstandingAmount,
      totalPromisedAmount: promissoryNotes.totalPromisedAmount,
      installmentMonths: promissoryNotes.installmentMonths,
      installmentSchedule: promissoryNotes.installmentSchedule,
      startDate: promissoryNotes.startDate,
      finalDueDate: promissoryNotes.finalDueDate,
      reason: promissoryNotes.reason,
      financeRemarks: promissoryNotes.financeRemarks,
      status: promissoryNotes.status,
      createdByUserId: promissoryNotes.createdByUserId,
      submittedAt: promissoryNotes.submittedAt,
      deanByUserId: promissoryNotes.deanByUserId,
      deanAt: promissoryNotes.deanAt,
      deanRemarks: promissoryNotes.deanRemarks,
      createdAt: promissoryNotes.createdAt,
      updatedAt: promissoryNotes.updatedAt,
      periodName: gradingPeriods.name,
      schoolYearName: schoolYears.name,
      termName: terms.name,
      program: enrollments.program,
      yearLevel: enrollments.yearLevel,
      studentCode: students.studentCode,
      firstName: students.firstName,
      middleName: students.middleName,
      lastName: students.lastName,
    })
    .from(promissoryNotes)
    .innerJoin(students, eq(promissoryNotes.studentId, students.id))
    .innerJoin(enrollments, eq(promissoryNotes.enrollmentId, enrollments.id))
    .innerJoin(gradingPeriods, eq(promissoryNotes.periodId, gradingPeriods.id))
    .innerJoin(schoolYears, eq(gradingPeriods.schoolYearId, schoolYears.id))
    .innerJoin(terms, eq(gradingPeriods.termId, terms.id))
    .where(eq(promissoryNotes.id, id))
    .limit(1);

  if (!row) return null;
  const schedule = row.installmentSchedule as InstallmentScheduleItem[] | null;
  return {
    id: row.id,
    enrollmentId: row.enrollmentId,
    studentId: row.studentId,
    studentCode: row.studentCode ?? "",
    studentName: [row.firstName, row.middleName, row.lastName].filter(Boolean).join(" "),
    periodId: row.periodId,
    periodName: row.periodName,
    schoolYearName: row.schoolYearName,
    termName: row.termName,
    program: row.program,
    yearLevel: row.yearLevel,
    amountPromised: row.amountPromised ?? "0",
    dueDate: row.dueDate ?? "",
    totalOutstandingAmount: row.totalOutstandingAmount ?? null,
    totalPromisedAmount: row.totalPromisedAmount ?? null,
    installmentMonths: row.installmentMonths ?? null,
    installmentSchedule: Array.isArray(schedule) ? schedule : null,
    startDate: row.startDate ?? null,
    finalDueDate: row.finalDueDate ?? null,
    reason: row.reason,
    financeRemarks: row.financeRemarks,
    status: row.status,
    createdByUserId: row.createdByUserId,
    submittedAt: row.submittedAt,
    deanByUserId: row.deanByUserId,
    deanAt: row.deanAt,
    deanRemarks: row.deanRemarks,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** All promissory notes (approved or submitted) for a student, keyed by enrollment. One PN per enrollment per term. */
export async function getPromissoryNotesByStudentId(
  studentId: string
): Promise<PromissoryNoteWithDetails[]> {
  const rows = await db
    .select({
      id: promissoryNotes.id,
      enrollmentId: promissoryNotes.enrollmentId,
      studentId: promissoryNotes.studentId,
      periodId: promissoryNotes.periodId,
      amountPromised: promissoryNotes.amountPromised,
      dueDate: promissoryNotes.dueDate,
      totalOutstandingAmount: promissoryNotes.totalOutstandingAmount,
      totalPromisedAmount: promissoryNotes.totalPromisedAmount,
      installmentMonths: promissoryNotes.installmentMonths,
      installmentSchedule: promissoryNotes.installmentSchedule,
      startDate: promissoryNotes.startDate,
      finalDueDate: promissoryNotes.finalDueDate,
      reason: promissoryNotes.reason,
      financeRemarks: promissoryNotes.financeRemarks,
      status: promissoryNotes.status,
      createdByUserId: promissoryNotes.createdByUserId,
      submittedAt: promissoryNotes.submittedAt,
      deanByUserId: promissoryNotes.deanByUserId,
      deanAt: promissoryNotes.deanAt,
      deanRemarks: promissoryNotes.deanRemarks,
      createdAt: promissoryNotes.createdAt,
      updatedAt: promissoryNotes.updatedAt,
      periodName: gradingPeriods.name,
      schoolYearName: schoolYears.name,
      termName: terms.name,
      program: enrollments.program,
      yearLevel: enrollments.yearLevel,
      studentCode: students.studentCode,
      firstName: students.firstName,
      middleName: students.middleName,
      lastName: students.lastName,
    })
    .from(promissoryNotes)
    .innerJoin(students, eq(promissoryNotes.studentId, students.id))
    .innerJoin(enrollments, eq(promissoryNotes.enrollmentId, enrollments.id))
    .innerJoin(gradingPeriods, eq(promissoryNotes.periodId, gradingPeriods.id))
    .innerJoin(schoolYears, eq(gradingPeriods.schoolYearId, schoolYears.id))
    .innerJoin(terms, eq(gradingPeriods.termId, terms.id))
    .where(
      and(
        eq(promissoryNotes.studentId, studentId),
        inArray(promissoryNotes.status, ["approved", "submitted"])
      )
    )
    .orderBy(desc(promissoryNotes.updatedAt));

  const scheduleType = (s: unknown) =>
    Array.isArray(s) ? (s as InstallmentScheduleItem[]) : null;
  return rows.map((r) => ({
    id: r.id,
    enrollmentId: r.enrollmentId,
    studentId: r.studentId,
    studentCode: r.studentCode ?? "",
    studentName: [r.firstName, r.middleName, r.lastName].filter(Boolean).join(" "),
    periodId: r.periodId,
    periodName: r.periodName,
    schoolYearName: r.schoolYearName,
    termName: r.termName,
    program: r.program,
    yearLevel: r.yearLevel,
    amountPromised: r.amountPromised ?? "0",
    dueDate: r.dueDate ?? "",
    totalOutstandingAmount: r.totalOutstandingAmount ?? null,
    totalPromisedAmount: r.totalPromisedAmount ?? null,
    installmentMonths: r.installmentMonths ?? null,
    installmentSchedule: scheduleType(r.installmentSchedule),
    startDate: r.startDate ?? null,
    finalDueDate: r.finalDueDate ?? null,
    reason: r.reason,
    financeRemarks: r.financeRemarks,
    status: r.status,
    createdByUserId: r.createdByUserId,
    submittedAt: r.submittedAt,
    deanByUserId: r.deanByUserId,
    deanAt: r.deanAt,
    deanRemarks: r.deanRemarks,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

export async function listSubmittedPromissoryNotes(): Promise<
  Array<{
    id: string;
    enrollmentId: string;
    studentId: string;
    studentCode: string | null;
    studentName: string;
    periodName: string;
    amountPromised: string | null;
    dueDate: string;
    submittedAt: Date | null;
  }>
> {
  const rows = await db
    .select({
      id: promissoryNotes.id,
      enrollmentId: promissoryNotes.enrollmentId,
      studentId: promissoryNotes.studentId,
      studentCode: students.studentCode,
      firstName: students.firstName,
      middleName: students.middleName,
      lastName: students.lastName,
      periodName: gradingPeriods.name,
      amountPromised: promissoryNotes.amountPromised,
      totalPromisedAmount: promissoryNotes.totalPromisedAmount,
      dueDate: promissoryNotes.dueDate,
      finalDueDate: promissoryNotes.finalDueDate,
      submittedAt: promissoryNotes.submittedAt,
    })
    .from(promissoryNotes)
    .innerJoin(students, eq(promissoryNotes.studentId, students.id))
    .innerJoin(gradingPeriods, eq(promissoryNotes.periodId, gradingPeriods.id))
    .where(eq(promissoryNotes.status, "submitted"))
    .orderBy(desc(promissoryNotes.submittedAt));

  return rows.map((r) => ({
    id: r.id,
    enrollmentId: r.enrollmentId,
    studentId: r.studentId,
    studentCode: r.studentCode,
    studentName: [r.firstName, r.middleName, r.lastName].filter(Boolean).join(" "),
    periodName: r.periodName,
    amountPromised: r.amountPromised ?? r.totalPromisedAmount ?? null,
    dueDate: r.dueDate ?? r.finalDueDate ?? "",
    submittedAt: r.submittedAt,
  }));
}

/** Enrollment+term pairs where finance clearance has already been signed (cleared). Used to hide them from Blocked list. */
export async function getEnrollmentTermIdsWithClearedFinance(): Promise<Set<string>> {
  const rows = await db
    .select({
      enrollmentId: clearanceRequests.enrollmentId,
      termId: clearanceRequests.termId,
    })
    .from(clearanceItems)
    .innerJoin(clearanceRequests, eq(clearanceItems.clearanceRequestId, clearanceRequests.id))
    .where(
      and(
        eq(clearanceItems.officeType, "finance"),
        eq(clearanceItems.status, "cleared")
      )
    );
  const set = new Set<string>();
  for (const r of rows) {
    if (r.enrollmentId && r.termId) set.add(`${r.enrollmentId}:${r.termId}`);
  }
  return set;
}
