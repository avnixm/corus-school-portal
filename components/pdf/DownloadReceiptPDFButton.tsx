"use client";

import { useState } from "react";
import { toast } from "sonner";
import { LoadingButton } from "@/components/ui/loading-button";
import { FileDown } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { ReceiptPDF, type ReceiptData } from "./ReceiptPDF";

export function DownloadReceiptPDFButton({
  data,
  size = "default",
}: {
  data: ReceiptData;
  size?: "default" | "sm";
}) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const blob = await pdf(<ReceiptPDF data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${data.referenceNo ?? data.id.slice(0, 8)}.pdf`;
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
    <LoadingButton
      variant="outline"
      size={size}
      onClick={handleDownload}
      disabled={loading}
      pending={loading}
      className="gap-1.5"
    >
      {!loading && <FileDown className="h-4 w-4" />}
      Download PDF
    </LoadingButton>
  );
}
