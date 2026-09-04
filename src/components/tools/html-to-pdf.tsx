"use client";

import { useState, useRef } from "react";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function HtmlToPdfTool({ onProcessing, onError }: ToolUIProps) {
  const [html, setHtml] = useState("<h1>Hello World</h1>\n<p>This is a paragraph.</p>\n<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>");
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleConvert = async () => {
    if (!html.trim()) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;

      // Create a temporary div to render HTML
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;
      tempDiv.style.cssText = "position:absolute;left:-9999px;top:0;width:800px;padding:40px;font-family:Arial,sans-serif;font-size:14px;color:#000;background:#fff;";
      document.body.appendChild(tempDiv);

      const canvas = await html2canvas(tempDiv, { scale: 2, useCORS: true });
      document.body.removeChild(tempDiv);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      const blob = pdf.output("blob");
      setResult(blob);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to convert");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-text-secondary mb-2">HTML code</label>
        <textarea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          rows={10}
          className="w-full px-4 py-3 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm font-mono focus:border-accent focus:outline-none transition-colors resize-y"
          placeholder="Enter your HTML code..."
        />
      </div>

      {/* Live preview */}
      <div>
        <label className="block text-sm text-text-secondary mb-2">Preview</label>
        <div
          ref={previewRef}
          className="p-6 rounded-lg bg-white text-black min-h-[200px] border border-border-base"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      {result && (
        <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
          <p className="text-sm text-success mb-3">✓ Conversion complete!</p>
          <DownloadButton blob={result} filename="converted.pdf" />
        </div>
      )}

      {!result && (
        <button onClick={handleConvert} disabled={processing || !html.trim()} className="btn-primary w-full py-3">
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin-slow" />
              Converting...
            </span>
          ) : "Convert to PDF"}
        </button>
      )}
    </div>
  );
}
