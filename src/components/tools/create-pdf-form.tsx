"use client";

import { useState } from "react";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

interface FieldDef {
  name: string;
  type: "text" | "checkbox" | "dropdown";
  label: string;
}

export default function CreatePdfFormTool({ onProcessing, onError }: ToolUIProps) {
  const [fields, setFields] = useState<FieldDef[]>([{ name: "field1", type: "text", label: "Name" }]);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const addField = () => {
    setFields(prev => [...prev, { name: `field${prev.length + 1}`, type: "text", label: `Field ${prev.length + 1}` }]);
  };

  const updateField = (idx: number, key: keyof FieldDef, value: string) => {
    setFields(prev => prev.map((f, i) => i === idx ? { ...f, [key]: value } : f));
  };

  const removeField = (idx: number) => {
    setFields(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCreate = async () => {
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const page = doc.addPage([595.28, 841.89]);
      const form = doc.getForm();

      let y = 750;
      page.drawText("PDF Form", { x: 50, y, size: 24, font, color: rgb(0.1, 0.1, 0.1) });
      y -= 50;

      for (const field of fields) {
        page.drawText(field.label, { x: 50, y, size: 12, font, color: rgb(0.3, 0.3, 0.3) });
        y -= 5;

        if (field.type === "text") {
          const tf = form.createTextField(field.name);
          tf.addToPage(page, { x: 50, y: y - 20, width: 400, height: 20 });
          y -= 35;
        } else if (field.type === "checkbox") {
          const cb = form.createCheckBox(field.name);
          cb.addToPage(page, { x: 50, y: y - 18, width: 14, height: 14 });
          y -= 30;
        }
      }

      const bytes = await doc.save();
      setResult(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }));
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to create form");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {fields.map((field, i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-bg-elevated border border-border-base">
            <input type="text" value={field.label} onChange={(e) => updateField(i, "label", e.target.value)} className="flex-1 px-2 py-1 rounded bg-transparent text-sm text-text-primary border border-border-base focus:border-accent focus:outline-none" placeholder="Label" />
            <select value={field.type} onChange={(e) => updateField(i, "type", e.target.value)} className="px-2 py-1 rounded bg-bg-elevated text-sm text-text-primary border border-border-base focus:border-accent focus:outline-none">
              <option value="text">Text</option>
              <option value="checkbox">Checkbox</option>
            </select>
            <button onClick={() => removeField(i)} className="text-text-tertiary hover:text-danger text-xs">✕</button>
          </div>
        ))}
      </div>

      <button onClick={addField} className="text-sm text-accent hover:text-accent-end transition-colors">+ Add field</button>

      {result && (
        <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
          <p className="text-sm text-success mb-3">✓ Form created!</p>
          <DownloadButton blob={result} filename="form.pdf" />
        </div>
      )}

      {!result && (
        <button onClick={handleCreate} disabled={processing || fields.length === 0} className="btn-primary w-full py-3">
          {processing ? "Creating..." : `Create Form with ${fields.length} field(s)`}
        </button>
      )}
    </div>
  );
}
