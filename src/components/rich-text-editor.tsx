"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ─── Clipboard & HTML sanitizer ──────────────────────────────────────
// Keeps the formatting a user pasted (fonts, sizes, colors, alignment,
// lists, tables, links, images) while stripping scripts, trackers, and
// junk attributes that Word/web clipboards carry.

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
  /^margin(-|$)/i, /^padding(-|$)/i, /^line-height$/i, /^border(-|$)/i,
  /^width$/i, /^max-width$/i, /^border-collapse$/i, /^vertical-align$/i,
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
        const frag = document.createDocumentFragment();
        for (const child of Array.from(el.childNodes)) {
          const cleaned = clean(child);
          if (cleaned) frag.appendChild(cleaned);
        }
        return frag;
      }
    }
    if (tag === "IMG") {
      const src = (el.getAttribute("src") ?? "").trim();
      if (!/^(data:image\/|https?:|blob:)/i.test(src)) return null;
      out.setAttribute("src", src);
      const alt = el.getAttribute("alt");
      if (alt) out.setAttribute("alt", alt);
    }
    if (tag === "TD" || tag === "TH") {
      const colspan = el.getAttribute("colspan");
      const rowspan = el.getAttribute("rowspan");
      if (colspan && /^\d+$/.test(colspan)) out.setAttribute("colspan", colspan);
      if (rowspan && /^\d+$/.test(rowspan)) out.setAttribute("rowspan", rowspan);
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

/** Lightly format raw HTML into readable indented lines for the HTML Source view. */
function formatHtmlSource(html: string): string {
  if (!html.trim()) return "";
  return html
    .replace(/></g, ">\n<")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

// ─── Component constants ─────────────────────────────────────────────

const FONT_FAMILIES = [
  { label: "Font", value: "" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Garamond", value: "Garamond, 'Times New Roman', serif" },
  { label: "Courier New", value: "'Courier New', Courier, monospace" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Noto Sans Devanagari (Nepali/Hindi)", value: "'Noto Sans Devanagari', 'Nirmala UI', 'Mangal', sans-serif" },
  { label: "Kalimati (Nepali)", value: "'Kalimati', 'Noto Sans Devanagari', 'Nirmala UI', sans-serif" },
  { label: "Mangal (Nepali/Hindi)", value: "'Mangal', 'Noto Sans Devanagari', 'Nirmala UI', sans-serif" },
  { label: "Preeti (Nepali legacy)", value: "Preeti, sans-serif" },
  { label: "Kantipur (Nepali legacy)", value: "Kantipur, sans-serif" },
];

const FONT_SIZES = [
  "10px", "12px", "14px", "16px", "18px", "20px",
  "24px", "28px", "32px", "36px", "48px",
];

const LINE_HEIGHTS = [
  { label: "Line", value: "" },
  { label: "1.0", value: "1" },
  { label: "1.15", value: "1.15" },
  { label: "1.5", value: "1.5" },
  { label: "1.8", value: "1.8" },
  { label: "2.0", value: "2" },
];

const BLOCK_FORMATS = [
  { label: "Paragraph", value: "p" },
  { label: "Heading 1", value: "h1" },
  { label: "Heading 2", value: "h2" },
  { label: "Heading 3", value: "h3" },
  { label: "Heading 4", value: "h4" },
  { label: "Quote", value: "blockquote" },
  { label: "Code block", value: "pre" },
];

const TB_BASE =
  "h-8 min-w-8 px-1.5 inline-flex items-center justify-center rounded-lg text-[13px] font-semibold border border-transparent text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors select-none cursor-pointer disabled:opacity-40";
const TB_ACTIVE = "bg-accent-subtle text-accent border-accent/30";
const TB_SEP = "w-px h-5 bg-border-base mx-0.5 shrink-0";

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

export interface RichTextEditorProps {
  /** Stable id for the editor canvas ("rte-pdf" / "rte-word"). */
  editorId: string;
  /** When false, pasted text is stripped to plain paragraphs. */
  keepFormatting: boolean;
  onKeepFormattingChange: (value: boolean) => void;
  /** Report the editor element (export engines read its live DOM). */
  onEditorReady: (el: HTMLDivElement | null) => void;
}

/**
 * Full-featured document & rich-text editor (Xoditor-style):
 * rich typography, Nepali/Devanagari font presets, tables, images, links,
 * subscript/superscript, line height, find & replace, fullscreen focus mode,
 * and bidirectional HTML Source view.
 * Always keeps the visual contenteditable div mounted and exposed via
 * onEditorReady so export engines (Text→PDF) read its live DOM.
 */
export default function RichTextEditor({
  editorId,
  keepFormatting,
  onKeepFormattingChange,
  onEditorReady,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const tablePickerRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);

  const [isEmpty, setIsEmpty] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [active, setActive] = useState<Record<string, boolean>>({});
  const [blockFormat, setBlockFormat] = useState("p");

  const [textColor, setTextColor] = useState("#dc2626");
  const [highlightColor, setHighlightColor] = useState("#fef08a");

  // Xoditor-style modes & popovers
  const [sourceMode, setSourceMode] = useState(false);
  const [sourceHtml, setSourceHtml] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [tableHover, setTableHover] = useState<{ r: number; c: number }>({ r: 3, c: 3 });

  // Find & Replace bar
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [matchCase, setMatchCase] = useState(false);
  const [findStatus, setFindStatus] = useState("");

  // Custom popup modal (replaces browser window.confirm / window.prompt)
  const [modal, setModal] = useState<
    | null
    | { type: "clear" }
    | { type: "import"; file: File }
    | { type: "link"; url: string }
  >(null);

  // Microsoft Word-style Page View (real-time A4 sheet & page breaks)
  const [pageView, setPageView] = useState(true);
  const [pageCount, setPageCount] = useState(1);
  const syncTimerRef = useRef<number | null>(null);
  const lastSelCheckRef = useRef(0);
  const PAGE_HEIGHT_PX = 980; // Approx printable A4 height inside the editor sheet

  const syncStats = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const text = editor.innerText ?? "";
    const hasMedia = editor.querySelector("img, table, hr") !== null;
    const empty = text.trim() === "" && !hasMedia;
    setCharCount(text.length);
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
    setIsEmpty(empty);
    editor.dataset.empty = empty ? "true" : "false";
    const estPages = Math.max(1, Math.ceil((editor.scrollHeight || 1) / PAGE_HEIGHT_PX));
    setPageCount(estPages);

    if (/[\u0900-\u097F]/.test(text)) {
      void import("@/lib/script-fonts").then(({ prepareScriptFonts }) => {
        void prepareScriptFonts(text);
      });
    }
  }, []);

  // Debounced stats sync so typing in 10+ page documents stays instant with zero reflow lag
  const scheduleSyncStats = useCallback(() => {
    const editor = editorRef.current;
    if (editor) {
      const quickEmpty = editor.childNodes.length === 0;
      if (quickEmpty !== isEmpty && quickEmpty) setIsEmpty(true);
      else if (!quickEmpty && isEmpty) setIsEmpty(false);
    }
    if (syncTimerRef.current !== null) {
      window.clearTimeout(syncTimerRef.current);
    }
    syncTimerRef.current = window.setTimeout(() => {
      syncTimerRef.current = null;
      syncStats();
    }, 180);
  }, [isEmpty, syncStats]);

  useEffect(() => {
    return () => {
      if (syncTimerRef.current !== null) {
        window.clearTimeout(syncTimerRef.current);
      }
    };
  }, []);

  // Track active formatting under caret (throttled so 10+ page docs never lag)
  useEffect(() => {
    const handler = () => {
      if (sourceMode) return;
      const now = performance.now();
      if (now - lastSelCheckRef.current < 100) return;
      lastSelCheckRef.current = now;
      const sel = window.getSelection();
      const editor = editorRef.current;
      if (!sel || !editor || !sel.anchorNode || !editor.contains(sel.anchorNode)) return;
      try {
        setActive({
          bold: document.queryCommandState("bold"),
          italic: document.queryCommandState("italic"),
          underline: document.queryCommandState("underline"),
          strike: document.queryCommandState("strikeThrough"),
          subscript: document.queryCommandState("subscript"),
          superscript: document.queryCommandState("superscript"),
          ul: document.queryCommandState("insertUnorderedList"),
          ol: document.queryCommandState("insertOrderedList"),
          center: document.queryCommandState("justifyCenter"),
          right: document.queryCommandState("justifyRight"),
          justify: document.queryCommandState("justifyFull"),
        });
        const b = (document.queryCommandValue("formatBlock") || "p").toLowerCase().replace(/[<>]/g, "");
        setBlockFormat(BLOCK_FORMATS.some((f) => f.value === b) ? b : "p");
      } catch {
        /* ignore exotic selection errors */
      }
    };
    document.addEventListener("selectionchange", handler);
    return () => document.removeEventListener("selectionchange", handler);
  }, [sourceMode]);

  // Close table picker on outside click
  useEffect(() => {
    if (!showTablePicker) return;
    const onDown = (e: MouseEvent) => {
      if (tablePickerRef.current && !tablePickerRef.current.contains(e.target as Node)) {
        setShowTablePicker(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showTablePicker]);

  // Esc exits modal / table picker / fullscreen; Ctrl/Cmd+F opens Find & Replace
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (modal) setModal(null);
        else if (showTablePicker) setShowTablePicker(false);
        else if (fullscreen) setFullscreen(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        const editor = editorRef.current;
        if (editor && (document.activeElement === editor || editor.contains(document.activeElement) || fullscreen)) {
          e.preventDefault();
          setShowFindReplace(true);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fullscreen, modal, showTablePicker]);

  // Report live editor element upward
  useEffect(() => {
    onEditorReady(editorRef.current);
    return () => onEditorReady(null);
  }, [onEditorReady]);

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

  const exec = useCallback(
    (cmd: string, value?: string) => {
      if (sourceMode || !editorRef.current) return;
      restoreSelection();
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand(cmd, false, value);
      syncStats();
    },
    [restoreSelection, sourceMode, syncStats]
  );

  const execBlock = useCallback(
    (tag: string) => {
      exec("formatBlock", `<${tag}>`);
      setBlockFormat(tag);
    },
    [exec]
  );

  const applyFontSize = useCallback(
    (px: string) => {
      const editor = editorRef.current;
      if (sourceMode || !editor) return;
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
      syncStats();
    },
    [restoreSelection, sourceMode, syncStats]
  );

  const applyLineHeight = useCallback(
    (lh: string) => {
      const editor = editorRef.current;
      if (sourceMode || !editor || !lh) return;
      restoreSelection();
      const sel = window.getSelection();
      if (sel && sel.anchorNode) {
        let node: Node | null = sel.anchorNode;
        while (node && node !== editor) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            if (/^(P|DIV|H[1-6]|LI|BLOCKQUOTE|PRE)$/.test(el.tagName)) {
              el.style.lineHeight = lh;
              return;
            }
          }
          node = node.parentNode;
        }
      }
      editor.style.lineHeight = lh;
    },
    [restoreSelection, sourceMode]
  );

  const insertInlineCode = useCallback(() => {
    const editor = editorRef.current;
    if (sourceMode || !editor) return;
    restoreSelection();
    const sel = window.getSelection();
    const selectedText = sel?.toString() ?? "";
    if (selectedText) {
      document.execCommand("insertHTML", false, `<code>${escapeHtml(selectedText)}</code>`);
    } else {
      document.execCommand("insertHTML", false, "<code>code</code>");
    }
    syncStats();
  }, [restoreSelection, sourceMode, syncStats]);

  const insertTable = useCallback(
    (rows: number, cols: number) => {
      if (sourceMode || !editorRef.current) return;
      restoreSelection();
      const headerCells = Array.from({ length: cols }, (_, c) => `<th>Header ${c + 1}</th>`).join("");
      const bodyRows = Array.from(
        { length: Math.max(1, rows - 1) },
        () => `<tr>${Array.from({ length: cols }, () => "<td>Cell</td>").join("")}</tr>`
      ).join("");
      const tableHtml = `<table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table><p><br></p>`;
      document.execCommand("insertHTML", false, tableHtml);
      setShowTablePicker(false);
      syncStats();
    },
    [restoreSelection, sourceMode, syncStats]
  );

  const handleInsertImageFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = typeof reader.result === "string" ? reader.result : "";
        if (!dataUrl) return;
        restoreSelection();
        document.execCommand(
          "insertHTML",
          false,
          `<img src="${dataUrl}" alt="${escapeHtml(file.name)}" style="max-width:100%;height:auto;" />`
        );
        syncStats();
      };
      reader.readAsDataURL(file);
    },
    [restoreSelection, syncStats]
  );

  const toggleSourceMode = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (!sourceMode) {
      setSourceHtml(formatHtmlSource(editor.innerHTML));
      setSourceMode(true);
    } else {
      editor.innerHTML = sanitizeHtml(sourceHtml);
      setSourceMode(false);
      syncStats();
    }
  }, [sourceHtml, sourceMode, syncStats]);

  const handleSourceChange = useCallback(
    (next: string) => {
      setSourceHtml(next);
      const editor = editorRef.current;
      if (editor) {
        editor.innerHTML = sanitizeHtml(next);
        syncStats();
      }
    },
    [syncStats]
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
    },
    [keepFormatting, syncStats]
  );

  const applyImportedFile = useCallback(
    async (file: File) => {
      const editor = editorRef.current;
      if (!editor) return;
      const text = await file.text();
      const nextHtml = /\.html?$/i.test(file.name) ? sanitizeHtml(text) : textToHtml(text);
      editor.innerHTML = nextHtml;
      if (sourceMode) setSourceHtml(formatHtmlSource(nextHtml));
      syncStats();
    },
    [sourceMode, syncStats]
  );

  const handleImport = useCallback(
    (file: File) => {
      const editor = editorRef.current;
      if (!editor) return;
      if (editor.innerText.trim() !== "") {
        setModal({ type: "import", file });
        return;
      }
      void applyImportedFile(file);
    },
    [applyImportedFile]
  );

  const handleExportHtml = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const htmlDoc = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8" />\n<title>Document</title>\n<style>body{font-family:system-ui,-apple-system,sans-serif;max-width:800px;margin:2rem auto;padding:0 1rem;line-height:1.6;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #d1d5db;padding:6px 10px;text-align:left;}blockquote{border-left:3px solid #6366f1;padding-left:1rem;color:#4b5563;}</style>\n</head>\n<body>\n${editor.innerHTML}\n</body>\n</html>`;
    const blob = new Blob([htmlDoc], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.html";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const performClear = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.innerHTML = "";
    if (sourceMode) setSourceHtml("");
    syncStats();
  }, [sourceMode, syncStats]);

  const handleClear = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (editor.innerText.trim() !== "" || editor.querySelector("img, table, hr")) {
      setModal({ type: "clear" });
      return;
    }
    performClear();
  }, [performClear]);

  const handleModalConfirm = useCallback(() => {
    if (!modal) return;
    if (modal.type === "clear") {
      performClear();
      setModal(null);
    } else if (modal.type === "import") {
      const file = modal.file;
      setModal(null);
      void applyImportedFile(file);
    } else if (modal.type === "link") {
      const raw = modal.url.trim();
      setModal(null);
      if (raw) {
        exec("createLink", /^https?:|^mailto:/i.test(raw) ? raw : `https://${raw}`);
      }
    }
  }, [applyImportedFile, exec, modal, performClear]);

  // Find & Replace on live text nodes so formatting tags are preserved
  const runReplaceAll = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || !findText) return;
    const flags = matchCase ? "g" : "gi";
    const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, flags);
    let count = 0;

    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    let current = walker.nextNode();
    while (current) {
      textNodes.push(current as Text);
      current = walker.nextNode();
    }
    for (const tn of textNodes) {
      const val = tn.nodeValue ?? "";
      const matches = val.match(regex);
      if (matches && matches.length > 0) {
        count += matches.length;
        tn.nodeValue = val.replace(regex, replaceText);
      }
    }
    if (sourceMode) setSourceHtml(formatHtmlSource(editor.innerHTML));
    syncStats();
    setFindStatus(count > 0 ? `Replaced ${count} match${count === 1 ? "" : "es"}` : "No matches");
  }, [findText, matchCase, replaceText, sourceMode, syncStats]);

  const countMatches = useMemo(() => {
    if (!findText) return 0;
    const editor = editorRef.current;
    if (!editor) return 0;
    const text = editor.innerText ?? "";
    const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = text.match(new RegExp(escaped, matchCase ? "g" : "gi"));
    return matches ? matches.length : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [findText, matchCase, charCount]);

  const readingMinutes = Math.max(1, Math.ceil(wordCount / 200));
  const sourceLineCount = useMemo(
    () => Math.max(12, sourceHtml.split("\n").length),
    [sourceHtml]
  );

  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-50 bg-bg-base p-3 sm:p-5 flex flex-col gap-3 overflow-hidden"
          : "space-y-3"
      }
    >
      {/* ─── Xoditor-style Toolbar ─── */}
      <div className="flex flex-wrap items-center gap-1 p-1.5 rounded-xl bg-bg-elevated border border-border-base">
        {/* History */}
        <button type="button" disabled={sourceMode} className={TB_BASE} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("undo")} title="Undo (Ctrl+Z)" aria-label="Undo">
          <svg {...TB_SVG_PROPS}><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg>
        </button>
        <button type="button" disabled={sourceMode} className={TB_BASE} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("redo")} title="Redo (Ctrl+Y)" aria-label="Redo">
          <svg {...TB_SVG_PROPS}><path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" /></svg>
        </button>

        <span className={TB_SEP} aria-hidden="true" />

        {/* Block & Typography */}
        <select
          disabled={sourceMode}
          className="h-8 rounded-lg border border-border-strong bg-bg-input px-1.5 text-xs font-medium text-text-primary cursor-pointer disabled:opacity-40"
          value={blockFormat}
          onChange={(e) => execBlock(e.target.value)}
          title="Paragraph style"
          aria-label="Paragraph style"
        >
          {BLOCK_FORMATS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>

        <select
          disabled={sourceMode}
          className="h-8 rounded-lg border border-border-strong bg-bg-input px-1.5 text-xs font-medium text-text-primary cursor-pointer max-w-[9.5rem] disabled:opacity-40"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) exec("fontName", e.target.value);
            e.target.value = "";
          }}
          title="Font family (English & Nepali)"
          aria-label="Font family"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.label} value={f.value}>{f.label}</option>
          ))}
        </select>

        <select
          disabled={sourceMode}
          className="h-8 rounded-lg border border-border-strong bg-bg-input px-1.5 text-xs font-medium text-text-primary cursor-pointer disabled:opacity-40"
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

        <select
          disabled={sourceMode}
          className="h-8 rounded-lg border border-border-strong bg-bg-input px-1.5 text-xs font-medium text-text-primary cursor-pointer disabled:opacity-40"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) applyLineHeight(e.target.value);
            e.target.value = "";
          }}
          title="Line spacing"
          aria-label="Line spacing"
        >
          {LINE_HEIGHTS.map((l) => (
            <option key={l.label} value={l.value}>{l.label}</option>
          ))}
        </select>

        <span className={TB_SEP} aria-hidden="true" />

        {/* Inline formatting */}
        <button type="button" disabled={sourceMode} className={`${TB_BASE} font-bold ${active.bold ? TB_ACTIVE : ""}`} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("bold")} title="Bold (Ctrl+B)" aria-label="Bold">B</button>
        <button type="button" disabled={sourceMode} className={`${TB_BASE} italic ${active.italic ? TB_ACTIVE : ""}`} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("italic")} title="Italic (Ctrl+I)" aria-label="Italic">I</button>
        <button type="button" disabled={sourceMode} className={`${TB_BASE} underline ${active.underline ? TB_ACTIVE : ""}`} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("underline")} title="Underline (Ctrl+U)" aria-label="Underline">U</button>
        <button type="button" disabled={sourceMode} className={`${TB_BASE} line-through ${active.strike ? TB_ACTIVE : ""}`} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("strikeThrough")} title="Strikethrough" aria-label="Strikethrough">S</button>
        <button type="button" disabled={sourceMode} className={`${TB_BASE} text-[11px] ${active.subscript ? TB_ACTIVE : ""}`} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("subscript")} title="Subscript" aria-label="Subscript">
          X<sub className="text-[9px]">2</sub>
        </button>
        <button type="button" disabled={sourceMode} className={`${TB_BASE} text-[11px] ${active.superscript ? TB_ACTIVE : ""}`} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("superscript")} title="Superscript" aria-label="Superscript">
          X<sup className="text-[9px]">2</sup>
        </button>
        <button type="button" disabled={sourceMode} className={TB_BASE} onMouseDown={(e) => e.preventDefault()} onClick={insertInlineCode} title="Inline code" aria-label="Inline code">
          <svg {...TB_SVG_PROPS}><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
        </button>

        {/* Colors */}
        <label className={`${TB_BASE} relative`} title="Text color" aria-label="Text color">
          <span
            className="text-[11px] leading-none font-bold pb-0.5 border-b-[3px]"
            style={{ borderBottomColor: textColor }}
          >
            A
          </span>
          <input
            type="color"
            disabled={sourceMode}
            value={textColor}
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => {
              setTextColor(e.target.value);
              exec("foreColor", e.target.value);
            }}
          />
        </label>
        <label className={`${TB_BASE} relative`} title="Highlight color" aria-label="Highlight color">
          <span className="inline-flex flex-col items-center">
            <svg {...TB_SVG_PROPS} width={13} height={13}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
            <span className="w-3.5 h-[3px] rounded-full mt-0.5" style={{ backgroundColor: highlightColor }} />
          </span>
          <input
            type="color"
            disabled={sourceMode}
            value={highlightColor}
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => {
              setHighlightColor(e.target.value);
              exec("hiliteColor", e.target.value);
            }}
          />
        </label>

        <span className={TB_SEP} aria-hidden="true" />

        {/* Alignment */}
        <button type="button" disabled={sourceMode} className={`${TB_BASE} ${!active.center && !active.right && !active.justify ? TB_ACTIVE : ""}`} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("justifyLeft")} title="Align left" aria-label="Align left">
          <svg {...TB_SVG_PROPS}><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="18" y2="18" /></svg>
        </button>
        <button type="button" disabled={sourceMode} className={`${TB_BASE} ${active.center ? TB_ACTIVE : ""}`} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("justifyCenter")} title="Align center" aria-label="Align center">
          <svg {...TB_SVG_PROPS}><line x1="3" y1="6" x2="21" y2="6" /><line x1="6" y1="12" x2="18" y2="12" /><line x1="4" y1="18" x2="20" y2="18" /></svg>
        </button>
        <button type="button" disabled={sourceMode} className={`${TB_BASE} ${active.right ? TB_ACTIVE : ""}`} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("justifyRight")} title="Align right" aria-label="Align right">
          <svg {...TB_SVG_PROPS}><line x1="3" y1="6" x2="21" y2="6" /><line x1="9" y1="12" x2="21" y2="12" /><line x1="6" y1="18" x2="21" y2="18" /></svg>
        </button>
        <button type="button" disabled={sourceMode} className={`${TB_BASE} ${active.justify ? TB_ACTIVE : ""}`} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("justifyFull")} title="Justify" aria-label="Justify">
          <svg {...TB_SVG_PROPS}><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
        </button>

        <span className={TB_SEP} aria-hidden="true" />

        {/* Lists & Indent */}
        <button type="button" disabled={sourceMode} className={`${TB_BASE} ${active.ul ? TB_ACTIVE : ""}`} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("insertUnorderedList")} title="Bullet list" aria-label="Bullet list">
          <svg {...TB_SVG_PROPS}><line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" /><circle cx="4.5" cy="6" r="1" fill="currentColor" /><circle cx="4.5" cy="12" r="1" fill="currentColor" /><circle cx="4.5" cy="18" r="1" fill="currentColor" /></svg>
        </button>
        <button type="button" disabled={sourceMode} className={`${TB_BASE} ${active.ol ? TB_ACTIVE : ""}`} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("insertOrderedList")} title="Numbered list" aria-label="Numbered list">
          <svg {...TB_SVG_PROPS}><line x1="10" y1="6" x2="20" y2="6" /><line x1="10" y1="12" x2="20" y2="12" /><line x1="10" y1="18" x2="20" y2="18" /><text x="3" y="8" fontSize="7" fill="currentColor" stroke="none" fontWeight="bold">1</text><text x="3" y="14" fontSize="7" fill="currentColor" stroke="none" fontWeight="bold">2</text><text x="3" y="20" fontSize="7" fill="currentColor" stroke="none" fontWeight="bold">3</text></svg>
        </button>
        <button type="button" disabled={sourceMode} className={TB_BASE} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("outdent")} title="Decrease indent" aria-label="Decrease indent">
          <svg {...TB_SVG_PROPS}><polyline points="7 8 3 12 7 16" /><line x1="21" y1="12" x2="11" y2="12" /><line x1="21" y1="6" x2="11" y2="6" /><line x1="21" y1="18" x2="11" y2="18" /></svg>
        </button>
        <button type="button" disabled={sourceMode} className={TB_BASE} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("indent")} title="Increase indent" aria-label="Increase indent">
          <svg {...TB_SVG_PROPS}><polyline points="3 8 7 12 3 16" /><line x1="21" y1="12" x2="11" y2="12" /><line x1="21" y1="6" x2="11" y2="6" /><line x1="21" y1="18" x2="11" y2="18" /></svg>
        </button>

        <span className={TB_SEP} aria-hidden="true" />

        {/* Insert: Link, Image, Table, HR */}
        <button
          type="button"
          disabled={sourceMode}
          className={TB_BASE}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            saveSelection();
            setModal({ type: "link", url: "" });
          }}
          title="Insert link"
          aria-label="Insert link"
        >
          <svg {...TB_SVG_PROPS}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
        </button>
        <button
          type="button"
          disabled={sourceMode}
          className={TB_BASE}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("unlink")}
          title="Remove link"
          aria-label="Remove link"
        >
          <svg {...TB_SVG_PROPS}><path d="m18.84 12.25 1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71" /><path d="m5.17 11.75-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71" /><line x1="8" y1="2" x2="8" y2="5" /><line x1="2" y1="8" x2="5" y2="8" /><line x1="16" y1="19" x2="16" y2="22" /><line x1="19" y1="16" x2="22" y2="16" /></svg>
        </button>
        <button
          type="button"
          disabled={sourceMode}
          className={TB_BASE}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => imageInputRef.current?.click()}
          title="Insert image"
          aria-label="Insert image"
        >
          <svg {...TB_SVG_PROPS}><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
        </button>

        {/* Interactive Table Grid Picker */}
        <div className="relative" ref={tablePickerRef}>
          <button
            type="button"
            disabled={sourceMode}
            className={`${TB_BASE} ${showTablePicker ? TB_ACTIVE : ""}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowTablePicker((v) => !v)}
            title="Insert table"
            aria-label="Insert table"
          >
            <svg {...TB_SVG_PROPS}><path d="M12 3v18" /><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18" /><path d="M3 15h18" /></svg>
          </button>
          {showTablePicker && (
            <div className="absolute left-0 top-10 z-30 w-44 rounded-xl border border-border-strong bg-bg-elevated p-2.5 shadow-lg">
              <div className="text-[11px] font-medium text-text-secondary mb-2">
                Insert Table ({tableHover.r} × {tableHover.c})
              </div>
              <div className="grid grid-cols-6 gap-1">
                {Array.from({ length: 36 }, (_, idx) => {
                  const r = Math.floor(idx / 6) + 1;
                  const c = (idx % 6) + 1;
                  const activeCell = r <= tableHover.r && c <= tableHover.c;
                  return (
                    <button
                      key={`${r}-${c}`}
                      type="button"
                      onMouseEnter={() => setTableHover({ r, c })}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => insertTable(r, c)}
                      aria-label={`Insert ${r} by ${c} table`}
                      className={`h-5 w-5 rounded border transition-colors ${
                        activeCell
                          ? "bg-accent/25 border-accent"
                          : "bg-bg-input border-border-base hover:border-border-strong"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          disabled={sourceMode}
          className={TB_BASE}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("insertHorizontalRule")}
          title="Horizontal divider"
          aria-label="Horizontal divider"
        >
          <svg {...TB_SVG_PROPS}><line x1="3" y1="12" x2="21" y2="12" /></svg>
        </button>

        <span className={TB_SEP} aria-hidden="true" />

        {/* Utilities: Find & Replace, Clear Format, Import, Export HTML, Source, Fullscreen, Clear */}
        <button
          type="button"
          className={`${TB_BASE} ${showFindReplace ? TB_ACTIVE : ""}`}
          onClick={() => setShowFindReplace((v) => !v)}
          title="Find & Replace (Ctrl+F)"
          aria-label="Find and replace"
        >
          <svg {...TB_SVG_PROPS}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
        </button>
        <button
          type="button"
          disabled={sourceMode}
          className={TB_BASE}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            exec("removeFormat");
            execBlock("p");
          }}
          title="Clear formatting"
          aria-label="Clear formatting"
        >
          <svg {...TB_SVG_PROPS}><path d="M4 7V4h16v3" /><path d="M5 20h6" /><path d="M13 4 8 20" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="21" y1="15" x2="15" y2="21" /></svg>
        </button>
        <button type="button" className={TB_BASE} onClick={() => fileInputRef.current?.click()} title="Import .txt, .html, or .md" aria-label="Import file">
          <svg {...TB_SVG_PROPS}><path d="M15 8h-5v5" /><path d="m9 12 6-6" /><path d="M19 13v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v1" /></svg>
        </button>
        <button type="button" className={TB_BASE} onClick={handleExportHtml} title="Download as .html" aria-label="Export HTML">
          <svg {...TB_SVG_PROPS}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
        </button>
        <button
          type="button"
          className={`${TB_BASE} gap-1 px-2 text-xs ${pageView && !sourceMode ? TB_ACTIVE : ""}`}
          onClick={() => setPageView((v) => !v)}
          disabled={sourceMode}
          title="Toggle Microsoft Word Page View (real-time A4 pagination)"
          aria-label="Toggle Page View"
        >
          <svg {...TB_SVG_PROPS} width={14} height={14}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
          <span className="hidden sm:inline">Page</span>
        </button>
        <button
          type="button"
          className={`${TB_BASE} gap-1 px-2 text-xs ${sourceMode ? TB_ACTIVE : ""}`}
          onClick={toggleSourceMode}
          title="Toggle HTML Source View (CodeMirror-style)"
          aria-label="HTML Source View"
        >
          <svg {...TB_SVG_PROPS} width={14} height={14}><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
          <span className="hidden sm:inline">HTML</span>
        </button>
        <button
          type="button"
          className={`${TB_BASE} ${fullscreen ? TB_ACTIVE : ""}`}
          onClick={() => setFullscreen((v) => !v)}
          title={fullscreen ? "Exit fullscreen (Esc)" : "Fullscreen focus mode"}
          aria-label="Toggle fullscreen"
        >
          {fullscreen ? (
            <svg {...TB_SVG_PROPS}><path d="M8 3v3a2 2 0 0 1-2 2H3" /><path d="M21 8h-3a2 2 0 0 1-2-2V3" /><path d="M3 16h3a2 2 0 0 1 2 2v3" /><path d="M16 21v-3a2 2 0 0 1 2-2h3" /></svg>
          ) : (
            <svg {...TB_SVG_PROPS}><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>
          )}
        </button>
        <button type="button" className={TB_BASE} onClick={handleClear} title="Clear document" aria-label="Clear document">
          <svg {...TB_SVG_PROPS}><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
        </button>
      </div>

      {/* ─── Find & Replace Bar ─── */}
      {showFindReplace && (
        <div className="flex flex-wrap items-center gap-2 px-3 py-2 rounded-xl bg-bg-elevated border border-border-base text-xs">
          <input
            type="text"
            value={findText}
            onChange={(e) => {
              setFindText(e.target.value);
              setFindStatus("");
            }}
            placeholder="Find text…"
            className="h-8 px-2.5 rounded-lg border border-border-strong bg-bg-input text-text-primary outline-none focus:border-accent min-w-[140px] flex-1"
          />
          <input
            type="text"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            placeholder="Replace with…"
            className="h-8 px-2.5 rounded-lg border border-border-strong bg-bg-input text-text-primary outline-none focus:border-accent min-w-[140px] flex-1"
          />
          <label className="inline-flex items-center gap-1.5 text-text-secondary cursor-pointer select-none">
            <input
              type="checkbox"
              checked={matchCase}
              onChange={(e) => setMatchCase(e.target.checked)}
              className="accent-[var(--accent)]"
            />
            Match case
          </label>
          <span className="text-text-tertiary tabular-nums">
            {findText ? `${countMatches} found` : ""}
            {findStatus ? ` · ${findStatus}` : ""}
          </span>
          <button
            type="button"
            onClick={runReplaceAll}
            disabled={!findText}
            className="h-8 px-3 rounded-lg bg-accent text-white font-semibold hover:opacity-95 disabled:opacity-40 cursor-pointer"
          >
            Replace All
          </button>
          <button
            type="button"
            onClick={() => setShowFindReplace(false)}
            className="h-8 px-2 rounded-lg text-text-secondary hover:bg-bg-hover cursor-pointer"
            aria-label="Close find and replace"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hidden file inputs */}
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
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleInsertImageFile(file);
          e.target.value = "";
        }}
      />

      {/* ─── Editor Canvas + Microsoft Word Page View + HTML Source View ─── */}
      <div
        className={`relative rounded-xl border border-border-strong bg-bg-input focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all flex flex-col ${
          fullscreen ? "flex-1 min-h-0" : ""
        }`}
      >
        {/* Visual WYSIWYG Canvas (always mounted so onEditorReady & PDF export work in Source mode too) */}
        <div
          className={`${
            sourceMode
              ? "hidden"
              : pageView
                ? `overflow-y-auto rounded-t-xl bg-[#eef1f6] dark:bg-[#0f172a]/70 p-3 sm:p-6 ${
                    fullscreen ? "flex-1 min-h-0" : "min-h-[420px] max-h-[68vh]"
                  }`
                : ""
          }`}
        >
          <div
            className={
              pageView
                ? "relative w-full max-w-[794px] mx-auto bg-white dark:bg-[#1e293b] border border-border-base/80 shadow-[0_4px_24px_rgba(0,0,0,0.08)] rounded-sm"
                : "relative"
            }
          >
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              role="textbox"
              aria-multiline="true"
              aria-label="Rich text document"
              id={editorId}
              spellCheck
              data-empty="true"
              onInput={scheduleSyncStats}
              onPaste={handlePaste}
              onBlur={saveSelection}
              className={`rte-content text-[15px] leading-relaxed text-text-primary outline-none ${
                pageView
                  ? "min-h-[480px] px-7 sm:px-14 py-8 sm:py-12"
                  : `overflow-y-auto rounded-t-xl px-5 py-4 ${
                      fullscreen ? "flex-1 min-h-0" : "min-h-[380px] max-h-[65vh]"
                    }`
              }`}
            />

            {/* Real-time Word page break indicators (non-intrusive overlay, never affects PDF DOM) */}
            {pageView && pageCount > 1 && (
              <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0 overflow-hidden" aria-hidden="true">
                {Array.from({ length: pageCount - 1 }, (_, i) => (
                  <div
                    key={i}
                    style={{ top: `${(i + 1) * PAGE_HEIGHT_PX}px` }}
                    className="absolute inset-x-0 border-t border-dashed border-accent/40 flex justify-end pr-3"
                  >
                    <span className="-mt-2.5 px-2 py-0.5 rounded-full bg-bg-elevated border border-border-base text-[10px] font-semibold text-text-tertiary shadow-xs">
                      Page {i + 2}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {isEmpty && (
              <div
                className={`pointer-events-none absolute text-[15px] text-text-tertiary select-none ${
                  pageView
                    ? "top-8 sm:top-12 left-7 sm:left-14 right-7 sm:right-14"
                    : "top-4 left-5 right-5"
                }`}
              >
                Start typing, or paste text — <span className="font-semibold">formatting is kept</span> (bold, colors, tables, lists, links, all languages…)
              </div>
            )}
          </div>
        </div>

        {/* CodeMirror-style Line-Numbered HTML Source Editor */}
        {sourceMode && (
          <div
            className={`flex items-stretch rounded-t-xl overflow-y-auto bg-[#0f172a] text-[#e2e8f0] font-mono text-[13px] leading-6 ${
              fullscreen ? "flex-1 min-h-0" : "min-h-[380px] max-h-[65vh]"
            }`}
          >
            <div
              aria-hidden="true"
              className="select-none py-4 px-3 text-right text-[#64748b] bg-[#0b1120] border-r border-[#1e293b] shrink-0"
            >
              {Array.from({ length: sourceLineCount }, (_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <textarea
              value={sourceHtml}
              onChange={(e) => handleSourceChange(e.target.value)}
              rows={sourceLineCount}
              spellCheck={false}
              aria-label="HTML source code"
              placeholder="<p>Write or edit HTML source directly…</p>"
              style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Noto Sans Devanagari', monospace" }}
              className="flex-1 w-full min-h-[380px] resize-none bg-transparent p-4 text-[#e2e8f0] outline-none overflow-x-auto overflow-y-hidden leading-6"
            />
          </div>
        )}

        {/* Status Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-t border-border-base text-[11px] text-text-tertiary">
          <div className="flex items-center gap-3">
            <span>
              {pageCount} page{pageCount === 1 ? "" : "s"} · {wordCount.toLocaleString()} words · {charCount.toLocaleString()} chars · ~{readingMinutes} min read
            </span>
            {sourceMode && (
              <span className="px-1.5 py-0.5 rounded bg-accent-subtle text-accent font-semibold">
                HTML Source
              </span>
            )}
          </div>
          <label
            className="flex items-center gap-1.5 cursor-pointer select-none"
            title="When on, pasted text keeps its fonts, colors, and layout. Turn off to paste as plain text."
          >
            <input
              type="checkbox"
              checked={keepFormatting}
              onChange={(e) => onKeepFormattingChange(e.target.checked)}
              className="w-3.5 h-3.5 accent-[var(--accent)] cursor-pointer"
            />
            Keep source formatting on paste
          </label>
        </div>
      </div>

      {/* ─── Custom Popup Modal ─── */}
      {modal && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4"
          onClick={() => setModal(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rte-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-border-base bg-bg-elevated p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  modal.type === "clear"
                    ? "bg-danger/10 text-danger"
                    : "bg-accent-subtle text-accent"
                }`}
              >
                {modal.type === "clear" ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                ) : modal.type === "import" ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 8h-5v5" />
                    <path d="m9 12 6-6" />
                    <path d="M19 13v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v1" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 id="rte-modal-title" className="text-[15px] font-bold text-text-primary">
                  {modal.type === "clear"
                    ? "Clear whole document?"
                    : modal.type === "import"
                      ? "Replace current document?"
                      : "Insert link"}
                </h3>
                <p className="text-[13px] text-text-secondary mt-1 leading-relaxed">
                  {modal.type === "clear"
                    ? "This will remove all text, tables, and formatting from the editor."
                    : modal.type === "import"
                      ? `Importing "${modal.file.name}" will replace everything currently in the editor.`
                      : "Enter the destination URL for the selected text."}
                </p>
              </div>
            </div>

            {modal.type === "link" && (
              <input
                type="url"
                autoFocus
                value={modal.url}
                onChange={(e) => setModal({ type: "link", url: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleModalConfirm();
                  }
                }}
                placeholder="https://example.com"
                className="w-full h-10 px-3 rounded-xl border border-border-strong bg-bg-input text-sm text-text-primary outline-none focus:border-accent"
              />
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="h-9 px-4 rounded-xl border border-border-base bg-bg-input text-xs font-semibold text-text-secondary hover:bg-bg-hover cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                autoFocus={modal.type !== "link"}
                onClick={handleModalConfirm}
                disabled={modal.type === "link" && !modal.url.trim()}
                className={`h-9 px-4 rounded-xl text-xs font-semibold text-white cursor-pointer disabled:opacity-40 ${
                  modal.type === "clear"
                    ? "bg-danger hover:opacity-95"
                    : "bg-accent hover:opacity-95"
                }`}
              >
                {modal.type === "clear"
                  ? "Clear document"
                  : modal.type === "import"
                    ? "Replace & Import"
                    : "Insert link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
