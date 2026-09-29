"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

/**
 * Word Page Setup — change page size, orientation, and margins by editing
 * the section properties (w:sectPr) of the DOCX package directly (JSZip).
 *
 * This is real XML surgery: styles, fonts, images, tables, headers, and
 * footers all stay exactly as authored. Text reflows naturally to the new
 * page geometry — identical to changing page setup inside Word itself.
 */

type Preset = "A4" | "Letter" | "Legal" | "A5" | "A3";
type Orientation = "portrait" | "landscape";

/** Page sizes in twentieths of a point (twips), portrait orientation. */
const PAGE_SIZES: Record<Preset, { w: number; h: number }> = {
  A4: { w: 11906, h: 16838 },       // 210 × 297 mm
  Letter: { w: 12240, h: 15840 },   // 8.5 × 11 in
  Legal: { w: 12240, h: 20160 },    // 8.5 × 14 in
  A5: { w: 8391, h: 11906 },        // 148 × 210 mm
  A3: { w: 16838, h: 23811 },       // 297 × 420 mm
};

/** Default margins in twips: 2.54 cm (1 in) top/bottom, 3.18 cm sides. */
const DEFAULT_MARGINS = { top: 1440, bottom: 1440, left: 1800, right: 1800 };

const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

const TWIPS_PER_CM = 567;
const TWIPS_PER_INCH = 1440;

async function applyPageSetup(
  file: File,
  preset: Preset | "custom",
  customWcm: number,
  customHcm: number,
  orientation: Orientation,
  marginsCm: { top: number; bottom: number; left: number; right: number }
): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());

  const docXmlPath = "word/document.xml";
  const docXml = await zip.file(docXmlPath)!.async("string");

  // Resolve target page geometry (twips) — orientation swaps w/h
  let pageW: number;
  let pageH: number;
  if (preset === "custom") {
    pageW = Math.round(customWcm * TWIPS_PER_CM);
    pageH = Math.round(customHcm * TWIPS_PER_CM);
  } else {
    pageW = PAGE_SIZES[preset].w;
    pageH = PAGE_SIZES[preset].h;
  }
  if (orientation === "landscape") {
    [pageW, pageH] = [pageH, pageW];
  }

  const marginT = Math.round(marginsCm.top * TWIPS_PER_CM);
  const marginB = Math.round(marginsCm.bottom * TWIPS_PER_CM);
  const marginL = Math.round(marginsCm.left * TWIPS_PER_CM);
  const marginR = Math.round(marginsCm.right * TWIPS_PER_CM);

  const parser = new DOMParser();
  const doc = parser.parseFromString(docXml, "application/xml");
  const serializer = new XMLSerializer();
  const sections = Array.from(doc.getElementsByTagName("w:sectPr"));

  if (sections.length === 0) {
    throw new Error("Could not find document sections — is this a valid .docx?");
  }

  for (const sectPr of sections) {
    // ── Page size ──
    let pgSz = sectPr.getElementsByTagName("w:pgSz")[0];
    if (!pgSz) {
      pgSz = doc.createElement("w:pgSz");
      // pgSz must come after header/footer refs and pgNumType; insert before
      // pgMar if present, else append
      const pgMar = sectPr.getElementsByTagName("w:pgMar")[0];
      if (pgMar) sectPr.insertBefore(pgSz, pgMar);
      else sectPr.appendChild(pgSz);
    }
    pgSz.setAttribute("w:w", String(pageW));
    pgSz.setAttribute("w:h", String(pageH));
    // Word uses w:orient="landscape" as a hint; the real orientation is the
    // swapped w/h. Set it to match so Word's UI shows the right value.
    if (orientation === "landscape") {
      pgSz.setAttribute("w:orient", "landscape");
    } else {
      pgSz.removeAttribute("w:orient");
    }

    // ── Margins ──
    let pgMar = sectPr.getElementsByTagName("w:pgMar")[0];
    if (!pgMar) {
      pgMar = doc.createElement("w:pgMar");
      sectPr.appendChild(pgMar);
    }
    pgMar.setAttribute("w:top", String(marginT));
    pgMar.setAttribute("w:bottom", String(marginB));
    pgMar.setAttribute("w:left", String(marginL));
    pgMar.setAttribute("w:right", String(marginR));
    // Keep gutter/header/footer distances sane if present
    if (!pgMar.getAttribute("w:gutter")) pgMar.setAttribute("w:gutter", "0");
    if (!pgMar.getAttribute("w:header")) pgMar.setAttribute("w:header", "720");
    if (!pgMar.getAttribute("w:footer")) pgMar.setAttribute("w:footer", "720");
  }

  zip.file(docXmlPath, serializer.serializeToString(doc));

  return zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    compression: "DEFLATE",
  });
}

/* ── UI ──────────────────────────────────────────────────────────── */

const PRESETS: Array<[Preset, string]> = [
  ["A4", "A4"],
  ["Letter", "Letter"],
  ["Legal", "Legal"],
  ["A5", "A5"],
  ["A3", "A3"],
];

