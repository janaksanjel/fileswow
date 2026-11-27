"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Peer, { type DataConnection } from "peerjs";
import { USER_NAME_STORAGE_KEY } from "@/components/onboarding-modal";

interface SharedItem {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface SyncPayload {
  kind: "content" | "clear" | "file" | "typing";
  html?: string;
  text?: string;
  senderName?: string;
  file?: {
    id: string;
    name: string;
    size: number;
    type: string;
    buffer: ArrayBuffer;
  };
}

const MAX_LAN_SLOTS = 6;
const SYNC_DRAFT_STORAGE_KEY = "fileswow-quick-sync-draft-v1";

function saveDraft(nextHtml: string, nextText: string) {
  try {
    if (!nextText.trim() && !nextHtml.trim()) {
      window.localStorage.removeItem(SYNC_DRAFT_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(
      SYNC_DRAFT_STORAGE_KEY,
      JSON.stringify({ html: nextHtml, text: nextText })
    );
  } catch {
    // Ignore storage quota or private-mode errors
  }
}

function clearDraft() {
  try {
    window.localStorage.removeItem(SYNC_DRAFT_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

function hashNetworkKey(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash).toString(36);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function SameNetSync() {
  const [text, setText] = useState("");
  const [html, setHtml] = useState("");
  const [sharedFiles, setSharedFiles] = useState<SharedItem[]>([]);
  const [copied, setCopied] = useState(false);
  const [showUrls, setShowUrls] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [lastSyncedLabel, setLastSyncedLabel] = useState("Listening on your network");
  const [connectedPeers, setConnectedPeers] = useState(0);
  const [networkLabel, setNetworkLabel] = useState("Same Wi-Fi / LAN");
  const [reconnectTick, setReconnectTick] = useState(0);
  const [remoteTypingBy, setRemoteTypingBy] = useState<string | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const peerRef = useRef<Peer | null>(null);
  const connsRef = useRef<DataConnection[]>([]);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const htmlRef = useRef(html);
  const textRef = useRef(text);
  const typingClearTimerRef = useRef<number | null>(null);
  const lastTypingSentRef = useRef<number>(0);

  useEffect(() => {
    htmlRef.current = html;
    textRef.current = text;
  }, [html, text]);

  // Restore saved draft on mount so page reloads never wipe text until cleared
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SYNC_DRAFT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { html?: string; text?: string };
      const savedHtml = typeof parsed.html === "string" ? parsed.html : "";
      const savedText = typeof parsed.text === "string" ? parsed.text : "";
      if (!savedHtml && !savedText) return;
      htmlRef.current = savedHtml;
      textRef.current = savedText;
      if (editorRef.current) {
        editorRef.current.innerHTML = savedHtml || savedText;
      }
      queueMicrotask(() => {
        setHtml(savedHtml);
        setText(savedText);
      });
    } catch {
      // Ignore malformed storage
    }
  }, []);

  useEffect(() => {
    return () => {
      if (typingClearTimerRef.current !== null) {
        window.clearTimeout(typingClearTimerRef.current);
      }
    };
  }, []);

  const applyRemoteContent = useCallback((nextHtml: string, nextText: string) => {
    setHtml(nextHtml);
    setText(nextText);
    if (editorRef.current && editorRef.current.innerHTML !== nextHtml) {
      editorRef.current.innerHTML = nextHtml;
    }
    if (!nextHtml.trim() && !nextText.trim()) {
      clearDraft();
    } else {
      saveDraft(nextHtml, nextText);
    }
  }, []);

  const showRemoteTyping = useCallback((senderName?: string) => {
    setRemoteTypingBy(senderName?.trim() || "Someone on your network");
    if (typingClearTimerRef.current !== null) {
      window.clearTimeout(typingClearTimerRef.current);
    }
    typingClearTimerRef.current = window.setTimeout(() => {
      setRemoteTypingBy(null);
    }, 1800);
  }, []);

  // Extract URLs from text & html
  const extractedUrls = useMemo(() => {
    const combined = `${text} ${html}`;
    const matches = combined.match(/https?:\/\/[^\s<>"']+/gi) || [];
    return Array.from(new Set(matches));
  }, [text, html]);

  const broadcastToPeers = useCallback((payload: SyncPayload) => {
    for (const conn of connsRef.current) {
      if (conn.open) {
        try {
          conn.send(payload);
        } catch {
          // Ignore closed channel
        }
      }
    }
    if (payload.kind !== "file") {
      try {
        channelRef.current?.postMessage(payload);
      } catch {
        // Ignore broadcast error
      }
    }
  }, []);

  const attachConnection = useCallback((conn: DataConnection) => {
    if (connsRef.current.some((c) => c.peer === conn.peer && c.open)) return;
    connsRef.current = [...connsRef.current.filter((c) => c.peer !== conn.peer), conn];

    conn.on("open", () => {
      setConnectedPeers(connsRef.current.filter((c) => c.open).length);
      setLastSyncedLabel("Auto-connected");
      if (htmlRef.current || textRef.current) {
        conn.send({
          kind: "content",
          html: htmlRef.current,
          text: textRef.current,
        } satisfies SyncPayload);
      }
    });

    conn.on("data", (raw) => {
      const data = raw as SyncPayload;
      if (!data || typeof data !== "object") return;
      if (data.kind === "typing") {
        showRemoteTyping(data.senderName);
      } else if (data.kind === "content") {
        applyRemoteContent(data.html ?? "", data.text ?? "");
        setRemoteTypingBy(null);
        setLastSyncedLabel("just now");
      } else if (data.kind === "clear") {
        applyRemoteContent("", "");
        setSharedFiles([]);
        setRemoteTypingBy(null);
        setLastSyncedLabel("just now");
      } else if (data.kind === "file" && data.file) {
        const blob = new Blob([data.file.buffer], {
          type: data.file.type || "application/octet-stream",
        });
        const url = URL.createObjectURL(blob);
        setSharedFiles((prev) => [
          ...prev,
          {
            id: data.file!.id,
            name: data.file!.name,
            size: data.file!.size,
            type: data.file!.type,
            url,
          },
        ]);
        setLastSyncedLabel("just now");
      }
    });

    conn.on("close", () => {
      connsRef.current = connsRef.current.filter((c) => c !== conn);
      setConnectedPeers(connsRef.current.filter((c) => c.open).length);
    });
  }, [applyRemoteContent, showRemoteTyping]);

  // Zero-click Same-Network Auto-Connect (BroadcastChannel + IP-grouped PeerJS mesh)
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      try {
        const nav = navigator as Navigator & {
          connection?: { type?: string; effectiveType?: string };
        };
        const connType = nav.connection?.type;
        if (connType === "wifi") setNetworkLabel("Same Wi-Fi");
        else if (connType === "ethernet") setNetworkLabel("Same Ethernet");
        else if (connType === "cellular") setNetworkLabel("Same Network");
        else setNetworkLabel("Same Wi-Fi / LAN");
      } catch {
        // NetworkInformation API unsupported
      }
    });

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("fileswow-same-net-sync");
      channelRef.current = channel;
      channel.onmessage = (e: MessageEvent<SyncPayload>) => {
        if (e.data?.kind === "typing") {
          showRemoteTyping(e.data.senderName);
        } else if (e.data?.kind === "content") {
          applyRemoteContent(e.data.html ?? "", e.data.text ?? "");
          setRemoteTypingBy(null);
          setLastSyncedLabel("just now");
        } else if (e.data?.kind === "clear") {
          applyRemoteContent("", "");
          setSharedFiles([]);
          setRemoteTypingBy(null);
          setLastSyncedLabel("just now");
        }
      };
    } catch {
      // BroadcastChannel unsupported
    }

    const startNetworkMesh = async () => {
      let networkKey = "local";
      try {
        const res = await fetch("https://api.ipify.org?format=json", {
          cache: "no-store",
        });
        if (res.ok) {
          const data = (await res.json()) as { ip?: string };
          if (data.ip) {
            networkKey = hashNetworkKey(data.ip);
          }
        }
      } catch {
        // Fallback to shared local key if offline or blocked
      }

      if (!active) return;

      const trySlot = (slot: number) => {
        if (!active || slot >= MAX_LAN_SLOTS) return;
        const myId = `fw-lan-${networkKey}-${slot}`;
        let peer: Peer;
        try {
          peer = new Peer(myId);
        } catch {
          return;
        }
        peerRef.current = peer;

        peer.on("open", () => {
          if (!active) {
            peer.destroy();
            return;
          }
          for (let other = 0; other < MAX_LAN_SLOTS; other++) {
            if (other === slot) continue;
            try {
              const conn = peer.connect(`fw-lan-${networkKey}-${other}`, {
                reliable: true,
              });
              attachConnection(conn);
            } catch {
              // Ignore unoccupied slot
            }
          }
        });

        peer.on("connection", (conn) => attachConnection(conn));

        peer.on("error", (err) => {
          if (err.type === "unavailable-id") {
            peer.destroy();
            trySlot(slot + 1);
          }
        });
      };

      trySlot(0);
    };

    void startNetworkMesh();

    return () => {
      active = false;
      channel?.close();
      channelRef.current = null;
      connsRef.current.forEach((c) => c.close());
      connsRef.current = [];
      setConnectedPeers(0);
      peerRef.current?.destroy();
      peerRef.current = null;
    };
  }, [applyRemoteContent, attachConnection, reconnectTick, showRemoteTyping]);

