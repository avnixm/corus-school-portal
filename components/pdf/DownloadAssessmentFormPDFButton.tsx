  "use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { AssessmentFormPDF, type AssessmentFormData } from "./AssessmentFormPDF";

export function DownloadAssessmentFormPDFButton({
  data,
  size = "default",
}: {
  data: AssessmentFormData;
  size?: "default" | "sm";
}) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const blob = await pdf(<AssessmentFormPDF data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const lastName = data.student.lastName?.trim() ?? "";
      const firstName = data.student.firstName?.trim() ?? "";
      const middleName = data.student.middleName?.trim() ?? "";
      const namePart = [lastName, firstName, middleName].filter(Boolean).join("_");
      const studentId = data.student.studentCode ?? data.assessment.id;
      const schoolYear = data.schoolYearName ?? "";
      const safeName = namePart.replace(/[^a-zA-Z0-9_\s-]/g, "").replace(/\s+/g, "_") || "assessment";
      const safeYear = schoolYear.replace(/[^a-zA-Z0-9-]/g, "_") || "";
      const filename = [safeName, studentId, safeYear].filter(Boolean).join("_") + ".pdf";
      a.download = filename || `assessment-${data.assessment.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate PDF.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size={size}
      onClick={handleDownload}
      disabled={loading}
      className="gap-1.5"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      Download PDF
    </Button>
  );
}