export default function WordPageSetupTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [sizeMode, setSizeMode] = useState<Preset | "custom">("A4");
  const [customW, setCustomW] = useState(21.0);
  const [customH, setCustomH] = useState(29.7);
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [margins, setMargins] = useState({
    top: 2.54,
    bottom: 2.54,
    left: 3.18,
    right: 3.18,
  });
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback((files: File[]) => {
    setFile(files[0] || null);
    setResult(null);
  }, []);

  const setMargin = (key: keyof typeof margins, value: number) => {
    setMargins((m) => ({ ...m, [key]: Math.min(10, Math.max(0, value || 0)) }));
    setResult(null);
  };

  const handleApply = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const blob = await applyPageSetup(file, sizeMode, customW, customH, orientation, margins);
      setResult(blob);
    } catch (err) {
      onError?.(
        err instanceof Error
          ? err.message
          : "Could not apply page setup — make sure this is a .docx file (re-save from Word if it's an old .doc)."
      );
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  const marginInputs: Array<[keyof typeof margins, string]> = [
    ["top", "Top (cm)"],
    ["bottom", "Bottom (cm)"],
    ["left", "Left (cm)"],
    ["right", "Right (cm)"],
  ];

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone
          accept=".docx"
          onFilesSelected={handleFile}
          label="Drop a Word document"
          description="Change page size, orientation & margins — formatting preserved"
        />
      ) : (
        <div className="space-y-4">
          {/* File card */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end shrink-0">DOCX</span>
            <div className="flex-1 min-w-0"><p className="text-sm text-text-primary truncate">{file.name}</p></div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger shrink-0">Remove</button>
          </div>

          {/* Page size */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Page size</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {PRESETS.map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => { setSizeMode(val); setResult(null); }}
                  className={`py-2 rounded-lg text-[12.5px] font-medium transition-all ${sizeMode === val ? "bg-accent-start text-white" : "bg-bg-elevated text-text-secondary border border-border-base hover:border-border-strong"}`}
                >
                  {label}
                </button>
              ))}
              <button
                onClick={() => { setSizeMode("custom"); setResult(null); }}
                className={`py-2 rounded-lg text-[12.5px] font-medium transition-all ${sizeMode === "custom" ? "bg-accent-start text-white" : "bg-bg-elevated text-text-secondary border border-border-base hover:border-border-strong"}`}
              >
                Custom
              </button>
            </div>
          </div>

          {/* Custom size inputs */}
          {sizeMode === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12.5px] font-medium text-text-secondary mb-1.5" htmlFor="ps-w">Width (cm)</label>
                <input id="ps-w" type="number" min={2} max={60} step={0.1} value={customW}
                  onChange={(e) => { setCustomW(parseFloat(e.target.value) || 21); setResult(null); }}
                  className="input" />
              </div>
              <div>
                <label className="block text-[12.5px] font-medium text-text-secondary mb-1.5" htmlFor="ps-h">Height (cm)</label>
                <input id="ps-h" type="number" min={2} max={60} step={0.1} value={customH}
                  onChange={(e) => { setCustomH(parseFloat(e.target.value) || 29.7); setResult(null); }}
                  className="input" />
              </div>
            </div>
          )}

          {/* Orientation */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Orientation</label>
            <div className="grid grid-cols-2 gap-2">
              {(["portrait", "landscape"] as Orientation[]).map((val) => (
                <button
                  key={val}
                  onClick={() => { setOrientation(val); setResult(null); }}
                  className={`py-2 rounded-lg text-[12.5px] font-medium capitalize transition-all ${orientation === val ? "bg-accent-start text-white" : "bg-bg-elevated text-text-secondary border border-border-base hover:border-border-strong"}`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Margins */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Margins</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {marginInputs.map(([key, label]) => (
                <div key={key}>
                  <label className="block text-[12.5px] font-medium text-text-secondary mb-1.5" htmlFor={`ps-m-${key}`}>{label}</label>
                  <input
                    id={`ps-m-${key}`}
                    type="number"
                    min={0}
                    max={10}
                    step={0.1}
                    value={margins[key]}
                    onChange={(e) => setMargin(key, parseFloat(e.target.value))}
                    className="input"
                  />
                </div>
              ))}
            </div>
          </div>

          {result ? (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm font-medium text-success mb-3">✓ Page setup applied — formatting preserved</p>
              <DownloadButton blob={result} filename={`setup-${file.name}`} />
            </div>
          ) : (
            <button onClick={handleApply} disabled={processing} className="btn-primary w-full py-3">
              {processing ? "Applying page setup…" : "Apply Page Setup"}
            </button>
          )}

          <p className="text-[11.5px] text-text-tertiary leading-relaxed">
            Page geometry is edited inside your document&apos;s sections — styles, fonts,
            images, and headers stay untouched. Text reflows exactly as it would in Word.
            Your file never leaves your device.
          </p>
        </div>
      )}
    </div>
  );
}
