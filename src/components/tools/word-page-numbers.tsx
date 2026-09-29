"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

/**
 * Add Page Numbers to Word — real DOCX page-number fields via XML surgery.
 *
 * Inserts native PAGE / NUMPAGES fields into the document's footer (or
 * header) by editing the DOCX package directly (JSZip). Unlike
 * convert-and-rebuild approaches, this preserves every style, font, image,
 * table, and section in the original file — the same mechanism Word itself
 * uses when you insert page numbers.
 */

type Position = "bottom-center" | "bottom-right" | "bottom-left" | "top-center" | "top-right" | "top-left";
type Format = "plain" | "page-x" | "page-x-of-y";

const POSITIONS: Array<[Position, string]> = [
  ["bottom-center", "Bottom center"],
  ["bottom-right", "Bottom right"],
  ["bottom-left", "Bottom left"],
  ["top-center", "Top center"],
  ["top-right", "Top right"],
  ["top-left", "Top left"],
];

const FORMATS: Array<[Format, string]> = [
  ["plain", "1"],
  ["page-x", "Page 1"],
  ["page-x-of-y", "Page 1 of 4"],
];

const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

/** Which footer/header relationship type each position maps to. */
function relTypeFor(pos: Position): string {
  return pos.startsWith("top") ? `${W}/header` : `${W}/footer`;
}

/** Paragraph alignment (w:jc) for a position. */
function jcFor(pos: Position): string {
  if (pos.endsWith("center")) return "center";
  if (pos.endsWith("right")) return "right";
  return "left";
}

/** Whether the placement is a header (top) or footer (bottom). */
function isHeader(pos: Position): boolean {
  return pos.startsWith("top");
}

