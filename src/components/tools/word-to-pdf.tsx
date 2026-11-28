"use client";

import { useState, useCallback } from "react";
import { StepFlow, type StepOutput } from "@/components/step-flow";
import type { ToolUIProps } from "@/components/tool-registry";
import { prepareScriptFonts, waitForFonts, waitForImages } from "@/lib/script-fonts";

const MAX_CHUNK_DOM_HEIGHT_PX = 2600;

/**
 * Find a clean whitespace row near `idealBottomY` so tall sections never slice mid-line.
 */
function findCleanBreakY(
  ctx: CanvasRenderingContext2D,
  width: number,
  currentY: number,
  idealBottomY: number
): number {
  const searchWindow = Math.min(90, Math.round((idealBottomY - currentY) * 0.25));
  const searchTop = Math.max(currentY + 20, Math.round(idealBottomY - searchWindow));
  const checkH = Math.round(idealBottomY) - searchTop;
  if (checkH <= 0) return idealBottomY;

  const data = ctx.getImageData(0, searchTop, width, checkH).data;
  for (let r = checkH - 1; r >= 0; r--) {
    let blank = true;
    for (let c = 0; c < width; c += 4) {
      const idx = (r * width + c) * 4;
      if (data[idx + 3] > 20 && (data[idx] < 245 || data[idx + 1] < 245 || data[idx + 2] < 245)) {
        blank = false;
        break;
      }
    }
    if (blank) return searchTop + r;
  }
  return idealBottomY;
}

/**
 * Convert CSS px (96dpi) to PDF points (72dpi).
 */
function pxToPt(px: number): number {
  return (px * 72) / 96;
}

