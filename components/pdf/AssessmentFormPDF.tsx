"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { SCHOOL, formatAmount } from "@/lib/school-branding";

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 9,
    fontFamily: "Helvetica",
  },
  watermark: {
    position: "absolute",
    top: "35%",
    left: "15%",
    right: "15%",
    transform: [{ operation: "rotate", value: [-35] }],
    opacity: 0.12,
    alignItems: "center",
    justifyContent: "center",
  },
  watermarkText: {
    fontSize: 52,
    fontWeight: "bold",
    color: "#b91c1c",
  },
  header: {
    textAlign: "center",
    marginBottom: 8,
  },
  schoolName: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 2,
  },
  address: {
    fontSize: 9,
    marginBottom: 4,
  },
  programTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 2,
  },
  formTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 4,
  },
  academicInfo: {
    fontSize: 9,
    marginBottom: 2,
  },
  academicInfoLine2: {
    fontSize: 9,
  },
  studentInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    fontSize: 9,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 2,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },
  subsection: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 4,
  },
  table: {
    marginTop: 2,
    borderWidth: 1,
    borderColor: "#000",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    minHeight: 12,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#fff",
    fontWeight: "bold",
  },
  tableCell: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: "#000",
    fontSize: 8,
  },
  tableCellLast: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontSize: 8,
  },
  colSubject: { width: "12%" },
  colUnits: { width: "8%", textAlign: "center" },
  colTitle: { width: "45%" },
  colPrereq: { width: "20%" },
  colLab: { width: "8%", textAlign: "center" },
  feeDesc: { width: "65%", paddingVertical: 3, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: "#000", fontSize: 8 },
  feeAmt: { width: "35%", paddingVertical: 3, paddingHorizontal: 6, textAlign: "right", fontSize: 8 },
  part2Wrapper: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
  },
  part2Left: {
    flex: 1,
  },
  part2Right: {
    width: 175,
  },
  calcLine: {
    flexDirection: "row",
    marginBottom: 4,
    fontSize: 9,
  },
  miscTitle: {
    fontSize: 9,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 4,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },
  miscTable: {
    borderWidth: 1,
    borderColor: "#000",
  },
  miscRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },
  summaryBox: {
    borderWidth: 1,
    borderColor: "#000",
    padding: 8,
  },
  summaryTitle: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    borderBottomStyle: "dashed",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    fontSize: 8,
    alignItems: "flex-start",
  },
  summaryLabel: {
    flex: 1,
    marginRight: 8,
  },
  summaryAmount: {
    flexShrink: 0,
  },
  summaryTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 2,
    borderTopColor: "#000",
    fontWeight: "bold",
    fontSize: 9,
  },
  signatures: {
    flexDirection: "row",
    marginTop: 16,
    gap: 32,
  },
  signatureBlock: {
    flex: 1,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 2,
    marginBottom: 4,
  },
  signatureName: {
    fontSize: 9,
    textAlign: "center",
  },
  signatureLabel: {
    fontSize: 7,
    textAlign: "center",
    marginTop: 2,
  },
});

export type AssessmentFormData = {
  assessment: {
    id: string;
    totalUnits: number | null;
    tuitionAmount: string | null;
    labTotal: string | null;
    miscTotal: string | null;
    otherTotal: string | null;
    discounts: string | null;
    total: string | null;
    status: string | null;
    assessedAt: string | Date | null;
    efsBalance: string | null;
  };
  student: {
    studentCode: string | null;
    fullName: string;
    firstName?: string | null;
    middleName?: string | null;
    lastName?: string | null;
  };
  program: string | null;
  programName: string | null;
  yearLevel: string | null;
  schoolYearName: string | null;
  termName: string | null;
  lines: Array<{
    id: string;
    description: string;
    category: string | null;
    amount: string | null;
    qty: number | null;
    lineTotal: string | null;
    sortOrder: number | null;
  }>;
  scheduleSubjects: Array<{
    code: string;
    title: string;
    units: string;
    prereq?: string;
    withLab?: boolean;
  }>;
};