  const emitEditorChange = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const nextHtml = el.innerHTML;
    const nextText = el.innerText;
    setHtml(nextHtml);
    setText(nextText);
    saveDraft(nextHtml, nextText);
    setLastSyncedLabel("just now");

    const now = Date.now();
    if (now - lastTypingSentRef.current > 350) {
      lastTypingSentRef.current = now;
      let senderName: string | undefined;
      try {
        senderName = window.localStorage.getItem(USER_NAME_STORAGE_KEY) || undefined;
      } catch {
        // Ignore storage errors
      }
      broadcastToPeers({ kind: "typing", senderName });
    }
    broadcastToPeers({ kind: "content", html: nextHtml, text: nextText });
  }, [broadcastToPeers]);

  const execFormat = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    emitEditorChange();
  };

  // Preserves exact HTML + plain text formatting when copying
  const handleCopy = async () => {
    if (!text.trim() && !html.trim()) return;
    try {
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard.write) {
        const htmlBlob = new Blob([html || text], { type: "text/html" });
        const textBlob = new Blob([text], { type: "text/plain" });
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": htmlBlob,
            "text/plain": textBlob,
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      } catch {
        // Clipboard denied
      }
    }
  };

  const handleDownloadText = () => {
    if (!text.trim() && !html.trim()) return;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fileswow-note.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    applyRemoteContent("", "");
    sharedFiles.forEach((f) => URL.revokeObjectURL(f.url));
    setSharedFiles([]);
    setLastSyncedLabel("Cleared");
    broadcastToPeers({ kind: "clear" });
  };

  const addAndShareFiles = useCallback(
    async (incoming: FileList | File[]) => {
      const list = Array.from(incoming);
      if (list.length === 0) return;

      for (const file of list) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const url = URL.createObjectURL(file);
        setSharedFiles((prev) => [
          ...prev,
          { id, name: file.name, size: file.size, type: file.type, url },
        ]);
        try {
          const buffer = await file.arrayBuffer();
          broadcastToPeers({
            kind: "file",
            file: { id, name: file.name, size: file.size, type: file.type, buffer },
          });
        } catch {
          // Ignore buffer error
        }
      }
      setLastSyncedLabel("just now");
      setUploadOpen(false);
    },
    [broadcastToPeers]
  );

  // Ctrl+V file paste inside Quick Sync
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.length > 0) {
        e.preventDefault();
        void addAndShareFiles(files);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [addAndShareFiles]);

  const hasContent = Boolean(text.trim() || html.replace(/<br\s*\/?>/gi, "").trim());

  return (
    <div>
    <section className="mb-8 sm:mb-10 rounded-2xl border border-border-base bg-bg-surface shadow-[var(--elevation-sm)] overflow-hidden">
      {/* Header + Toolbar */}
      <div className="px-3.5 sm:px-6 py-3.5 sm:py-4 border-b border-border-base bg-bg-warm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-text-primary">
            <span className="w-2.5 h-2.5 rounded-full bg-success" aria-hidden="true" />
            Same-Network Auto Sync
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-bg-surface border border-border-base text-[11px] font-medium text-text-secondary">
            {networkLabel}
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
              connectedPeers > 0
                ? "bg-success/15 text-success"
                : "bg-bg-surface border border-border-base text-text-secondary"
            }`}
          >
            {connectedPeers + 1} user{connectedPeers + 1 > 1 ? "s" : ""} online
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!hasContent}
            className="btn-secondary px-3 py-1.5 text-[12px] font-semibold disabled:opacity-40 inline-flex items-center gap-1.5 cursor-pointer"
            title="Copy with exact formatting preserved"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            <span>{copied ? "Copied!" : "Copy"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowUrls((v) => !v)}
            className={`px-3 py-1.5 rounded-xl border text-[12px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              showUrls
                ? "bg-accent text-text-on-accent border-accent"
                : "bg-bg-surface hover:bg-bg-elevated text-text-primary border-border-base"
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span>URLs{extractedUrls.length > 0 ? ` (${extractedUrls.length})` : ""}</span>
          </button>

          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="btn-secondary px-3 py-1.5 text-[12px] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>Upload</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadText}
            disabled={!hasContent}
            className="btn-secondary px-3 py-1.5 text-[12px] font-semibold disabled:opacity-40 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Download</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setReconnectTick((t) => t + 1);
              setLastSyncedLabel("Re-scanning network…");
            }}
            title="Re-scan same network devices"
            aria-label="Re-scan network"
            className="w-8 h-8 rounded-xl border border-border-base bg-bg-surface hover:bg-bg-elevated text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-3.5 sm:p-6 space-y-3.5">
        {/* Real-time Typing Indicator */}
        {remoteTypingBy && (
          <div
            role="status"
            aria-live="polite"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-subtle border border-accent/25 text-[12px] font-medium text-accent-ink"
          >
            <span className="flex items-center gap-1" aria-hidden="true">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
            <span>{remoteTypingBy} is typing…</span>
          </div>
        )}

        {/* Pro Rich-Text Editor Frame (keeps exact pasted/copied formatting) */}
        <div className="rounded-2xl border-2 border-accent/35 focus-within:border-accent bg-bg-surface overflow-hidden transition-colors">
          {/* Formatting Toolbar */}
          <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-border-base bg-bg-elevated/45">
            <button type="button" onClick={() => execFormat("bold")} title="Bold" className="px-2 py-1 rounded-lg text-[12px] font-bold text-text-secondary hover:text-text-primary hover:bg-bg-surface cursor-pointer">
              B
            </button>
            <button type="button" onClick={() => execFormat("italic")} title="Italic" className="px-2 py-1 rounded-lg text-[12px] italic font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-surface cursor-pointer">
              I
            </button>
            <button type="button" onClick={() => execFormat("underline")} title="Underline" className="px-2 py-1 rounded-lg text-[12px] underline font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-surface cursor-pointer">
              U
            </button>
            <button type="button" onClick={() => execFormat("strikeThrough")} title="Strikethrough" className="px-2 py-1 rounded-lg text-[12px] line-through font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-surface cursor-pointer">
              S
            </button>
            <span className="w-px h-4 bg-border-base mx-1" aria-hidden="true" />
            <button type="button" onClick={() => execFormat("formatBlock", "<h2>")} title="Heading" className="px-2 py-1 rounded-lg text-[11.5px] font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-surface cursor-pointer">
              H2
            </button>
            <button type="button" onClick={() => execFormat("insertUnorderedList")} title="Bullet list" className="px-2 py-1 rounded-lg text-[11.5px] font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-surface cursor-pointer">
              • List
            </button>
            <button type="button" onClick={() => execFormat("insertOrderedList")} title="Numbered list" className="px-2 py-1 rounded-lg text-[11.5px] font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-surface cursor-pointer">
              1. List
            </button>
            <button type="button" onClick={() => execFormat("removeFormat")} title="Clear formatting" className="ml-auto px-2 py-1 rounded-lg text-[11px] font-medium text-text-tertiary hover:text-text-primary hover:bg-bg-surface cursor-pointer">
              Clear format
            </button>
          </div>

          {/* Rich-text editable surface */}
          <div className="relative">
            {!hasContent && (
              <div className="pointer-events-none absolute top-4 left-4 right-4 text-[14.5px] text-text-tertiary">
                Start typing or paste formatted text, code, links, or Ctrl+V files — formatting is preserved when copied…
              </div>
            )}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={emitEditorChange}
              aria-label="Same-network rich text editor"
              className="rte-content min-h-[220px] sm:min-h-[320px] p-3.5 sm:p-4 text-[14px] sm:text-[14.5px] text-text-primary leading-relaxed overflow-y-auto break-words"
            />
          </div>
        </div>

        {/* Extracted URLs panel */}
        {showUrls && (
          <div className="p-3.5 rounded-xl bg-bg-elevated/60 border border-border-base space-y-2">
            <h3 className="text-[12px] font-semibold uppercase tracking-wider text-text-tertiary">
              Detected URLs ({extractedUrls.length})
            </h3>
            {extractedUrls.length === 0 ? (
              <p className="text-[12.5px] text-text-secondary">
                No URLs found in the text above yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {extractedUrls.map((u) => (
                  <a
                    key={u}
                    href={u}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 rounded-lg bg-bg-surface border border-border-base hover:border-accent text-[12.5px] text-accent-ink font-medium truncate max-w-full"
                  >
                    {u}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Shared Files List */}
        {sharedFiles.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-[12px] font-semibold uppercase tracking-wider text-text-tertiary">
              Shared Files ({sharedFiles.length})
            </h3>
            <ul className="divide-y divide-border-base rounded-xl border border-border-base bg-bg-surface overflow-hidden">
              {sharedFiles.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-text-primary truncate">{f.name}</p>
                    <p className="text-[11px] text-text-tertiary">{formatSize(f.size)}</p>
                  </div>
                  <a
                    href={f.url}
                    download={f.name}
                    className="btn-secondary px-3 py-1.5 text-[12px] font-semibold shrink-0"
                  >
                    Download
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Bottom Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11.5px] sm:text-[12px] text-text-tertiary">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success" aria-hidden="true" />
            {lastSyncedLabel} · Ephemeral (zero cloud retention)
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="font-semibold text-text-secondary hover:text-danger transition-colors cursor-pointer"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Upload Modal */}
      {uploadOpen && (
        <div className="fixed inset-0 z-[105] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-xs"
            onClick={() => setUploadOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Upload files for quick sync"
            className="relative z-10 w-full max-w-md rounded-2xl bg-bg-surface border border-border-base shadow-[var(--elevation-xl)] p-5 space-y-4 animate-fade-in-up"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-semibold text-text-primary">Upload files</h3>
              <button
                type="button"
                onClick={() => setUploadOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-bg-elevated cursor-pointer"
                aria-label="Close upload modal"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => {
                if (e.target.files?.length) void addAndShareFiles(e.target.files);
              }}
              className="sr-only"
            />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer?.files?.length) void addAndShareFiles(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`rounded-2xl border-2 border-dashed p-5 sm:p-8 text-center transition-colors cursor-pointer ${
                dragOver
                  ? "border-accent bg-accent-subtle/40"
                  : "border-border-strong hover:border-accent/60 bg-bg-elevated/40"
              }`}
            >
              <p className="text-[14px] font-medium text-text-primary">
                Drop files here or <span className="underline text-accent-ink">browse</span>
              </p>
              <p className="text-[12px] text-text-tertiary mt-1">
                Direct peer-to-peer transfer · Zero server storage
              </p>
            </div>

            <div className="flex items-center justify-between text-[11.5px] text-text-tertiary">
              <span>Instant same-network sync · Zero server storage</span>
              <span>
                <kbd>Ctrl+V</kbd> to paste
              </span>
            </div>
          </div>
        </div>
      )}
    </section>

    {/* Trust row */}
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="flex items-start gap-2.5 p-3.5 bg-bg-surface border border-border-base rounded-xl">
        <span className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </span>
        <div>
          <p className="text-[12.5px] font-bold text-text-primary">Zero cloud storage</p>
          <p className="text-[11.5px] text-text-secondary leading-snug mt-0.5">Nothing is stored on any server — notes &amp; files stay ephemeral.</p>
        </div>
      </div>
      <div className="flex items-start gap-2.5 p-3.5 bg-bg-surface border border-border-base rounded-xl">
        <span className="w-8 h-8 rounded-lg bg-accent-subtle flex items-center justify-center shrink-0">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.55a11 11 0 0 1 14.08 0" />
            <path d="M1.42 9a16 16 0 0 1 21.16 0" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        </span>
        <div>
          <p className="text-[12.5px] font-bold text-text-primary">Auto-connects on Wi-Fi</p>
          <p className="text-[11.5px] text-text-secondary leading-snug mt-0.5">Devices on the same network pair automatically without codes.</p>
        </div>
      </div>
      <div className="flex items-start gap-2.5 p-3.5 bg-bg-surface border border-border-base rounded-xl">
        <span className="w-8 h-8 rounded-lg bg-warning/[0.12] flex items-center justify-center shrink-0">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </span>
        <div>
          <p className="text-[12.5px] font-bold text-text-primary">Format-preserving copy</p>
          <p className="text-[11.5px] text-text-secondary leading-snug mt-0.5">Keeps headings, bold, lists, and links intact when copied.</p>
        </div>
      </div>
    </section>

    {/* How it works — 3 steps */}
    <section aria-labelledby="sync-how-heading" className="mt-12">
      <h2 id="sync-how-heading" className="heading-md text-text-primary mb-4">
        How same-network quick sync works — 3 steps
      </h2>
      <ol className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { t: "Open on both devices", d: "Visit fileswow.com/transfer on your phone, tablet, or PC connected to the same Wi-Fi network." },
          { t: "Type, paste, or drop files", d: "Type or paste formatted text, URLs, or files (Ctrl+V) into the live editor — peers see updates in real time." },
          { t: "Copy or download", d: "Click Copy to keep exact rich-text formatting, open detected URLs, or download shared files directly." },
        ].map((step, i) => (
          <li key={i} className="p-4 bg-bg-surface border border-border-base rounded-xl">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-accent-subtle text-accent text-[12px] font-extrabold mb-2.5">{i + 1}</span>
            <p className="text-[13px] font-bold text-text-primary">{step.t}</p>
            <p className="text-[12px] text-text-secondary leading-snug mt-1">{step.d}</p>
          </li>
        ))}
      </ol>
    </section>

    {/* Editorial SEO section */}
    <section aria-labelledby="sync-about-heading" className="mt-10">
      <h2 id="sync-about-heading" className="heading-md text-text-primary mb-4">
        Instant same-network clipboard &amp; file sharing without sign-up
      </h2>
      <div className="space-y-3 body-md text-text-secondary leading-relaxed">
        <p>
          FilesWow Quick Sync lets you share formatted text, links, code snippets, and files across devices on the{" "}
          <strong className="text-text-primary">same Wi-Fi or office network</strong> without installing an app or creating an account.
          Open the tab on two devices and they connect automatically over an encrypted peer-to-peer WebRTC channel.
        </p>
        <p>
          Unlike cloud pasteboards that store your notes on remote servers for days, Quick Sync keeps everything{" "}
          <strong className="text-text-primary">ephemeral and private</strong>. Rich-text formatting (bold, headings, bullet lists, and
          hyperlinks) stays intact when synced and copied, and detected URLs can be launched in one click.
        </p>
      </div>
    </section>

    {/* FAQ */}
    <section className="mt-12">
      <h2 className="heading-md text-text-primary mb-4">FAQ</h2>
      <div className="space-y-2.5">
        {[
          { q: "Do I need to enter a code or click Connect?", a: "No. Devices sharing the same public Wi-Fi/network automatically discover and connect to each other as soon as you open Quick Sync." },
          { q: "Is my text or file stored on any server?", a: "No. Nothing is ever stored in the cloud or on any server. Data flows directly between open browser tabs and devices and disappears when cleared or closed." },
          { q: "Does Copy keep my text formatting?", a: "Yes. Clicking Copy writes both rich HTML and plain text to your clipboard so headings, bold text, lists, and links stay intact when pasted." },
          { q: "Can I see when the other device is typing?", a: "Yes. A real-time typing indicator appears automatically above the editor whenever a connected device on your network is typing." },
        ].map((item, i) => (
          <details
            key={i}
            className="group bg-bg-surface border border-border-base rounded-xl px-4 sm:px-5 [&_summary::-webkit-details-marker]:hidden"
            open={i === 0}
          >
            <summary className="flex items-center justify-between gap-3 py-3.5 cursor-pointer list-none select-none">
              <h3 className="text-[13.5px] font-semibold text-text-primary">{item.q}</h3>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary shrink-0 transition-transform duration-200 group-open:rotate-180">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </summary>
            <p className="body-md text-text-secondary leading-relaxed pb-4 -mt-1">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
    </div>
  );
}