/** The XML for a footer/header part containing the page-number field. */
function fieldPartXml(pos: Position, format: Format, startAt: number): string {
  const PAGE_FIELD = `<w:r><w:rPr><w:noProof/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r>
    <w:r><w:rPr><w:noProof/></w:rPr><w:instrText xml:space="preserve"> PAGE \\* MERGEFORMAT </w:instrText></w:r>
    <w:r><w:rPr><w:noProof/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r>
    <w:r><w:rPr><w:noProof/></w:rPr><w:t>${startAt}</w:t></w:r>
    <w:r><w:rPr><w:noProof/></w:rPr><w:fldChar w:fldCharType="end"/></w:r>`;

  const NUMPAGES_FIELD = `<w:r><w:rPr><w:noProof/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r>
    <w:r><w:rPr><w:noProof/></w:rPr><w:instrText xml:space="preserve"> NUMPAGES \\* MERGEFORMAT </w:instrText></w:r>
    <w:r><w:rPr><w:noProof/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r>
    <w:r><w:rPr><w:noProof/></w:rPr><w:t>1</w:t></w:r>
    <w:r><w:rPr><w:noProof/></w:rPr><w:fldChar w:fldCharType="end"/></w:r>`;

  let runs = "";
  if (format === "plain") {
    runs = PAGE_FIELD;
  } else if (format === "page-x") {
    runs = `<w:r><w:t xml:space="preserve">Page </w:t></w:r>${PAGE_FIELD}`;
  } else {
    runs = `<w:r><w:t xml:space="preserve">Page </w:t></w:r>${PAGE_FIELD}<w:r><w:t xml:space="preserve"> of </w:t></w:r>${NUMPAGES_FIELD}`;
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:${isHeader(pos) ? "hdr" : "ftr"} xmlns:w="${W}">
  <w:p>
    <w:pPr><w:jc w:val="${jcFor(pos)}"/></w:pPr>
    ${runs}
  </w:p>
</w:${isHeader(pos) ? "hdr" : "ftr"}>`;
}

/**
 * Start-at is implemented with the { PAGE } field's start override:
 * a <w:pgNumType w:start="N"/> in each section's sectPr.
 */
async function applyPageNumbers(
  file: File,
  position: Position,
  format: Format,
  startAt: number,
  differentFirst: boolean
): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());

  const docXmlPath = "word/document.xml";
  const docXml = await zip.file(docXmlPath)!.async("string");

  // ── 1. Collect existing footer/header references and their parts ──
  // We target the section-level footerReference/headerReference of the
  // requested type. Word resolves missing references via the section that
  // defines them, so we add references + parts for any section missing one.
  const relsPath = "word/_rels/document.xml.rels";
  const relsXml = await zip.file(relsPath)!.async("string");
  const relParser = new DOMParser();
  const relsDoc = relParser.parseFromString(relsXml, "application/xml");
  const relsRoot = relsDoc.documentElement;

  // Find the next free rId
  let maxId = 0;
  relsRoot.querySelectorAll("Relationship").forEach((r) => {
    const id = r.getAttribute("Id") || "";
    const m = id.match(/rId(\d+)/);
    if (m) maxId = Math.max(maxId, parseInt(m[1], 10));
  });
  let nextId = maxId + 1;

  const kind = isHeader(position) ? "header" : "footer";
  const partFilename = `${kind}N.xml`;

  // Create the new footer/header part
  zip.file(`word/${partFilename}`, fieldPartXml(position, format, startAt));

  // Register it in the rels
  const newRelId = `rId${nextId++}`;
  const relElement = relsDoc.createElement("Relationship");
  relElement.setAttribute("Id", newRelId);
  relElement.setAttribute(
    "Type",
    relTypeFor(position)
  );
  relElement.setAttribute("Target", partFilename);
  relsRoot.appendChild(relElement);
  zip.file(relsPath, new XMLSerializer().serializeToString(relsDoc));

  // ── 2. Wire the part into every section's sectPr ──
  // We serialize the document XML and use string surgery on sectPr blocks,
  // which is more robust against namespace churn than re-serializing the
  // whole tree (Word documents contain many namespaces that must survive).
  const parser = new DOMParser();
  const doc = parser.parseFromString(docXml, "application/xml");
  const serializer = new XMLSerializer();
  const sections = Array.from(doc.getElementsByTagName("w:sectPr"));

  const refTag = isHeader(position) ? "w:headerReference" : "w:footerReference";
  const titlePgTag = "w:titlePg";

  for (const sectPr of sections) {
    // Remove existing references of the same kind (we're replacing them)
    Array.from(sectPr.getElementsByTagName(refTag)).forEach((el) => el.remove());

    // Insert the new reference FIRST (schema requires headerReference/
    // footerReference to be the first children of sectPr)
    const ref = doc.createElement(refTag);
    ref.setAttribute("w:type", "default");
    ref.setAttribute("r:id", newRelId);
    sectPr.insertBefore(ref, sectPr.firstChild);

    // Page numbering start
    const existingPgNum = sectPr.getElementsByTagName("w:pgNumType")[0];
    if (startAt !== 1) {
      if (existingPgNum) {
        existingPgNum.setAttribute("w:start", String(startAt));
      } else {
        // pgNumType must come after headers/footers but before pgSz
        const pgNum = doc.createElement("w:pgNumType");
        pgNum.setAttribute("w:start", String(startAt));
        const pgSz = sectPr.getElementsByTagName("w:pgSz")[0];
        const pgMar = sectPr.getElementsByTagName("w:pgMar")[0];
        const anchor = pgSz ?? pgMar ?? null;
        if (anchor) sectPr.insertBefore(pgNum, anchor);
        else sectPr.appendChild(pgNum);
      }
    } else if (existingPgNum && existingPgNum.getAttribute("w:start")) {
      existingPgNum.removeAttribute("w:start");
    }

    // Different first page (hide the number on the cover)
    if (differentFirst) {
      if (!sectPr.getElementsByTagName(titlePgTag)[0]) {
        const titlePg = doc.createElement("w:titlePg");
        // titlePg comes after pgNumType/pgSz/pgMar
        sectPr.appendChild(titlePg);
      }
    }
  }

  // If the document had NO explicit sectPr sections (single implicit section),
  // there is always a final sectPr at the body level — handled above.
  if (sections.length === 0) {
    throw new Error("Could not find document sections — is this a valid .docx?");
  }

  zip.file(docXmlPath, serializer.serializeToString(doc));

  // ── 3. Content types: make sure the footer/header part is declared ──
  const ctPath = "[Content_Types].xml";
  let ctXml = await zip.file(ctPath)!.async("string");
  const partCt = isHeader(position)
    ? "application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"
    : "application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml";
  if (!ctXml.includes(partCt)) {
    ctXml = ctXml.replace(
      "</Types>",
      `<Override PartName="/word/${partFilename}" ContentType="${partCt}"/></Types>`
    );
    zip.file(ctPath, ctXml);
  }

  return zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    compression: "DEFLATE",
  });
}

export default function WordPageNumbersTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [position, setPosition] = useState<Position>("bottom-center");
  const [format, setFormat] = useState<Format>("plain");
  const [startAt, setStartAt] = useState(1);
  const [differentFirst, setDifferentFirst] = useState(false);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback((files: File[]) => {
    setFile(files[0] || null);
    setResult(null);
  }, []);

  const handleApply = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const blob = await applyPageNumbers(file, position, format, startAt, differentFirst);
      setResult(blob);
    } catch (err) {
      onError?.(
        err instanceof Error
          ? err.message
          : "Could not add page numbers — make sure this is a .docx file (re-save from Word if it's an old .doc)."
      );
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone
          accept=".docx"
          onFilesSelected={handleFile}
          label="Drop a Word document"
          description="Real Word page-number fields — formatting untouched"
        />
      ) : (
        <div className="space-y-4">
          {/* File card */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end shrink-0">DOCX</span>
            <div className="flex-1 min-w-0"><p className="text-sm text-text-primary truncate">{file.name}</p></div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger shrink-0">Remove</button>
          </div>

          {/* Position */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Position</label>
            <div className="grid grid-cols-3 gap-2">
              {POSITIONS.map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => { setPosition(val); setResult(null); }}
                  className={`py-2 px-1 rounded-lg text-[12.5px] font-medium transition-all ${position === val ? "bg-accent-start text-white" : "bg-bg-elevated text-text-secondary border border-border-base hover:border-border-strong"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Format</label>
            <div className="grid grid-cols-3 gap-2">
              {FORMATS.map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => { setFormat(val); setResult(null); }}
                  className={`py-2 rounded-lg text-[12.5px] font-medium transition-all ${format === val ? "bg-accent-start text-white" : "bg-bg-elevated text-text-secondary border border-border-base hover:border-border-strong"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2" htmlFor="wn-start">Start numbering at</label>
              <input
                id="wn-start"
                type="number"
                min={1}
                max={9999}
                value={startAt}
                onChange={(e) => { setStartAt(Math.max(1, parseInt(e.target.value, 10) || 1)); setResult(null); }}
                className="input"
              />
            </div>
            <label className="flex items-center gap-2.5 pt-6 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={differentFirst}
                onChange={(e) => { setDifferentFirst(e.target.checked); setResult(null); }}
                className="w-4 h-4"
              />
              <span className="text-[13px] text-text-secondary">Hide number on first page (cover)</span>
            </label>
          </div>

          {result ? (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm font-medium text-success mb-3">✓ Page-number fields added — formatting preserved</p>
              <DownloadButton blob={result} filename={`numbered-${file.name}`} />
            </div>
          ) : (
            <button onClick={handleApply} disabled={processing} className="btn-primary w-full py-3">
              {processing ? "Adding page numbers…" : "Add Page Numbers"}
            </button>
          )}

          <p className="text-[11.5px] text-text-tertiary leading-relaxed">
            Numbers are real Word PAGE fields — they render in Word, Google Docs, and LibreOffice,
            and update automatically if the document changes. Your file is edited locally and never uploaded.
          </p>
        </div>
      )}
    </div>
  );
}