export function AssessmentFormPDF({ data }: { data: AssessmentFormData }) {
  const { assessment, student, program, programName, yearLevel, schoolYearName, termName, lines, scheduleSubjects } =
    data;
  const tuitionAmount = parseFloat(assessment.tuitionAmount ?? "0");
  const labTotal = parseFloat(assessment.labTotal ?? "0");
  const miscTotal = parseFloat(assessment.miscTotal ?? "0");
  const otherTotal = parseFloat(assessment.otherTotal ?? "0");
  const discounts = parseFloat(assessment.discounts ?? "0");
  const total = parseFloat(assessment.total ?? "0");
  const balance = parseFloat(assessment.efsBalance ?? String(total));
  const assessedDate = assessment.assessedAt
    ? new Date(assessment.assessedAt).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;
  const totalUnits =
    assessment.totalUnits ?? scheduleSubjects.reduce((s, x) => s + parseFloat(x.units || "0"), 0);

  const tuitionRate =
    assessment.tuitionAmount && assessment.totalUnits
      ? (parseFloat(assessment.tuitionAmount) / Number(assessment.totalUnits)).toFixed(2)
      : "0";
  const labSubjectCount = scheduleSubjects.filter((s) => s.withLab).length || 1;
  const miscLines = lines.filter((l) => l.category === "misc" || l.category === "other");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {assessment.status === "posted" && (
          <View style={styles.watermark} fixed>
            <Text style={styles.watermarkText}>ENROLLED</Text>
          </View>
        )}
        <View style={styles.header}>
          <Text style={styles.schoolName}>{SCHOOL.name}</Text>
          <Text style={styles.address}>{SCHOOL.address}</Text>
          <Text style={styles.programTitle}>{(program ?? programName ?? "—").toUpperCase()}</Text>
          <Text style={styles.formTitle}>OFFICIAL COLLEGE ENROLMENT FORM</Text>
          <Text style={styles.academicInfo}>{(yearLevel ?? "—").toUpperCase()}</Text>
          <Text style={styles.academicInfoLine2}>
            {(termName ?? "—").toUpperCase()}, ACADEMIC YEAR {schoolYearName ?? "—"}
          </Text>
          {assessment.status === "posted" && assessedDate && (
            <Text style={{ fontSize: 8, marginTop: 4 }}>Posted: {assessedDate}</Text>
          )}
        </View>

        <View style={styles.studentInfo}>
          <Text>Name: {student.fullName}</Text>
          <Text>Student No.: {student.studentCode ?? "—"}</Text>
        </View>

        <View style={{ marginBottom: 8 }}>
          <Text style={styles.sectionTitle}>PART I. STUDENT REGISTRATION</Text>
          <Text style={styles.subsection}>REGULAR</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.colSubject]}>Subject</Text>
              <Text style={[styles.tableCell, styles.colUnits]}>Units</Text>
              <Text style={[styles.tableCell, styles.colTitle]}>Descriptive Title</Text>
              <Text style={[styles.tableCell, styles.colPrereq]}>Pre-Req</Text>
              <Text style={[styles.tableCellLast, styles.colLab]}>with Lab</Text>
            </View>
            {scheduleSubjects.map((s, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colSubject, { fontWeight: "bold" }]}>{s.code}</Text>
                <Text style={[styles.tableCell, styles.colUnits]}>{s.units}</Text>
                <Text style={[styles.tableCell, styles.colTitle]}>{s.title}</Text>
                <Text style={[styles.tableCell, styles.colPrereq]}>{s.prereq ?? "—"}</Text>
                <Text style={[styles.tableCellLast, styles.colLab]}>{s.withLab ? "*" : "—"}</Text>
              </View>
            ))}
            {scheduleSubjects.length === 0 && (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: "100%" }, styles.tableCellLast]}>No subjects loaded</Text>
              </View>
            )}
            <View style={[styles.tableRow, { fontWeight: "bold" }]}>
              <Text style={[styles.tableCell, styles.colSubject]}>Total Units:</Text>
              <Text style={[styles.tableCell, styles.colUnits]}>{totalUnits}</Text>
              <Text style={[styles.tableCell, styles.colTitle]}></Text>
              <Text style={[styles.tableCell, styles.colPrereq]}></Text>
              <Text style={[styles.tableCellLast, styles.colLab]}></Text>
            </View>
          </View>
        </View>

        <View>
          <Text style={styles.sectionTitle}>PART II. ASSESSMENT OF FEES</Text>
          <View style={styles.part2Wrapper}>
            <View style={styles.part2Left}>
              <View style={styles.calcLine}>
                <Text>Total No. of Units: </Text>
                <Text>{totalUnits} x {tuitionRate}</Text>
              </View>
              <View style={styles.calcLine}>
                <Text>Laboratory Fee: </Text>
                <Text>{labTotal > 0 ? labTotal.toFixed(2) : "—"} x {labSubjectCount}</Text>
              </View>
              <Text style={styles.miscTitle}>MISCELLANEOUS & OTHER FEES</Text>
              <View style={styles.miscTable}>
                {miscLines.map((l) => (
                  <View key={l.id} style={styles.miscRow}>
                    <Text style={styles.feeDesc}>{l.description}</Text>
                    <Text style={styles.feeAmt}>{formatAmount(parseFloat(l.lineTotal ?? "0"))}</Text>
                  </View>
                ))}
                <View style={[styles.miscRow, { fontWeight: "bold" }]}>
                  <Text style={[styles.feeDesc, { fontWeight: "bold" }]}>Total</Text>
                  <Text style={[styles.feeAmt, { fontWeight: "bold" }]}>{formatAmount(miscTotal + otherTotal)}</Text>
                </View>
              </View>
            </View>
            <View style={styles.part2Right}>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>SUMMARY</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Units</Text>
                  <Text style={styles.summaryAmount}>{totalUnits}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tuition Fee</Text>
                  <Text style={styles.summaryAmount}>{formatAmount(tuitionAmount)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Laboratory Fee</Text>
                  <Text style={styles.summaryAmount}>{formatAmount(labTotal)}</Text>
                </View>
                {discounts > 0 && (
                  <View style={[styles.summaryRow, { color: "#15803d" }]}>
                    <Text style={styles.summaryLabel}>Less: Full payment discount (10%)</Text>
                    <Text style={styles.summaryAmount}>-{formatAmount(discounts)}</Text>
                  </View>
                )}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Miscellaneous & Other Fees</Text>
                  <Text style={styles.summaryAmount}>{formatAmount(miscTotal + otherTotal)}</Text>
                </View>
                <View style={styles.summaryTotal}>
                  <Text style={styles.summaryLabel}>TOTAL FEES</Text>
                  <Text style={styles.summaryAmount}>{formatAmount(total)}</Text>
                </View>
                {assessment.status === "posted" && balance !== total && (
                  <>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Paid</Text>
                      <Text style={styles.summaryAmount}>-{formatAmount(total - balance)}</Text>
                    </View>
                    <View style={[styles.summaryTotal, { color: "#6A0000" }]}>
                      <Text style={styles.summaryLabel}>BALANCE DUE</Text>
                      <Text style={styles.summaryAmount}>{formatAmount(balance)}</Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.signatures}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>{student.fullName}</Text>
            <Text style={styles.signatureLabel}>STUDENT&apos;S SIGNATURE</Text>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>_______________________</Text>
            <Text style={styles.signatureLabel}>PROGRAM HEAD</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
