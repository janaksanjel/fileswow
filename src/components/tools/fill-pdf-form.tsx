"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

interface FormField {
  name: string;
  type: string;
  value: string;
}

export default function FillPdfFormTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const buffer = await f.arrayBuffer();
      const doc = await PDFDocument.load(buffer);
      const form = doc.getForm();
      const formFields = form.getFields();
      const detected: FormField[] = formFields.map(field => ({
        name: field.getName(),
        type: field.constructor.name.replace("PDF", "").replace("Field", ""),
        value: "",
      }));
      setFields(detected.length > 0 ? detected : [{ name: "Text Field 1", type: "Text", value: "" }]);
    } catch {
      setFields([{ name: "Text Field 1", type: "Text", value: "" }]);
    }
  }, []);

  const updateField = (idx: number, value: string) => {
    setFields(prev => prev.map((f, i) => i === idx ? { ...f, value } : f));
  };

  const handleFill = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const buffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(buffer);

      // Try to fill form fields using the form API
      try {
        const form = doc.getForm();
        const formFields = form.getFields();

        for (let i = 0; i < formFields.length && i < fields.length; i++) {
          const field = formFields[i];
          const value = fields[i].value;
          if (!value) continue;

          try {
            if (field.constructor.name.includes("Text")) {
              (field as any).setText(value);
            } else if (field.constructor.name.includes("CheckBox")) {
              if (value.toLowerCase() === "true" || value === "1" || value.toLowerCase() === "yes") {
                (field as any).check();
              }
            }
          } catch {
            // Skip fields that can't be filled
          }
        }
        form.flatten();
      } catch {
        // If form API fails, draw text on the page directly
        const font = await doc.embedFont(StandardFonts.Helvetica);
        for (const page of doc.getPages()) {
          let y = page.getSize().height - 100;
          for (const field of fields) {
            if (field.value) {
              page.drawText(`${field.name}: ${field.value}`, {
                x: 50, y, size: 11, font, color: rgb(0.1, 0.1, 0.1),
              });
              y -= 20;
            }
          }
        }
      }

      const bytes = await doc.save();
      setResult(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }));
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to fill form");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF form" description="Fill out PDF form fields" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p><p className="text-xs text-text-tertiary">{fields.length} field(s) detected</p></div>
            <button onClick={() => { setFile(null); setResult(null); setFields([]); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          <div className="space-y-3">
            {fields.map((field, i) => (
              <div key={i}>
                <label className="block text-xs text-text-secondary mb-1">{field.name} <span className="text-text-tertiary">({field.type})</span></label>
                <input type="text" value={field.value} onChange={(e) => updateField(i, e.target.value)} placeholder={`Enter value for ${field.name}`} className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm focus:border-accent focus:outline-none" />
              </div>
            ))}
          </div>

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Form filled!</p>
              <DownloadButton blob={result} filename={`filled-${file!.name}`} />
            </div>
          )}

          {!result && (
            <button onClick={handleFill} disabled={processing} className="btn-primary w-full py-3">
              {processing ? "Filling form..." : "Fill & Download"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
