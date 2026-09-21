"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

interface CleanReport {
  headers: number;   // WordArt / VML watermark shapes removed
  images: number;    // header/footer pictures removed
  behindBody: number; // behind-text drawings removed from the body
  files: string[];   // touched parts
}

/** All descendant elements with the given localName, prefix-agnostic. */
function byLocal(root: Element | Document, localName: string): Element[] {
  const out: Element[] = [];
  const all = root.getElementsByTagName("*");
  for (let i = 0; i < all.length; i++) {
    if (all[i].localName === localName) out.push(all[i]);
  }
  return out;
}

function isWatermarkShape(shape: Element): boolean {
  const type = shape.getAttribute("type") || "";
  const id = (shape.getAttribute("id") || "") + " " + (shape.getAttribute("o:spid") || "");
  const hasTextPath = byLocal(shape, "textpath").length > 0;
  return (
    type.includes("_x0000_t136") ||           // WordArt watermark shape type
    hasTextPath ||                             // watermark text rendered along a path
    /watermark|powerplus/i.test(id)            // Word's default watermark object ids
  );
}

export default function WatermarkRemoverWordTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [removeHeaderImages, setRemoveHeaderImages] = useState(false);
  const [removeBehindText, setRemoveBehindText] = useState(false);
  const [result, setResult] = useState<Blob | null>(null);
  const [report, setReport] = useState<CleanReport | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback((files: File[]) => {
    setFile(files[0] || null);
    setResult(null);
    setReport(null);
  }, []);

  const clean = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      const rep: CleanReport = { headers: 0, images: 0, behindBody: 0, files: [] };

      const cleanedParts = new Map<string, string>();

      const cleanPart = async (path: string, isBody: boolean) => {
        const entry = zip.file(path);
        if (!entry) return;
        const xmlText = await entry.async("string");
        const doc = new DOMParser().parseFromString(xmlText, "application/xml");
        if (doc.getElementsByTagName("parsererror").length) return; // not valid XML — leave untouched
        let changed = false;

        // 1. VML WordArt watermark shapes (classic DRAFT / CONFIDENTIAL stamps)
        for (const shape of byLocal(doc, "shape")) {
          if (!isWatermarkShape(shape)) continue;
          // remove the enclosing w:pict (or the shape itself) from its run
          let host: Element | null = shape;
          while (host && host.localName !== "pict") host = host.parentElement;
          (host || shape).parentElement?.removeChild(host || shape);
          rep.headers++;
          changed = true;
        }

        // 2. Optional: any picture in headers/footers (image watermarks live here)
        if (removeHeaderImages && !isBody) {
          for (const tag of ["pict", "drawing"]) {
            for (const el of byLocal(doc, tag)) {
              if (tag === "drawing") {
                // only remove pictures (pic:pic), keep text boxes etc.
                if (byLocal(el, "blip").length === 0) continue;
              }
              el.parentElement?.removeChild(el);
              rep.images++;
              changed = true;
            }
          }
        }

        // 3. Optional: behind-text anchored images in the document body
        if (removeBehindText && isBody) {
          for (const anchor of byLocal(doc, "anchor")) {
            if (anchor.getAttribute("behindDoc") !== "1") continue;
            if (byLocal(anchor, "blip").length === 0) continue; // only image anchors
            const drawing = anchor.parentElement;
            (drawing || anchor).parentElement?.removeChild(drawing || anchor);
            rep.behindBody++;
            changed = true;
          }
        }

        if (changed) {
          cleanedParts.set(path, new XMLSerializer().serializeToString(doc));
          rep.files.push(path.split("/").pop() || path);
        }
      };

      // headers & footers first (where Word keeps watermarks), then the body
      const paths = Object.keys(zip.files).filter((p) => /\.xml$/.test(p));
      for (const p of paths) {
        if (/word\/(header|footer)\d*\.xml$/.test(p)) await cleanPart(p, false);
      }
      for (const p of paths) {
        if (/word\/document\.xml$/.test(p)) await cleanPart(p, true);
      }

      if (!rep.files.length) {
        onError?.(
          "No classic watermark shapes found in this document. " +
          "If the watermark is a floating image, enable the options below and try again. " +
          "Old .doc files (pre-2007) are not supported — save as .docx first."
        );
        return;
      }

      // write cleaned parts back
      for (const [path, xml] of cleanedParts) zip.file(path, xml);
      const blob = await zip.generateAsync({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        compression: "DEFLATE",
      });
      setResult(blob);
      setReport({ ...rep });
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to clean the document — is it a valid .docx?");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  const fmt = (b: number) => (b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(1) + " MB");

  if (!file) {
    return (
      <div className="space-y-6">
        <DropZone accept=".docx" onFilesSelected={handleFile} label="Drop a Word document to remove its watermark" description="Works on the real watermark objects inside the DOCX — formatting stays intact" />
        <div className="p-4 rounded-xl bg-bg-elevated border border-border-base text-xs text-text-tertiary space-y-2">
          <p className="font-semibold text-text-secondary text-sm">✨ What gets removed</p>
          <p>• WordArt watermark shapes (DRAFT, CONFIDENTIAL, custom text) — the real objects Word inserts.</p>
          <p>• Optionally: images placed in headers/footers and behind-text pictures in the body.</p>
          <p>• Everything else — text, tables, styles, page setup — is untouched.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
        <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">DOCX</span>
        <div className="flex-1">
          <p className="text-sm text-text-primary truncate">{file.name}</p>
          <p className="text-xs text-text-tertiary">{fmt(file.size)}</p>
        </div>
        <button onClick={() => { setFile(null); setResult(null); setReport(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
      </div>

      <div className="space-y-2.5 p-4 rounded-xl bg-bg-elevated border border-border-base">
        <p className="text-sm font-medium text-text-secondary">Also remove (optional)</p>
        <label className="flex items-start gap-2.5 text-sm text-text-secondary cursor-pointer">
          <input type="checkbox" checked={removeHeaderImages} onChange={(e) => setRemoveHeaderImages(e.target.checked)} className="accent-accent mt-0.5" />
          <span>All pictures in headers &amp; footers <span className="text-text-tertiary">(image/letterhead watermarks)</span></span>
        </label>
        <label className="flex items-start gap-2.5 text-sm text-text-secondary cursor-pointer">
          <input type="checkbox" checked={removeBehindText} onChange={(e) => setRemoveBehindText(e.target.checked)} className="accent-accent mt-0.5" />
          <span>Behind-text images in the document body <span className="text-text-tertiary">(full-page logo watermarks)</span></span>
        </label>
      </div>

      {!result && (
        <button onClick={clean} disabled={processing} className="btn-primary w-full py-3">
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin-slow" />
              Cleaning document…
            </span>
          ) : "Remove Watermark"}
        </button>
      )}

      {result && report && (
        <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10">
          <p className="text-sm text-success mb-1">✓ Watermark removed!</p>
          <ul className="text-xs text-text-secondary space-y-1 mb-3">
            {report.headers > 0 && <li>• {report.headers} watermark shape{report.headers > 1 ? "s" : ""} deleted</li>}
            {report.images > 0 && <li>• {report.images} header/footer picture{report.images > 1 ? "s" : ""} deleted</li>}
            {report.behindBody > 0 && <li>• {report.behindBody} behind-text image{report.behindBody > 1 ? "s" : ""} deleted</li>}
            <li className="text-text-tertiary">Cleaned: {report.files.join(", ")}</li>
          </ul>
          <DownloadButton blob={result} filename={"no-watermark-" + file.name.replace(/\.docx$/i, "") + ".docx"} />
          <p className="text-xs text-text-tertiary mt-2">Open in Word to verify — run again with more options enabled if anything remains.</p>
        </div>
      )}
    </div>
  );
}
