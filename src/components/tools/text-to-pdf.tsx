"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";
import type {
  PdfPageSize,
  PdfOrientation,
  PdfMargin,
  PdfLineSpacing,
  PageNumberPosition,
  RichTextPdfResult,
} from "@/lib/richtext-pdf";

// ─── Clipboard sanitizer ─────────────────────────────────────────────
// Keeps the formatting a user pasted (fonts, sizes, colors, alignment,
// lists, links, images) while stripping scripts, trackers, and junk
// attributes that Word/web clipboards carry.

const PASTE_DROP_TAGS = new Set([
  "SCRIPT", "STYLE", "META", "LINK", "TITLE", "NOSCRIPT", "IFRAME",
  "OBJECT", "EMBED", "BASE", "FORM", "INPUT", "BUTTON", "SELECT",
  "TEXTAREA", "VIDEO", "AUDIO", "SOURCE", "XML", "O:P",
]);

const PASTE_KEEP_TAGS = new Set([
  "P", "DIV", "SPAN", "FONT", "B", "STRONG", "I", "EM", "U", "S", "STRIKE",
  "DEL", "INS", "H1", "H2", "H3", "H4", "H5", "H6", "UL", "OL", "LI",
  "BLOCKQUOTE", "PRE", "CODE", "A", "BR", "HR", "TABLE", "THEAD", "TBODY",
  "TFOOT", "TR", "TD", "TH", "IMG", "SUP", "SUB", "FIGURE", "FIGCAPTION",
  "ADDRESS", "SECTION", "ARTICLE",
]);

const PASTE_KEEP_STYLE = [
  /^color$/i, /^background-color$/i, /^font-family$/i, /^font-size$/i,
  /^font-weight$/i, /^font-style$/i, /^text-decoration/i, /^text-align$/i,
  /^margin(-|$)/i, /^line-height$/i,
];

function sanitizeHtml(html: string): string {
  const parsed = new DOMParser().parseFromString(html, "text/html");

  const clean = (node: Node): Node | null => {
    if (node.nodeType === Node.COMMENT_NODE) return null;
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent ?? "");
    if (node.nodeType !== Node.ELEMENT_NODE) return null;
    const el = node as Element;
    const tag = el.nodeName;
    if (PASTE_DROP_TAGS.has(tag)) return null;

    if (!PASTE_KEEP_TAGS.has(tag)) {
      // Unknown wrapper: keep the content, drop the element.
      const frag = document.createDocumentFragment();
      for (const child of Array.from(el.childNodes)) {
        const cleaned = clean(child);
        if (cleaned) frag.appendChild(cleaned);
      }
      return frag;
    }

    const out = document.createElement(tag);
    if (tag === "A") {
      const href = (el.getAttribute("href") ?? "").trim();
      if (/^(https?:|mailto:)/i.test(href)) {
        out.setAttribute("href", href);
        out.setAttribute("target", "_blank");
        out.setAttribute("rel", "noopener noreferrer");
      } else {
        return cleanChildrenAs(el, out) ? out : null;
      }
    }
    if (tag === "IMG") {
      const src = (el.getAttribute("src") ?? "").trim();
      if (!/^(data:image\/|https?:|blob:)/i.test(src)) return null;
      out.setAttribute("src", src);
    }
    const style = el.getAttribute("style") ?? "";
    const kept = style
      .split(";")
      .map((d) => d.trim())
      .filter((d) => d !== "" && PASTE_KEEP_STYLE.some((re) => re.test(d.split(":")[0].trim())));
    if (kept.length > 0) out.setAttribute("style", kept.join("; "));

    for (const child of Array.from(el.childNodes)) {
      const cleaned = clean(child);
      if (cleaned) out.appendChild(cleaned);
    }
    return out;
  };

  // Helper used for the <a> fallback so children survive a stripped href.
  function cleanChildrenAs(el: Element, out: HTMLElement): boolean {
    for (const child of Array.from(el.childNodes)) {
      const cleaned = clean(child);
      if (cleaned) out.appendChild(cleaned);
    }
    return true;
  }

  const container = document.createElement("div");
  for (const child of Array.from(parsed.body.childNodes)) {
    const cleaned = clean(child);
    if (cleaned) container.appendChild(cleaned);
  }
  return container.innerHTML;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function textToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