export default function WordToPdfTool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [outputs, setOutputs] = useState<StepOutput[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleFilesChanged = useCallback((next: File[]) => {
    setFiles(next);
    setOutputs([]);
  }, []);

  const convertSingleDocxToPdf = async (file: File): Promise<Blob> => {
    const docxPreview = await import("docx-preview");
    const { jsPDF } = await import("jspdf");
    const html2canvas = (await import("html2canvas")).default;

    setProgressMsg(`Reading ${file.name}…`);
    const arrayBuffer = await file.arrayBuffer();

    const host = document.createElement("div");
    host.className = "docx-w2p-host";
    host.style.cssText = [
      "position:fixed",
      "left:-12000px",
      "top:0",
      "background:#ffffff",
      "color:#000000",
      "z-index:-1",
      "pointer-events:none",
    ].join(";");

    const styleHost = document.createElement("div");
    const overrideStyle = document.createElement("style");
    overrideStyle.textContent = `
      .docx-w2p-host section.docx {
        box-shadow: none !important;
        margin: 0 !important;
        background: #ffffff !important;
      }
    `;

    document.body.appendChild(styleHost);
    document.body.appendChild(overrideStyle);
    document.body.appendChild(host);

    try {
      await docxPreview.renderAsync(arrayBuffer, host, styleHost, {
        className: "docx",
        inWrapper: false,
        ignoreWidth: false,
        ignoreHeight: false,
        ignoreFonts: false,
        breakPages: true,
        ignoreLastRenderedPageBreak: false,
        renderHeaders: true,
        renderFooters: true,
        renderFootnotes: true,
        renderEndnotes: true,
        useBase64URL: true,
        experimental: false,
        debug: false,
      });

      const allText = host.textContent || "";
      await prepareScriptFonts(allText);
      await Promise.all([waitForFonts(), waitForImages(host)]);

      const sections = Array.from(host.querySelectorAll("section.docx")) as HTMLElement[];
      if (sections.length === 0) {
        throw new Error("Could not find any pages in this Word document.");
      }

      // Use higher DPI scale for normal docs, balanced scale for 30+ page docs to stay fast & crisp
      const renderScale = sections.length > 30 ? 2 : 2.5;
      const jpegQuality = sections.length > 30 ? 0.95 : 0.97;

      const firstRect = sections[0].getBoundingClientRect();
      const firstW = Math.max(200, pxToPt(firstRect.width || sections[0].offsetWidth || 794));
      const firstH = Math.max(200, pxToPt(parseFloat(getComputedStyle(sections[0]).minHeight) || firstRect.height || 1123));

      const pdf = new jsPDF({
        unit: "pt",
        format: [firstW, firstH],
        orientation: firstW > firstH ? "landscape" : "portrait",
        compress: true,
      });

      let isFirstPdfPage = true;

      for (let sIdx = 0; sIdx < sections.length; sIdx++) {
        const section = sections[sIdx];
        setProgressMsg(`Rendering page ${sIdx + 1} of ${sections.length}…`);

        const computed = getComputedStyle(section);
        const secWpx = Math.max(200, section.offsetWidth || 794);
        const targetPageHpx = Math.max(
          200,
          parseFloat(computed.minHeight) || parseFloat(computed.height) || 1123
        );
        const actualHpx = Math.max(targetPageHpx, section.scrollHeight);

        const pageWpt = pxToPt(secWpx);
        const pageHpt = pxToPt(targetPageHpx);

        // Case 1: Section fits on a single Word page (normal case when breakPages matches)
        if (actualHpx <= targetPageHpx * 1.03 && actualHpx <= MAX_CHUNK_DOM_HEIGHT_PX) {
          const canvas = await html2canvas(section, {
            scale: renderScale,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            width: secWpx,
            height: targetPageHpx,
            windowWidth: secWpx,
            windowHeight: targetPageHpx,
          });

          if (!isFirstPdfPage) {
            pdf.addPage([pageWpt, pageHpt], pageWpt > pageHpt ? "landscape" : "portrait");
          }
          isFirstPdfPage = false;

          const imgData = canvas.toDataURL("image/jpeg", jpegQuality);
          pdf.addImage(imgData, "JPEG", 0, 0, pageWpt, pageHpt);

          canvas.width = 0;
          canvas.height = 0;
        } else {
          // Case 2: Section has no internal lastRenderedPageBreak and spans multiple pages.
          // Chunk top-level children so we never exceed browser canvas height limits.
          const children = Array.from(section.children) as HTMLElement[];
          const chunks: HTMLElement[][] = [];
          let currentChunk: HTMLElement[] = [];
          let currentH = 0;

          for (const child of children) {
            const h = Math.max(16, child.offsetHeight || 20);
            if (currentChunk.length > 0 && currentH + h > MAX_CHUNK_DOM_HEIGHT_PX) {
              chunks.push(currentChunk);
              currentChunk = [];
              currentH = 0;
            }
            currentChunk.push(child);
            currentH += h;
          }
          if (currentChunk.length > 0) chunks.push(currentChunk);

          const padTop = parseFloat(computed.paddingTop) || 48;
          const padBottom = parseFloat(computed.paddingBottom) || 48;
          const padLeft = parseFloat(computed.paddingLeft) || 48;
          const padRight = parseFloat(computed.paddingRight) || 48;
          const contentHpx = Math.max(200, targetPageHpx - padTop - padBottom);
          const contentHpt = pxToPt(contentHpx);
          const topPt = pxToPt(padTop);

          for (const chunkNodes of chunks) {
            const chunkSection = document.createElement("section");
            chunkSection.className = section.className;
            chunkSection.style.cssText = section.style.cssText;
            chunkSection.style.minHeight = "0px";
            chunkSection.style.height = "auto";
            chunkSection.style.paddingTop = "0px";
            chunkSection.style.paddingBottom = "0px";
            chunkSection.style.paddingLeft = `${padLeft}px`;
            chunkSection.style.paddingRight = `${padRight}px`;
            chunkSection.style.width = `${secWpx}px`;
            chunkSection.style.background = "#ffffff";

            for (const node of chunkNodes) {
              chunkSection.appendChild(node.cloneNode(true));
            }
            host.appendChild(chunkSection);

            let canvas: HTMLCanvasElement;
            try {
              canvas = await html2canvas(chunkSection, {
                scale: renderScale,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
                width: secWpx,
                windowWidth: secWpx,
              });
            } finally {
              host.removeChild(chunkSection);
            }

            const cW = canvas.width;
            const cH = canvas.height;
            const pxPerPt = cW / pageWpt;
            const pageCanvasH = contentHpt * pxPerPt;
            const ctx2d = canvas.getContext("2d");

            let y = 0;
            while (y < cH) {
              let sliceH = Math.min(pageCanvasH, cH - y);
              if (y + sliceH < cH && ctx2d) {
                const cleanBottom = findCleanBreakY(ctx2d, cW, y, y + sliceH);
                if (cleanBottom > y + 40) sliceH = cleanBottom - y;
              }

              if (!isFirstPdfPage) {
                pdf.addPage([pageWpt, pageHpt], pageWpt > pageHpt ? "landscape" : "portrait");
              }
              isFirstPdfPage = false;

              const sliceCanvas = document.createElement("canvas");
              sliceCanvas.width = cW;
              sliceCanvas.height = Math.max(1, Math.round(sliceH));
              const sCtx = sliceCanvas.getContext("2d");
              if (sCtx) {
                sCtx.fillStyle = "#ffffff";
                sCtx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
                sCtx.drawImage(canvas, 0, y, cW, sliceH, 0, 0, sliceCanvas.width, sliceCanvas.height);
              }

              const imgData = sliceCanvas.toDataURL("image/jpeg", jpegQuality);
              pdf.addImage(imgData, "JPEG", 0, topPt, pageWpt, sliceH / pxPerPt);

              sliceCanvas.width = 0;
              sliceCanvas.height = 0;
              y += sliceH;
            }

            canvas.width = 0;
            canvas.height = 0;
          }
        }

        // Yield to UI thread so progress updates & animations stay smooth
        await new Promise((r) => setTimeout(r, 0));
      }

      return pdf.output("blob");
    } finally {
      if (host.parentNode) document.body.removeChild(host);
      if (styleHost.parentNode) document.body.removeChild(styleHost);
      if (overrideStyle.parentNode) document.body.removeChild(overrideStyle);
    }
  };

  const handleConvert = useCallback(async () => {
    if (!files.length) return;
    setProcessing(true);
    setError(null);
    setProgressMsg("");
    onProcessing?.(true);
    try {
      const nextOutputs: StepOutput[] = [];
      for (const f of files) {
        const blob = await convertSingleDocxToPdf(f);
        nextOutputs.push({
          name: f.name.replace(/\.docx?$/i, ".pdf"),
          blob,
        });
      }
      setOutputs(nextOutputs);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to convert Word to PDF";
      setError(msg);
      onError?.(msg);
    } finally {
      setProcessing(false);
      setProgressMsg("");
      onProcessing?.(false);
    }
  }, [files, onError, onProcessing]);

  return (
    <StepFlow
      accept=".docx"
      multiple
      maxFiles={20}
      hint="DOCX files — preserves exact Word formatting, tables, images & page layout"
      actionLabel={files.length > 1 ? `Convert ${files.length} Files to PDF` : "Convert to PDF"}
      processingLabel={progressMsg || "Converting to PDF…"}
      outputs={outputs}
      canRun={files.length > 0}
      processing={processing}
      fileCount={files.length}
      onFilesChanged={handleFilesChanged}
      onResetFilesOnly={() => setOutputs([])}
      onRun={handleConvert}
      onReset={() => {
        setFiles([]);
        setOutputs([]);
        setError(null);
      }}
      error={error}
      onDismissError={() => setError(null)}
      renderOperation={() => (
        <div className="p-3.5 rounded-xl bg-bg-elevated/70 border border-border-base text-xs text-text-secondary space-y-1">
          <p className="font-semibold text-text-primary">
            Exact Word-Layout High-Quality PDF Engine
          </p>
          <p>
            Preserves original Word fonts, colors, tables, margins, headers/footers, images, and
            exact page-by-page layout at high resolution (supports 60+ page documents).
          </p>
        </div>
      )}
    />
  );
}
