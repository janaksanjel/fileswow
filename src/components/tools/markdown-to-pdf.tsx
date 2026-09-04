"use client";

import { useState } from "react";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

const SAMPLE_MD = `# Hello World\n\nThis is a **bold** and *italic* text example.\n\n## Features\n\n- Item 1\n- Item 2\n- Item 3\n\n### Code Example\n\n\`\`\`javascript\nconsole.log("Hello from FilesWow.com");\n\`\`\`\n\n> This is a blockquote\n\n| Name | Type |\n|------|------|\n| PDF | Document |\n| Word | Document |`;

export default function MarkdownToPdfTool({ onProcessing, onError }: ToolUIProps) {
  const [md, setMd] = useState(SAMPLE_MD);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const mdToHtml = (text: string): string => {
    return text
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^# (.+)$/gm, "<h1>$1</h1>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
      .replace(/\n\n/g, "<br/><br/>")
      .replace(/\|(.+)\|/g, (match) => {
        const cells = match.split("|").filter(Boolean).map((c) => c.trim());
        if (cells.every((c) => /^-+$/.test(c))) return "";
        return "<tr>" + cells.map((c) => `<td style="padding:4px 8px;border:1px solid #ddd">${c}</td>`).join("") + "</tr>";
      });
  };

  const handleConvert = async () => {
    if (!md.trim()) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const htmlContent = `<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;padding:40px;max-width:800px;margin:0 auto;}h1,h2,h3{color:#1a1a1a;}code{background:#f0f0f0;padding:2px 4px;border-radius:3px;}blockquote{border-left:3px solid #22c55e;padding-left:12px;color:#555;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}th{background:#f5f5f5;}</style></head><body>${mdToHtml(md)}</body></html>`;

      const { default: jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.cssText = "position:absolute;left:-9999px;top:0;width:800px;";
      document.body.appendChild(tempDiv);

      const canvas = await html2canvas(tempDiv.querySelector("body")!, { scale: 2 });
      document.body.removeChild(tempDiv);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      setResult(pdf.output("blob"));
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
        <label className="block text-sm text-text-secondary mb-2">Markdown</label>
        <textarea
          value={md}
          onChange={(e) => setMd(e.target.value)}
          rows={12}
          className="w-full px-4 py-3 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm font-mono focus:border-accent focus:outline-none transition-colors resize-y"
        />
      </div>

      {/* Live preview */}
      <div>
        <label className="block text-sm text-text-secondary mb-2">Preview</label>
        <div
          className="p-6 rounded-lg bg-white text-black min-h-[200px] border border-border-base prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: mdToHtml(md) }}
        />
      </div>

      {result && (
        <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
          <p className="text-sm text-success mb-3">✓ Conversion complete!</p>
          <DownloadButton blob={result} filename="markdown.pdf" />
        </div>
      )}

      {!result && (
        <button onClick={handleConvert} disabled={processing || !md.trim()} className="btn-primary w-full py-3">
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
