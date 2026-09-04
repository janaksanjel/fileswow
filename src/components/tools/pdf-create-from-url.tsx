"use client";

import { useState } from "react";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function PdfCreateFromUrlTool({ onProcessing, onError }: ToolUIProps) {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleConvert = async () => {
    if (!url.trim()) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;

      // Fetch the URL content
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch URL");
      const html = await response.text();

      // Create a temporary iframe to render
      const iframe = document.createElement("iframe");
      iframe.style.cssText = "position:absolute;left:-9999px;top:0;width:1024px;height:768px;border:none;";
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) throw new Error("Cannot create preview");
      doc.open();
      doc.write(html);
      doc.close();

      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 2000));

      const canvas = await html2canvas(iframe, { scale: 1.5, useCORS: true, width: 1024 });
      document.body.removeChild(iframe);

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Handle multi-page if content is tall
      const pageHeight = pdf.internal.pageSize.getHeight();
      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = -(pdfHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      const blob = pdf.output("blob");
      setResult(blob);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to capture URL. CORS may prevent loading external pages.");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-text-secondary mb-2">Enter a URL</label>
        <input
          type="url"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setResult(null); }}
          placeholder="https://example.com"
          className="w-full px-4 py-2.5 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm focus:border-accent focus:outline-none transition-colors"
        />
      </div>

      <div className="p-3 rounded-lg bg-bg-elevated border border-border-base">
        <p className="text-xs text-text-secondary">
          ℹ Captures the webpage content and converts it to PDF. Note: Some websites may block external access (CORS). Works best with public pages.
        </p>
      </div>

      {result && (
        <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
          <p className="text-sm text-success mb-3">✓ PDF created from URL!</p>
          <DownloadButton blob={result} filename="webpage.pdf" />
        </div>
      )}

      {!result && (
        <button onClick={handleConvert} disabled={processing || !url.trim()} className="btn-primary w-full py-3">
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin-slow" />
              Capturing...
            </span>
          ) : "Capture & Convert to PDF"}
        </button>
      )}
    </div>
  );
}