// ─── Component ───────────────────────────────────────────────────────

const FONT_FAMILIES = [
  { label: "Font", value: "" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Garamond", value: "Garamond, 'Times New Roman', serif" },
  { label: "Courier New", value: "'Courier New', Courier, monospace" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
];

const FONT_SIZES = ["10px", "12px", "14px", "16px", "18px", "20px", "24px", "32px"];

const BLOCK_FORMATS = [
  { label: "Paragraph", value: "p" },
  { label: "Heading 1", value: "h1" },
  { label: "Heading 2", value: "h2" },
  { label: "Heading 3", value: "h3" },
  { label: "Quote", value: "blockquote" },
  { label: "Code block", value: "pre" },
];

const TB_BASE =
  "h-8 min-w-8 px-1.5 inline-flex items-center justify-center rounded-lg text-[13px] font-semibold border border-transparent text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors select-none";
const TB_ACTIVE = "bg-accent-subtle text-accent border-accent/30";

const TB_SVG_PROPS = {
  width: 15,
  height: 15,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export default function TextToPdfTool({ onProcessing, onError }: ToolUIProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Clicking toolbar controls (especially <select>s) steals focus from the
  // editor; the last caret range is saved so commands still apply to it.
  const savedRange = useRef<Range | null>(null);

  const [keepFormatting, setKeepFormatting] = useState(true);
  const [isEmpty, setIsEmpty] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [active, setActive] = useState<Record<string, boolean>>({});
  const [blockFormat, setBlockFormat] = useState("p");

  const [pageSize, setPageSize] = useState<PdfPageSize>("a4");
  const [orientation, setOrientation] = useState<PdfOrientation>("portrait");
  const [margin, setMargin] = useState<PdfMargin>("normal");
  const [lineSpacing, setLineSpacing] = useState<PdfLineSpacing>(1.15);
  const [pageNumbers, setPageNumbers] = useState(false);
  const [pageNumberPosition, setPageNumberPosition] = useState<PageNumberPosition>("bottom-center");

  const [result, setResult] = useState<RichTextPdfResult | null>(null);
  const [filename, setFilename] = useState("document.pdf");
  const [processing, setProcessing] = useState(false);

  const syncStats = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const text = editor.innerText ?? "";
    setCharCount(text.length);
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
    setIsEmpty(text.trim() === "");
    editor.dataset.empty = text.trim() === "" ? "true" : "false";
  }, []);

  // Track the active formatting under the caret for toolbar state.
  useEffect(() => {
    const handler = () => {
      const sel = window.getSelection();
      const editor = editorRef.current;
      if (!sel || !editor || !sel.anchorNode || !editor.contains(sel.anchorNode)) return;
      try {
        setActive({
          bold: document.queryCommandState("bold"),
          italic: document.queryCommandState("italic"),
          underline: document.queryCommandState("underline"),
          strike: document.queryCommandState("strikeThrough"),
          ul: document.queryCommandState("insertUnorderedList"),
          ol: document.queryCommandState("insertOrderedList"),
          center: document.queryCommandState("justifyCenter"),
          right: document.queryCommandState("justifyRight"),
          justify: document.queryCommandState("justifyFull"),
        });
        const b = (document.queryCommandValue("formatBlock") || "p").toLowerCase().replace(/[<>]/g, "");
        setBlockFormat(BLOCK_FORMATS.some((f) => f.value === b) ? b : "p");
      } catch {
        /* queryCommandState can throw on exotic selections — ignore */
      }
    };
    document.addEventListener("selectionchange", handler);
    return () => document.removeEventListener("selectionchange", handler);
  }, []);

  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

  const restoreSelection = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    if (savedRange.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRange.current);
      }
    }
  }, []);

  const exec = useCallback((cmd: string, value?: string) => {
    if (!editorRef.current) return;
    restoreSelection();
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(cmd, false, value);
    setResult(null);
  }, [restoreSelection]);

  const execBlock = useCallback(
    (tag: string) => {
      exec("formatBlock", `<${tag}>`);
      setBlockFormat(tag);
    },
    [exec]
  );

  // execCommand's fontSize only supports 1–7; apply "7" then upgrade the
  // generated <font size="7">/xxx-large spans to an explicit px size.
  const applyFontSize = useCallback(
    (px: string) => {
      const editor = editorRef.current;
      if (!editor) return;
      restoreSelection();
      document.execCommand("fontSize", false, "7");
      editor.querySelectorAll('font[size="7"]').forEach((f) => {
        const span = document.createElement("span");
        span.style.fontSize = px;
        span.innerHTML = (f as HTMLElement).innerHTML;
        f.replaceWith(span);
      });
      editor.querySelectorAll('span[style*="xxx-large"]').forEach((s) => {
        (s as HTMLElement).style.fontSize = px;
      });
      setResult(null);
    },
    [restoreSelection]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();
      const editor = editorRef.current;
      if (!editor) return;
      editor.focus();

      if (keepFormatting) {
        const html = e.clipboardData.getData("text/html");
        const plain = e.clipboardData.getData("text/plain");
        const payload = html
          ? sanitizeHtml(html)
          : plain
            ? textToHtml(plain)
            : "";
        if (payload) document.execCommand("insertHTML", false, payload);
      } else {
        const plain = e.clipboardData.getData("text/plain");
        if (plain) document.execCommand("insertHTML", false, textToHtml(plain));
      }
      syncStats();
      setResult(null);
    },
    [keepFormatting, syncStats]
  );

  const handleImport = useCallback(
    async (file: File) => {
      const editor = editorRef.current;
      if (!editor) return;
      const text = await file.text();
      if (editor.innerText.trim() !== "" && !window.confirm("Importing replaces the current document. Continue?")) {
        return;
      }
      if (/\.html?$/i.test(file.name)) {
        editor.innerHTML = sanitizeHtml(text);
      } else {
        editor.innerHTML = textToHtml(text);
      }
      syncStats();
      setResult(null);
    },
    [syncStats]
  );

  const handleClear = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (editor.innerText.trim() !== "" && !window.confirm("Clear the whole document?")) return;
    editor.innerHTML = "";
    syncStats();
    setResult(null);
  }, [syncStats]);

  const handleConvert = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor || processing) return;
    if (editor.innerText.trim() === "") {
      onError?.("Type or paste some text first — the document is empty.");
      return;
    }
    setProcessing(true);
    onProcessing?.(true);
    try {
      // Derive the download filename from the first heading while the DOM is
      // available here (never read refs during render).
      const heading = editor.querySelector("h1, h2")?.textContent?.trim();
      const slug = (heading || "document").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
      setFilename(`${slug || "document"}.pdf`);

      const { richTextToPdf } = await import("@/lib/richtext-pdf");
      const res = await richTextToPdf(editor, {
        pageSize,
        orientation,
        margin,
        lineSpacing,
        pageNumbers,
        pageNumberPosition,
      });
      setResult(res);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to create PDF");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  }, [onProcessing, onError, processing, pageSize, orientation, margin, lineSpacing, pageNumbers, pageNumberPosition]);

  return (
    <div className="space-y-5">
      {/* ─── Toolbar ─── */}
      <div className="flex flex-wrap items-center gap-1 p-1.5 rounded-xl bg-bg-elevated border border-border-base">
        <button type="button" className={TB_BASE} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("undo")} title="Undo (Ctrl+Z)" aria-label="Undo">
          <svg {...TB_SVG_PROPS}><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg>
        </button>
        <button type="button" className={TB_BASE} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("redo")} title="Redo (Ctrl+Y)" aria-label="Redo">
          <svg {...TB_SVG_PROPS}><path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" /></svg>
        </button>

        <span className="w-px h-5 bg-border-base mx-0.5" aria-hidden="true" />

        <select
          className="h-8 rounded-lg border border-border-strong bg-bg-input px-1.5 text-xs font-medium text-text-primary cursor-pointer"
          value={blockFormat}
          onChange={(e) => execBlock(e.target.value)}
          title="Paragraph style"
          aria-label="Paragraph style"
        >
          {BLOCK_FORMATS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>

        <span className="w-px h-5 bg-border-base mx-0.5" aria-hidden="true" />

        <button type="button" className={`${TB_BASE} font-bold ${active.bold ? TB_ACTIVE : ""}`} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("bold")} title="Bold (Ctrl+B)" aria-label="Bold">B</button>
        <button type="button" className={`${TB_BASE} italic ${active.italic ? TB_ACTIVE : ""}`} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("italic")} title="Italic (Ctrl+I)" aria-label="Italic">I</button>
        <button type="button" className={`${TB_BASE} underline ${active.underline ? TB_ACTIVE : ""}`} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("underline")} title="Underline (Ctrl+U)" aria-label="Underline">U</button>
        <button type="button" className={`${TB_BASE} line-through ${active.strike ? TB_ACTIVE : ""}`} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("strikeThrough")} title="Strikethrough" aria-label="Strikethrough">S</button>

        <span className="w-px h-5 bg-border-base mx-0.5" aria-hidden="true" />

        <select
          className="h-8 rounded-lg border border-border-strong bg-bg-input px-1.5 text-xs font-medium text-text-primary cursor-pointer max-w-[9.5rem]"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) exec("fontName", e.target.value);
            e.target.value = "";
          }}
          title="Font family"
          aria-label="Font family"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.label} value={f.value}>{f.label}</option>
          ))}
        </select>
        <select
          className="h-8 rounded-lg border border-border-strong bg-bg-input px-1.5 text-xs font-medium text-text-primary cursor-pointer"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) applyFontSize(e.target.value);
            e.target.value = "";
          }}
          title="Font size"
          aria-label="Font size"
        >
          <option value="">Size</option>
          {FONT_SIZES.map((s) => (
            <option key={s} value={s}>{parseInt(s, 10)}</option>
          ))}
        </select>

        <label className={`${TB_BASE} cursor-pointer relative`} title="Text color" aria-label="Text color">
          <span className="text-[11px] leading-none font-bold border-b-[3px] border-danger pb-0.5">A</span>
          <input
            type="color"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => exec("foreColor", e.target.value)}
          />
        </label>
        <label className={`${TB_BASE} cursor-pointer relative`} title="Highlight color" aria-label="Highlight color">
          <svg {...TB_SVG_PROPS}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
          <input
            type="color"
            defaultValue="#fef08a"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => exec("hiliteColor", e.target.value)}
          />
        </label>

        <span className="w-px h-5 bg-border-base mx-0.5" aria-hidden="true" />

        <button type="button" className={`${TB_BASE} ${!active.center && !active.right && !active.justify ? TB_ACTIVE : ""}`} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("justifyLeft")} title="Align left" aria-label="Align left">
          <svg {...TB_SVG_PROPS}><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="18" y2="18" /></svg>
        </button>
        <button type="button" className={`${TB_BASE} ${active.center ? TB_ACTIVE : ""}`} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("justifyCenter")} title="Align center" aria-label="Align center">
          <svg {...TB_SVG_PROPS}><line x1="3" y1="6" x2="21" y2="6" /><line x1="6" y1="12" x2="18" y2="12" /><line x1="4" y1="18" x2="20" y2="18" /></svg>
        </button>
        <button type="button" className={`${TB_BASE} ${active.right ? TB_ACTIVE : ""}`} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("justifyRight")} title="Align right" aria-label="Align right">
          <svg {...TB_SVG_PROPS}><line x1="3" y1="6" x2="21" y2="6" /><line x1="9" y1="12" x2="21" y2="12" /><line x1="6" y1="18" x2="21" y2="18" /></svg>
        </button>
        <button type="button" className={`${TB_BASE} ${active.justify ? TB_ACTIVE : ""}`} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("justifyFull")} title="Justify" aria-label="Justify">
          <svg {...TB_SVG_PROPS}><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
        </button>

        <span className="w-px h-5 bg-border-base mx-0.5" aria-hidden="true" />

        <button type="button" className={`${TB_BASE} ${active.ul ? TB_ACTIVE : ""}`} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("insertUnorderedList")} title="Bullet list" aria-label="Bullet list">
          <svg {...TB_SVG_PROPS}><line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" /><circle cx="4.5" cy="6" r="1" fill="currentColor" /><circle cx="4.5" cy="12" r="1" fill="currentColor" /><circle cx="4.5" cy="18" r="1" fill="currentColor" /></svg>
        </button>
        <button type="button" className={`${TB_BASE} ${active.ol ? TB_ACTIVE : ""}`} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("insertOrderedList")} title="Numbered list" aria-label="Numbered list">
          <svg {...TB_SVG_PROPS}><line x1="10" y1="6" x2="20" y2="6" /><line x1="10" y1="12" x2="20" y2="12" /><line x1="10" y1="18" x2="20" y2="18" /><text x="3" y="8" fontSize="7" fill="currentColor" stroke="none" fontWeight="bold">1</text><text x="3" y="14" fontSize="7" fill="currentColor" stroke="none" fontWeight="bold">2</text><text x="3" y="20" fontSize="7" fill="currentColor" stroke="none" fontWeight="bold">3</text></svg>
        </button>
        <button type="button" className={TB_BASE} onMouseDown={(e) => e.preventDefault()} onClick={() => {
          const url = window.prompt("Link URL (https://…)");
          if (url) exec("createLink", /^https?:/i.test(url) ? url : `https://${url}`);
        }} title="Insert link" aria-label="Insert link">
          <svg {...TB_SVG_PROPS}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
        </button>

        <span className="w-px h-5 bg-border-base mx-0.5" aria-hidden="true" />

        <button type="button" className={TB_BASE} onMouseDown={(e) => e.preventDefault()} onClick={() => {
          exec("removeFormat");
          execBlock("p");
        }} title="Clear formatting" aria-label="Clear formatting">
          <svg {...TB_SVG_PROPS}><path d="M4 7V4h16v3" /><path d="M5 20h6" /><path d="M13 4 8 20" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="21" y1="15" x2="15" y2="21" /></svg>
        </button>
        <button type="button" className={TB_BASE} onClick={() => fileInputRef.current?.click()} title="Import a .txt or .html file" aria-label="Import file">
          <svg {...TB_SVG_PROPS}><path d="M15 8h-5v5" /><path d="m9 12 6-6" /><path d="M19 13v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v1" /></svg>
        </button>
        <button type="button" className={TB_BASE} onClick={handleClear} title="Clear document" aria-label="Clear document">
          <svg {...TB_SVG_PROPS}><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.text,.html,.htm,.md"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleImport(file);
          e.target.value = "";
        }}
      />

      {/* ─── Editor ─── */}
      <div className="relative rounded-xl border border-border-strong bg-bg-input focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label="Rich text document"
          spellCheck
          data-empty="true"
          onInput={syncStats}
          onPaste={handlePaste}
          onBlur={saveSelection}
          className="rte-content min-h-[380px] max-h-[65vh] overflow-y-auto rounded-xl px-5 py-4 text-[15px] leading-relaxed text-text-primary outline-none"
        />
        {isEmpty && (
          <div className="pointer-events-none absolute top-4 left-5 right-5 text-[15px] text-text-tertiary select-none">
            Start typing, or paste text — <span className="font-semibold">formatting is kept</span> (bold, colors, lists, links, fonts…)
          </div>
        )}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border-base text-[11px] text-text-tertiary">
          <span>{wordCount.toLocaleString()} words · {charCount.toLocaleString()} characters</span>
          <label className="flex items-center gap-1.5 cursor-pointer select-none" title="When on, pasted text keeps its fonts, colors, and layout. Turn off to paste as plain text.">
            <input
              type="checkbox"
              checked={keepFormatting}
              onChange={(e) => setKeepFormatting(e.target.checked)}
              className="w-3.5 h-3.5 accent-[var(--accent)] cursor-pointer"
            />
            Keep source formatting on paste
          </label>
        </div>
      </div>

      {/* ─── Page setup ─── */}
      <details className="group bg-bg-surface border border-border-base rounded-xl px-4 sm:px-5 [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex items-center justify-between gap-3 py-3.5 cursor-pointer list-none select-none">
          <h3 className="text-[13.5px] font-semibold text-text-primary">Page setup &amp; options</h3>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary shrink-0 transition-transform duration-200 group-open:rotate-180" aria-hidden="true">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </summary>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Page size</label>
            <select className="w-full h-9 rounded-lg border border-border-strong bg-bg-input px-2 text-[13px] text-text-primary cursor-pointer" value={pageSize} onChange={(e) => setPageSize(e.target.value as PdfPageSize)}>
              <option value="a4">A4</option>
              <option value="letter">US Letter</option>
              <option value="legal">Legal</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Orientation</label>
            <select className="w-full h-9 rounded-lg border border-border-strong bg-bg-input px-2 text-[13px] text-text-primary cursor-pointer" value={orientation} onChange={(e) => setOrientation(e.target.value as PdfOrientation)}>
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Margins</label>
            <select className="w-full h-9 rounded-lg border border-border-strong bg-bg-input px-2 text-[13px] text-text-primary cursor-pointer" value={margin} onChange={(e) => setMargin(e.target.value as PdfMargin)}>
              <option value="narrow">Narrow</option>
              <option value="normal">Normal (1&quot;)</option>
              <option value="wide">Wide</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Line spacing</label>
            <select className="w-full h-9 rounded-lg border border-border-strong bg-bg-input px-2 text-[13px] text-text-primary cursor-pointer" value={lineSpacing} onChange={(e) => setLineSpacing(Number(e.target.value) as PdfLineSpacing)}>
              <option value={1}>Single</option>
              <option value={1.15}>1.15</option>
              <option value={1.5}>1.5</option>
              <option value={2}>Double</option>
            </select>
          </div>
          <div className="col-span-2 sm:col-span-4 flex flex-wrap items-center gap-3 pt-1">
            <label className="flex items-center gap-2 text-[13px] font-medium text-text-primary cursor-pointer select-none">
              <input type="checkbox" checked={pageNumbers} onChange={(e) => setPageNumbers(e.target.checked)} className="w-4 h-4 accent-[var(--accent)] cursor-pointer" />
              Add page numbers
            </label>
            {pageNumbers && (
              <select className="h-9 rounded-lg border border-border-strong bg-bg-input px-2 text-[13px] text-text-primary cursor-pointer" value={pageNumberPosition} onChange={(e) => setPageNumberPosition(e.target.value as PageNumberPosition)} aria-label="Page number position">
                <option value="bottom-center">Bottom center</option>
                <option value="bottom-right">Bottom right</option>
                <option value="top-right">Top right</option>
              </select>
            )}
          </div>
        </div>
      </details>

      {/* ─── Convert ─── */}
      {result ? (
        <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center space-y-3">
          <p className="text-sm text-success font-semibold">✓ PDF created — {result.pageCount} page{result.pageCount === 1 ? "" : "s"}, real selectable text</p>
          {result.warnings.length > 0 && (
            <div className="text-left space-y-1.5 px-1">
              {result.warnings.map((w, i) => (
                <p key={i} className="text-xs text-text-secondary flex items-start gap-1.5">
                  <span className="text-warning shrink-0">⚠</span>
                  {w}
                </p>
              ))}
            </div>
          )}
          <div className="flex items-center justify-center gap-2">
            <DownloadButton blob={result.blob} filename={filename} label="Download PDF" />
            <button type="button" className="btn-secondary" onClick={() => setResult(null)}>Edit more</button>
          </div>
        </div>
      ) : (
        <button onClick={handleConvert} disabled={processing || isEmpty} className="btn-primary w-full py-3">
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin-slow" />
              Typesetting PDF…
            </span>
          ) : (
            "Convert to PDF"
          )}
        </button>
      )}
    </div>
  );
}
