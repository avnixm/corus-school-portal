"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { SCHOOL, formatAmount } from "@/lib/school-branding";

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  gcash: "GCash",
  bank: "Bank Transfer",
  card: "Card",
  other: "Other",
};

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
const TEENS = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function hundredsToWords(n: number): string {
  if (n === 0) return "";
  let s = "";
  if (n >= 100) {
    s += ONES[Math.floor(n / 100)] + " Hundred ";
    n %= 100;
  }
  if (n >= 20) {
    s += TENS[Math.floor(n / 10)] + " ";
    if (n % 10 > 0) s += ONES[n % 10] + " ";
  } else if (n >= 10) {
    s += TEENS[n - 10] + " ";
  } else if (n > 0) {
    s += ONES[n] + " ";
  }
  return s.trim();
}

function amountToWords(n: number): string {
  const intPart = Math.floor(n);
  const decPart = Math.round((n - intPart) * 100);
  if (intPart === 0) return `Zero & ${decPart.toString().padStart(2, "0")}/100`;

  let result = "";
  let rest = intPart;
  if (rest >= 1_000_000) {
    result += hundredsToWords(Math.floor(rest / 1_000_000)) + " Million ";
    rest %= 1_000_000;
  }
  if (rest >= 1_000) {
    result += hundredsToWords(Math.floor(rest / 1_000)) + " Thousand ";
    rest %= 1_000;
  }
  result += hundredsToWords(rest);
  return result.trim() + ` & ${decPart.toString().padStart(2, "0")}/100`;
}

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 9,
    fontFamily: "Helvetica",
  },
  header: {
    textAlign: "center",
    marginBottom: 8,
  },
  schoolName: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 1,
  },
  address: {
    fontSize: 8,
    marginBottom: 1,
  },
  tel: {
    fontSize: 8,
    marginBottom: 1,
  },
  tin: {
    fontSize: 7,
    marginBottom: 6,
  },
  receiptTitle: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  receivedFrom: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  amountWords: {
    flexDirection: "row",
    marginBottom: 6,
    fontSize: 8,
  },
  amountLabel: {
    marginRight: 6,
  },
  particularsHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 2,
    marginBottom: 4,
  },
  particularsCol: {
    width: "60%",
  },
  amountCol: {
    width: "40%",
    textAlign: "right",
  },
  particularsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  formOfPayment: {
    marginTop: 8,
    marginBottom: 8,
  },
  formLabel: {
    marginBottom: 2,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 2,
    borderTopColor: "#000",
    paddingTop: 4,
    marginTop: 4,
    fontWeight: "bold",
  },
  receivedBy: {
    marginTop: 12,
  },
  receivedByLabel: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 1,
    marginBottom: 2,
  },
  footer: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 7,
    color: "#737373",
  },
});

export type ReceiptData = {
  id: string;
  amount: string | null;
  method: string | null;
  referenceNo: string | null;
  remarks: string | null;
  receivedAt: string | Date | null;
  fullName: string;
  studentCode: string | null;
  schoolYearName: string | null;
  termName: string | null;
  program: string | null;
  yearLevel: string | null;
  balanceAfter: string | null;
  /** When full payment with 10% discount - original amount before discount */
  originalAmount?: string;
  /** When full payment with 10% discount - the discount amount */
  discountAmount?: string;
};

export function ReceiptPDF({ data }: { data: ReceiptData }) {
  const amount = parseFloat(data.amount ?? "0");
  const receivedDate = data.receivedAt
    ? new Date(data.receivedAt).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : "—";
  const receiptNo = data.referenceNo ?? data.id.slice(0, 8).toUpperCase();
  const amountInWords = amountToWords(amount);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.schoolName}>{SCHOOL.name}</Text>
          <Text style={styles.address}>{SCHOOL.address}</Text>
          <Text style={styles.tel}>Tel No. {SCHOOL.tel}</Text>
          <Text style={styles.tin}>{SCHOOL.tin}</Text>
        </View>

        <Text style={styles.receiptTitle}>OFFICIAL RECEIPT</Text>

        <View style={styles.dateRow}>
          <Text>Date: {receivedDate}</Text>
          <Text>Receipt No: {receiptNo}</Text>
        </View>

        <View style={styles.receivedFrom}>
          <Text>Received From: {data.fullName}</Text>
        </View>

        <View style={styles.amountWords}>
          <Text style={styles.amountLabel}>Amount:</Text>
          <Text>{amountInWords}</Text>
        </View>

        <View style={styles.particularsHeader}>
          <Text style={styles.particularsCol}>PARTICULARS:</Text>
          <Text style={styles.amountCol}>AMOUNT</Text>
        </View>

        {data.discountAmount != null && data.originalAmount != null ? (
          <>
            <View style={styles.particularsRow}>
              <Text style={styles.particularsCol}>{data.remarks ?? "Payment"}</Text>
              <Text style={styles.amountCol}>{formatAmount(parseFloat(data.originalAmount))}</Text>
            </View>
            <View style={[styles.particularsRow, { color: "#15803d" }]}>
              <Text style={styles.particularsCol}>Less: Full payment discount (10%)</Text>
              <Text style={styles.amountCol}>-{formatAmount(parseFloat(data.discountAmount))}</Text>
            </View>
          </>
        ) : (
          <View style={styles.particularsRow}>
            <Text style={styles.particularsCol}>{data.remarks ?? "Payment"}</Text>
            <Text style={styles.amountCol}>{formatAmount(amount)}</Text>
          </View>
        )}

        <View style={styles.formOfPayment}>
          <Text style={styles.formLabel}>Form of Payment:</Text>
          <Text>{METHOD_LABELS[data.method ?? "other"] ?? data.method ?? "—"}</Text>
        </View>

        <View style={styles.totalRow}>
          <Text>TOTAL AMOUNT:</Text>
          <Text>{formatAmount(amount)}</Text>
        </View>

        {data.balanceAfter != null && (
          <View style={{ marginTop: 6 }}>
            <Text style={{ fontSize: 8 }}>Current Balance: {formatAmount(parseFloat(data.balanceAfter))}</Text>
          </View>
        )}

        <View style={styles.receivedBy}>
          <Text style={styles.receivedByLabel}>Received by:</Text>
          <Text style={{ fontSize: 9, color: "#737373" }}>_______________________</Text>
        </View>

        <View style={styles.footer}>
          <Text>This is a computer-generated receipt. Thank you for your payment.</Text>
        </View>
      </Page>
    </Document>
  );
}
