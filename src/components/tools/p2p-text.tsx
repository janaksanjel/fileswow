"use client";

// P2P Chat — encrypted WebRTC chat between two devices.
//
// A 4-character room code IS the PeerJS peer ID. The free PeerJS cloud broker
// (0.peerjs.com) only exchanges the one-time WebRTC handshake (SDP/ICE) that
// lets the two browsers find each other. After that, every message and file
// flows directly between the two devices over an encrypted (DTLS) data
// channel — the broker never sees content. No account, no API key, no uploads.

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import Peer, { type DataConnection } from "peerjs";

type Phase = "home" | "host" | "join" | "chat";

interface ChatMessage {
  id: number;
  from: "self" | "peer" | "system";
  kind: "text" | "file" | "system";
  text?: string;
  file?: FileMsg;
  ts: number;
  /** True once the peer's app acknowledged receiving this text message. */
  read?: boolean;
}

interface FileMsg {
  id: number;
  name: string;
  size: number;
  mime: string;
  /** 0..1 — 1 means fully transferred. */
  progress: number;
  done: boolean;
  /** Object URL — own files (from the picker) or assembled peer files. */
  url?: string;
  failed?: boolean;
}

// Wire protocol — JSON envelopes over the data connection:
//   msg        text message, chunked by transfer id (id/i/n), `m` = local message id
//   typing     typing indicator on/off
//   read       read receipt for a text message id
//   file-meta  announces an incoming file (then raw binary frames follow)
// Binary frames carry file chunks: [4-byte big-endian file id][chunk bytes].
interface MsgEnvelope {
  t: "msg";
  m: number;
  id: number;
  i: number;
  n: number;
  d: string;
}

interface TypingEnvelope {
  t: "typing";
  on: boolean;
}

interface ReadEnvelope {
  t: "read";
  m: number;
}

interface FileMetaEnvelope {
  t: "file-meta";
  id: number;
  name: string;
  size: number;
  mime: string;
  n: number;
}

type WireEnvelope = MsgEnvelope | TypingEnvelope | ReadEnvelope | FileMetaEnvelope;

const CODE_LENGTH = 4;
// Unambiguous alphabet — no 0/O or 1/I that people mix up when reading a code aloud.
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// Public ICE servers: STUN for direct connections, plus a free TURN relay as a
// last resort so the link works behind strict firewalls too.
const ICE_SERVERS: RTCIceServer[] = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  { urls: "stun:stun.cloudflare.com:3478" },
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

// Chunk size in code units — well under the per-message limits of WebRTC
// data channels even after JSON encoding.
const CHUNK_SIZE = 16 * 1024;
const MAX_TEXT_LENGTH = 200_000; // chars per message
const FILE_CHUNK_SIZE = 64 * 1024; // bytes per file chunk
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB per file
const JOIN_TIMEOUT_MS = 25_000;
const TYPING_IDLE_MS = 2_500; // how long after typing we tell the peer we stopped
const PEER_TYPING_TIMEOUT_MS = 4_500; // safety: drop a stuck "typing" flag

// Reload survival: the room code + message history are kept in sessionStorage so
// an F5 keeps the chat alive. The host re-registers its room code on load and the
// joiner auto-reconnects whenever the link drops unexpectedly.
const SESSION_KEY = "p2p-chat-session-v1";
const MAX_PERSISTED_MESSAGES = 300;
const MAX_RECONNECT_TRIES = 10;
const RECONNECT_DELAY_MS = 2_000;
const RECONNECT_TIMEOUT_MS = 8_000;
const PREFERRED_CODE_ATTEMPTS = 4; // host: retry the saved code before rolling a fresh one
const PREFERRED_CODE_RETRY_DELAY_MS = 700;

const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

// Subtle dotted backdrop behind the message list (WhatsApp-style chat bg).
const CHAT_BG_STYLE: React.CSSProperties = {
  backgroundImage:
    "radial-gradient(color-mix(in srgb, var(--text-tertiary) 16%, transparent) 1px, transparent 1px)",
  backgroundSize: "18px 18px",
};

function generateCode(): string {
  const buf = new Uint32Array(CODE_LENGTH);
  crypto.getRandomValues(buf);
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) out += CODE_CHARS[buf[i] % CODE_CHARS.length];
  return out;
}

function normalizeCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, CODE_LENGTH);
}

interface SavedSession {
  role: "host" | "join";
  code: string;
  messages: ChatMessage[];
}

// Object URLs die with the page — drop them so a reloaded session never
// references a stale blob. Keep only well-formed messages, newest last.
function sanitizeMessages(list: unknown): ChatMessage[] {
  if (!Array.isArray(list)) return [];
  const clean = list.filter((m): m is ChatMessage => {
    if (!m || typeof m !== "object") return false;
    const x = m as ChatMessage;
    return (
      typeof x.id === "number" &&
      typeof x.ts === "number" &&
      (x.from === "self" || x.from === "peer" || x.from === "system") &&
      (x.kind === "text" || x.kind === "file" || x.kind === "system") &&
      (x.kind !== "text" || typeof x.text === "string")
    );
  });
  return clean
    .map((m) => ({ ...m, file: m.file ? { ...m.file, url: undefined } : undefined }))
    .slice(-MAX_PERSISTED_MESSAGES);
}

function loadSession(): SavedSession | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<SavedSession>;
    if (
      data &&
      (data.role === "host" || data.role === "join") &&
      typeof data.code === "string" &&
      data.code.length === CODE_LENGTH &&
      Array.isArray(data.messages)
    ) {
      return { role: data.role, code: data.code, messages: sanitizeMessages(data.messages) };
    }
  } catch {
    /* corrupted or blocked storage */
  }
  return null;
}

function saveSession(role: "host" | "join", code: string, messages: ChatMessage[]) {
  try {
    const trimmed = sanitizeMessages(messages);
    let raw = JSON.stringify({ role, code, messages: trimmed } satisfies SavedSession);
    // Very long messages can blow the ~5 MB sessionStorage quota — shrink progressively.
    if (raw.length > 3_500_000) {
      raw = JSON.stringify({ role, code, messages: trimmed.slice(-100) } satisfies SavedSession);
    }
    if (raw.length > 3_500_000) {
      raw = JSON.stringify({ role, code, messages: trimmed.slice(-20) } satisfies SavedSession);
    }
    window.sessionStorage.setItem(SESSION_KEY, raw);
  } catch {
    // Quota exceeded or storage blocked — the chat keeps working, it just won't
    // survive a reload in this browser.
  }
}

function clearSession() {
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* noop */
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes;
  let i = -1;
  do {
    value /= 1024;
    i++;
  } while (value >= 1024 && i < units.length - 1);
  return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const EMOJIS: string[] = [
  // Faces
  "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "😊", "😇", "🥰", "😍", "🤩", "😘", "😋",
  "😜", "🤪", "😎", "🤓", "🧐", "😏", "😒", "😌", "😔", "😪", "😴", "🤤", "😢", "😭", "😤", "😡",
  "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶",
  "😐", "😬", "🙄", "😯", "😲", "🥺", "😦", "😵", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑",
  "🥹", "🫠", "🫡", "🫢", "😈", "👿", "🤡", "💩", "👻", "💀", "☠️", "🤖", "👽",
  // Gestures
  "👍", "👎", "👌", "🤌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "👋", "🤚",
  "🖐️", "✋", "🖖", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "💪", "✍️", "💅", "🤳", "🫶", "🫰", "🫱",
  // Hearts
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️🔥", "❤️🩹", "💕", "💞", "💓", "💗",
  "💖", "💘", "💝", "💟", "💌",
  // Symbols & celebration
  "✅", "❌", "❎", "⭕", "💯", "✔️", "🔥", "✨", "⭐", "🌟", "💫", "⚡", "🎉", "🎊", "🎈", "🎁",
  "🏆", "🥇", "🥈", "🥉", "🏅", "🎯", "🎲", "🎮", "🎧", "🎵", "🎶", "💡", "💬", "💭", "👀", "🧠",
  // Nature
  "🌈", "☀️", "🌤️", "⛅", "🌧️", "⛈️", "🌙", "☁️", "❄️", "☃️", "🌊", "🌋", "🏔️", "🌲", "🌴", "🌵",
  "🌸", "🌺", "🌻", "🌹", "🌷", "🍀", "🍁",
  // Food & drink
  "🍏", "🍎", "🍊", "🍋", "🍉", "🍇", "🍓", "🫐", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🥑",
  "🍆", "🥔", "🍞", "🧀", "🥚", "🍳", "🍔", "🍟", "🍕", "🌭", "🥪", "🌮", "🌯", "🍿", "🍜", "🍣",
  "🍤", "🍦", "🍩", "🍪", "🎂", "🍰", "🧁", "☕", "🍵", "🍺", "🍻", "🥤",
  // Things
  "🚀", "✈️", "🚗", "🚕", "🚌", "🚂", "🏠", "🏡", "🏢", "🏥", "🏫", "💻", "📱", "📷", "🎥", "📚",
  "📖", "📝", "✏️", "📌", "📎", "🔒", "🔓", "🔑", "🗝️", "💰", "💳", "🧧", "⏰", "📅", "📈", "📉",
  "📊", "🧲", "🧩", "🪄", "🔮",
  // Sport
  "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎱", "🏓", "🏸", "🥊", "🥋", "⛳", "🚴", "🏋️", "⛸️",
  "🛹", "🎿", "🏄",
];

function fileEmoji(mime: string): string {
  if (mime.startsWith("image/")) return "🖼️";
  if (mime.startsWith("video/")) return "🎬";
  if (mime.startsWith("audio/")) return "🎵";
  if (mime === "application/pdf") return "📄";
  if (mime.includes("zip") || mime.includes("rar") || mime.includes("7z") || mime.includes("tar") || mime.includes("gzip")) return "📦";
  if (mime.startsWith("text/")) return "📝";
  return "📎";
}

function fileTileClass(mime: string): string {
  if (mime.startsWith("image/")) return "bg-accent-subtle";
  if (mime.startsWith("video/") || mime.startsWith("audio/")) return "bg-warning/[0.12]";
  if (mime === "application/pdf") return "bg-danger/[0.1]";
  return "bg-bg-elevated";
}

function PeerAvatar({ size = 28 }: { size?: number }) {
  return (
    <span
      className="rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </span>
  );
}

function Spinner({ light = false }: { light?: boolean }) {
  return (
    <span
      className={`w-4 h-4 rounded-full border-2 animate-spin-slow shrink-0 inline-block ${
        light ? "border-white/25 border-t-white" : "border-border-strong border-t-accent"
      }`}
      aria-hidden="true"
    />
  );
}

export default function P2PTextTool() {
  // Reload survival: read the last session (role, room code, history) once, up
  // front, so an F5 restores the whole chat without any effect-time setState.
  const [initialSession] = useState<SavedSession | null>(() =>
    typeof window === "undefined" ? null : loadSession()
  );

  const [phase, setPhase] = useState<Phase>(() =>
    initialSession ? (initialSession.role === "host" ? "host" : "join") : "home"
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const [role, setRole] = useState<"host" | "join" | null>(() => initialSession?.role ?? null);
  const [roomCode, setRoomCode] = useState("");
  const [joinInput, setJoinInput] = useState(() => (initialSession?.role === "join" ? initialSession.code : ""));
  const [messages, setMessages] = useState<ChatMessage[]>(() => initialSession?.messages ?? []);
  const [draft, setDraft] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [linkState, setLinkState] = useState<"connecting" | "connected" | "closed" | null>(null);
  const [peerTyping, setPeerTyping] = useState(false);

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const intentionallyClosedRef = useRef(false);
  const phaseRef = useRef<Phase>("home");
  const urlJoinDoneRef = useRef(false);
  const msgIdRef = useRef(0);
  const uidRef = useRef(0); // transfer ids for text chunking
  const fileIdRef = useRef(0); // ids for file transfers
  const inboxRef = useRef(new Map<number, { n: number; parts: (string | undefined)[] }>());
  const fileInboxRef = useRef(
    new Map<number, { id: number; name: string; size: number; mime: string; n: number; received: number; parts: Uint8Array<ArrayBuffer>[]; messageId: number }>()
  );
  const pendingFileChunksRef = useRef(new Map<number, Uint8Array<ArrayBuffer>[]>());
  const objectUrlsRef = useRef(new Set<string>());
  const joinTimeoutRef = useRef<number | null>(null);
  const copyTimerRef = useRef<number | null>(null);
  const typingStopTimerRef = useRef<number | null>(null);
  const typingSentRef = useRef(false);
  const peerTypingTimerRef = useRef<number | null>(null);
  const systemHelloRef = useRef(false);
  const roleRef = useRef<"host" | "join" | null>(null);
  const roomCodeRef = useRef("");
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectTriesRef = useRef(0);
  const restoreTimerRef = useRef<number | null>(null);
  const sessionHandledRef = useRef(false);
  const dialRoomRef = useRef<(code: string, opts?: { auto?: boolean }) => void>(() => {});
  const draftRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const nearBottomRef = useRef(true);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const addMessage = useCallback((from: "self" | "peer", text: string) => {
    const id = msgIdRef.current++;
    setMessages((prev) => [...prev, { id, from, kind: "text", text, ts: Date.now(), read: false }]);
    return id;
  }, []);

  const addFileMessage = useCallback((from: "self" | "peer", file: FileMsg) => {
    const id = msgIdRef.current++;
    setMessages((prev) => [...prev, { id, from, kind: "file", file, ts: Date.now() }]);
    return id;
  }, []);

  const addSystemMessage = useCallback((text: string) => {
    const id = msgIdRef.current++;
    setMessages((prev) => [...prev, { id, from: "system", kind: "system", text, ts: Date.now() }]);
  }, []);

  // ─── Auto-scroll ────────────────────────────────────────────────────────
  // Scroll the inner message container (never the page). New content jumps to
  // the bottom only while the user is already near the bottom — reading old
  // messages isn't disturbed (like real chat apps).
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  const onChatScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }, []);

  useEffect(() => {
    if (nearBottomRef.current) scrollToBottom();
  }, [messages, peerTyping, scrollToBottom]);

  const clearCopiedSoon = useCallback(() => {
    if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => setCopied(null), 2000);
  }, []);

  const copyToClipboard = useCallback(
    async (text: string, key: "code" | "link") => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(key);
        clearCopiedSoon();
      } catch {
        // Fallback for older browsers / non-secure contexts.
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand("copy");
          setCopied(key);
          clearCopiedSoon();
        } catch {
          setError("Copy failed — select the code and copy it manually.");
        }
        document.body.removeChild(ta);
      }
    },
    [clearCopiedSoon]
  );

  const markTextRead = useCallback((m: number) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.kind === "text" && msg.id === m ? { ...msg, read: true } : msg))
    );
  }, []);

  const updateFileProgress = useCallback((messageId: number, progress: number) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.kind === "file" && msg.id === messageId && msg.file
          ? { ...msg, file: { ...msg.file, progress } }
          : msg
      )
    );
  }, []);

  const finishFileReceive = useCallback(
    (messageId: number, fileId: number, mime: string, parts: Uint8Array<ArrayBuffer>[]) => {
      let blob: Blob;
      try {
        blob = new Blob(parts, { type: mime });
      } catch {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.kind === "file" && msg.id === messageId && msg.file
              ? { ...msg, file: { ...msg.file, failed: true } }
              : msg
          )
        );
        return;
      }
      const url = URL.createObjectURL(blob);
      objectUrlsRef.current.add(url);
      fileInboxRef.current.delete(fileId);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.kind === "file" && msg.id === messageId && msg.file
            ? { ...msg, file: { ...msg.file, progress: 1, done: true, url } }
            : msg
        )
      );
    },
    []
  );

  const appendFileChunk = useCallback(
    (fid: number, payload: Uint8Array<ArrayBuffer>) => {
      const entry = fileInboxRef.current.get(fid);
      if (!entry) {
        // Meta hasn't arrived yet (shouldn't happen on an ordered channel) — queue defensively.
        const pending = pendingFileChunksRef.current.get(fid) ?? [];
        pending.push(payload);
        pendingFileChunksRef.current.set(fid, pending);
        return;
      }
      entry.parts.push(payload);
      entry.received += payload.byteLength;
      const progress = Math.min(1, entry.received / entry.size);
      if (progress < 1) updateFileProgress(entry.messageId, progress);
      if (entry.received >= entry.size) {
        finishFileReceive(entry.messageId, fid, entry.mime, entry.parts);
      }
    },
    [finishFileReceive, updateFileProgress]
  );

  const handleFileChunk = useCallback(
    (data: ArrayBuffer | Blob) => {
      const toBytes = (buf: ArrayBuffer): Uint8Array<ArrayBuffer> => new Uint8Array(buf, 4);
      if (data instanceof ArrayBuffer) {
        if (data.byteLength <= 4) return;
        appendFileChunk(new DataView(data).getUint32(0), toBytes(data));
        return;
      }
      if (typeof Blob !== "undefined" && data instanceof Blob) {
        void data.arrayBuffer().then((buf) => {
          if (buf.byteLength <= 4) return;
          appendFileChunk(new DataView(buf).getUint32(0), toBytes(buf));
        });
        return;
      }
    },
    [appendFileChunk]
  );

  const startFileReceive = useCallback(
    (env: FileMetaEnvelope) => {
      const { id, name, size, mime, n } = env;
      if (typeof id !== "number" || typeof name !== "string" || typeof size !== "number" || typeof mime !== "string" || typeof n !== "number") return;
      if (size <= 0 || size > MAX_FILE_SIZE) return; // too big or invalid — skip
      const messageId = addFileMessage("peer", { id, name, size, mime, progress: 0, done: false });
      fileInboxRef.current.set(id, { id, name, size, mime, n, received: 0, parts: [], messageId });
      const pending = pendingFileChunksRef.current.get(id);
      if (pending) {
        pendingFileChunksRef.current.delete(id);
        for (const chunk of pending) appendFileChunk(id, chunk);
      }
    },
    [addFileMessage, appendFileChunk]
  );

  const handlePeerTyping = useCallback((on: boolean) => {
    if (peerTypingTimerRef.current !== null) window.clearTimeout(peerTypingTimerRef.current);
    setPeerTyping(on);
    if (on) {
      peerTypingTimerRef.current = window.setTimeout(() => setPeerTyping(false), PEER_TYPING_TIMEOUT_MS);
    }
  }, []);

  const handleData = useCallback(
    (data: unknown) => {
      if (data instanceof ArrayBuffer || (typeof Blob !== "undefined" && data instanceof Blob)) {
        handleFileChunk(data);
        return;
      }
      if (typeof data !== "string") return;
      let parsed: unknown;
      try {
        parsed = JSON.parse(data);
      } catch {
        return; // Not our protocol — ignore.
      }
      const env = parsed as Partial<WireEnvelope>;
      if (!env || typeof env.t !== "string") return;

      if (env.t === "msg") {
        const e = env as Partial<MsgEnvelope>;
        if (typeof e.d !== "string" || typeof e.m !== "number" || typeof e.id !== "number" || typeof e.i !== "number" || typeof e.n !== "number") return;
        if (e.n < 1 || e.i < 0 || e.i >= e.n) return;
        const map = inboxRef.current;
        let entry = map.get(e.id);
        if (entry === undefined) {
          entry = { n: e.n, parts: new Array<string | undefined>(e.n) };
          map.set(e.id, entry);
        }
        entry.parts[e.i] = e.d;
        if (entry.parts.every((p) => p !== undefined)) {
          const text = (entry.parts as string[]).join("");
          map.delete(e.id);
          addMessage("peer", text);
          // Tell the sender we received it (read receipt).
          try {
            connRef.current?.send(JSON.stringify({ t: "read", m: e.m } satisfies ReadEnvelope));
          } catch {
            /* noop */
          }
        }
        return;
      }

      if (env.t === "typing" && typeof (env as Partial<TypingEnvelope>).on === "boolean") {
        handlePeerTyping((env as TypingEnvelope).on);
        return;
      }

      if (env.t === "read" && typeof (env as Partial<ReadEnvelope>).m === "number") {
        markTextRead((env as ReadEnvelope).m);
        return;
      }

      if (env.t === "file-meta") {
        startFileReceive(env as FileMetaEnvelope);
        return;
      }
    },
    [addMessage, handleFileChunk, handlePeerTyping, markTextRead, startFileReceive]
  );

  const handleConnOpen = useCallback(() => {
    setPhase("chat");
    setLinkState("connected");
    setError(null);
    setBusy(false);
    // Joiner: remember the room so a dropped link can auto-reconnect, and so the
    // session (code + history) survives a reload. The host already set these.
    if (roleRef.current !== "host") {
      roleRef.current = "join";
      setRole("join");
      setRoomCode(roomCodeRef.current);
    }
    const wasReconnect = reconnectTriesRef.current > 0;
    reconnectTriesRef.current = 0;
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (!systemHelloRef.current) {
      systemHelloRef.current = true;
      addSystemMessage("🔒 Chat connected — messages & files go directly between your devices.");
    } else if (wasReconnect) {
      addSystemMessage("Reconnected 🔗");
    }
  }, [addSystemMessage]);

  // Auto-reconnect for the joiner: retry the room code after a dropped link.
  const scheduleReconnect = useCallback((code: string) => {
    if (intentionallyClosedRef.current) return;
    if (reconnectTriesRef.current >= MAX_RECONNECT_TRIES) {
      setLinkState("closed");
      setBusy(false);
      setError("Couldn't reconnect — the other device is offline or closed the chat.");
      return;
    }
    reconnectTriesRef.current++;
    if (reconnectTimerRef.current !== null) window.clearTimeout(reconnectTimerRef.current);
    reconnectTimerRef.current = window.setTimeout(() => {
      dialRoomRef.current(code, { auto: true });
    }, RECONNECT_DELAY_MS);
  }, []);

  const attachConn = useCallback(
    (conn: DataConnection) => {
      connRef.current = conn;
      // File chunks arrive as ArrayBuffer or Blob depending on the browser's
      // channel binaryType — handleData copes with both.
      conn.on("open", handleConnOpen);
      conn.on("data", handleData);
      conn.on("close", () => {
        if (intentionallyClosedRef.current) return;
        connRef.current = null;
        setLinkState("closed");
        setPeerTyping(false);
        addSystemMessage("Connection closed — the other device left or went offline.");
        // If we're the joiner, the other side may have just reloaded the page —
        // keep dialing the room code until it re-registers (or we give up).
        if (roleRef.current === "join" && roomCodeRef.current) {
          reconnectTriesRef.current = 0;
          scheduleReconnect(roomCodeRef.current);
        }
      });
      conn.on("error", () => {
        // Channel errors are usually transient; `close` reports the final state.
      });
    },
    [handleConnOpen, handleData, addSystemMessage, scheduleReconnect]
  );

  const destroyPeer = useCallback(() => {
    try {
      connRef.current?.close();
    } catch {
      /* noop */
    }
    try {
      peerRef.current?.destroy();
    } catch {
      /* noop */
    }
    connRef.current = null;
    peerRef.current = null;
    inboxRef.current.clear();
    fileInboxRef.current.clear();
    pendingFileChunksRef.current.clear();
  }, []);

  const revokeObjectUrls = useCallback(() => {
    objectUrlsRef.current.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        /* noop */
      }
    });
    objectUrlsRef.current.clear();
  }, []);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (joinTimeoutRef.current !== null) window.clearTimeout(joinTimeoutRef.current);
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
      if (typingStopTimerRef.current !== null) window.clearTimeout(typingStopTimerRef.current);
      if (peerTypingTimerRef.current !== null) window.clearTimeout(peerTypingTimerRef.current);
      if (reconnectTimerRef.current !== null) window.clearTimeout(reconnectTimerRef.current);
      if (restoreTimerRef.current !== null) window.clearTimeout(restoreTimerRef.current);
      try {
        connRef.current?.close();
      } catch {
        /* noop */
      }
      try {
        peerRef.current?.destroy();
      } catch {
        /* noop */
      }
      revokeObjectUrls();
    };
  }, [revokeObjectUrls]);

  const resetAll = useCallback(() => {
    if (joinTimeoutRef.current !== null) window.clearTimeout(joinTimeoutRef.current);
    if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
    if (typingStopTimerRef.current !== null) window.clearTimeout(typingStopTimerRef.current);
    if (peerTypingTimerRef.current !== null) window.clearTimeout(peerTypingTimerRef.current);
    if (reconnectTimerRef.current !== null) window.clearTimeout(reconnectTimerRef.current);
    if (restoreTimerRef.current !== null) window.clearTimeout(restoreTimerRef.current);
    intentionallyClosedRef.current = true;
    destroyPeer();
    intentionallyClosedRef.current = false;
    revokeObjectUrls();
    clearSession();
    systemHelloRef.current = false;
    typingSentRef.current = false;
    roleRef.current = null;
    setRole(null);
    roomCodeRef.current = "";
    reconnectTriesRef.current = 0;
    sessionHandledRef.current = false;
    setPeerTyping(false);
    setPhase("home");
    setError(null);
    setNote(null);
    setRoomCode("");
    setJoinInput("");
    setMessages([]);
    setDraft("");
    setEmojiOpen(false);
    setAddMenuOpen(false);
    setLinkState(null);
    setBusy(false);
  }, [destroyPeer, revokeObjectUrls]);

  // ─── Device 1: create a room with a 4-char code ──────────────────
  // Retry loop: if a generated code happens to be taken (rare), roll a new
  // one until the broker accepts the ID, a real error occurs, or we give up.
  // When restoring a session after a page reload, `preferredCode` (the saved
  // room code) is tried a few times first — the broker frees the old ID a
  // moment after the previous page died, so the same code usually comes back.
  const createHostRoom = useCallback(
    async (preferredCode?: string) => {
      setBusy(true);
      setError(null);
      destroyPeer();
      roleRef.current = "host";
      setRole("host");
      for (let attempt = 0; attempt < 8; attempt++) {
        const code = preferredCode && attempt < PREFERRED_CODE_ATTEMPTS ? preferredCode : generateCode();
        if (attempt > 0) await sleep(preferredCode && attempt < PREFERRED_CODE_ATTEMPTS ? PREFERRED_CODE_RETRY_DELAY_MS : 0);
        let peer: Peer;
      try {
        peer = new Peer(code, { config: { iceServers: ICE_SERVERS, sdpSemantics: "unified-plan" } });
      } catch {
        setError("This browser does not support WebRTC, which is required for P2P Chat.");
        setBusy(false);
        return;
      }
      peerRef.current = peer;

      const outcome = await new Promise<"open" | "taken" | "fatal">((resolve) => {
        let settled = false;
        const settle = (r: "open" | "taken" | "fatal") => {
          if (settled) return;
          settled = true;
          resolve(r);
        };
        peer.on("connection", (conn) => attachConn(conn));
        peer.on("open", () => settle("open"));
        peer.on("error", (err) => {
          if (settled) return; // room is live — broker hiccups don't affect the chat
          if (err.type === "unavailable-id") {
            settle("taken"); // that code is in use — roll a fresh one
          } else if (err.type === "browser-incompatible") {
            setError("Your browser doesn't support WebRTC, which is required for P2P Chat.");
            settle("fatal");
          } else if (
            err.type === "network" ||
            err.type === "server-error" ||
            err.type === "socket-error" ||
            err.type === "socket-closed" ||
            err.type === "ssl-unavailable"
          ) {
            setError("Couldn't reach the free connection broker (0.peerjs.com). Check your internet connection and try again.");
            settle("fatal");
          }
          // Other errors (e.g. 'disconnected') are non-fatal here.
        });
      });

      if (outcome === "open") {
        setRoomCode(code);
        roomCodeRef.current = code;
        setBusy(false);
        return;
      }
      if (outcome === "fatal") {
        setBusy(false);
        return;
      }
      // "taken" — free the peer and try the next code.
      destroyPeer();
    }
    setError("Couldn't find a free code right now — please try again in a moment.");
    setBusy(false);
  },
  [attachConn, destroyPeer]
  );

  const handleHostClick = useCallback(() => {
    setPhase("host");
    void createHostRoom();
  }, [createHostRoom]);

  // ─── Device 2: join a room with a 4-char code ───────────────────
  const dialRoom = useCallback(
    (code: string, opts: { auto?: boolean } = {}) => {
      const auto = opts.auto === true;
      setError(null);
      setBusy(true);
      setLinkState("connecting");
      roomCodeRef.current = code;
      destroyPeer();
      let peer: Peer;
      try {
        peer = new Peer({ config: { iceServers: ICE_SERVERS, sdpSemantics: "unified-plan" } });
      } catch {
        setError("This browser does not support WebRTC, which is required for P2P Chat.");
        setBusy(false);
        setLinkState(null);
        return;
      }
      peerRef.current = peer;

      const retryOrFail = (message: string) => {
        if (auto) {
          scheduleReconnect(code); // keep trying — the host may still be reloading
        } else {
          setError(message);
          setBusy(false);
          setLinkState(null);
          destroyPeer();
        }
      };

      peer.on("open", () => {
        const conn = peer.connect(code, { reliable: true });
        attachConn(conn);
      });
      peer.on("error", (err) => {
        if (connRef.current?.open) return; // link is live — broker hiccups don't affect the chat
        if (err.type === "peer-unavailable") {
          retryOrFail(`No chat room found with code ${code}. Double-check the code with your friend — rooms disappear when the host closes the page.`);
        } else if (
          err.type === "network" ||
          err.type === "server-error" ||
          err.type === "socket-error" ||
          err.type === "socket-closed" ||
          err.type === "ssl-unavailable"
        ) {
          retryOrFail("Couldn't reach the free connection broker (0.peerjs.com). Check your internet connection and try again.");
        } else if (err.type === "browser-incompatible") {
          retryOrFail("Your browser doesn't support WebRTC, which is required for P2P Chat.");
        }
      });

      if (joinTimeoutRef.current !== null) window.clearTimeout(joinTimeoutRef.current);
      joinTimeoutRef.current = window.setTimeout(() => {
        const conn = connRef.current;
        if (conn?.open) return;
        if (auto) {
          scheduleReconnect(code);
        } else if (phaseRef.current === "join") {
          setError("Couldn't connect. Is the other device still on this page with this code open?");
          setBusy(false);
          setLinkState(null);
          destroyPeer();
        }
      }, auto ? RECONNECT_TIMEOUT_MS : JOIN_TIMEOUT_MS);
    },
    [attachConn, destroyPeer, scheduleReconnect]
  );

  useEffect(() => {
    dialRoomRef.current = dialRoom;
  }, [dialRoom]);

  const handleJoinClick = useCallback(
    (raw: string) => {
      const code = normalizeCode(raw);
      if (code.length !== CODE_LENGTH) {
        setError(`Enter the full ${CODE_LENGTH}-character code.`);
        return;
      }
      urlJoinDoneRef.current = true; // user took over from the invite link
      dialRoom(code);
    },
    [dialRoom]
  );

  // Keep the latest join handler reachable from the mount effect.
  const handleJoinRef = useRef<(code: string) => void>(() => {});
  useEffect(() => {
    handleJoinRef.current = handleJoinClick;
  }, [handleJoinClick]);

  // If the page was opened with ?code=XXXX, jump straight into joining.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (!code || normalizeCode(code).length !== CODE_LENGTH || urlJoinDoneRef.current) return;
    const normalized = normalizeCode(code);
    setPhase("join");
    setJoinInput(normalized);
    const t = window.setTimeout(() => {
      if (sessionHandledRef.current || urlJoinDoneRef.current) return;
      urlJoinDoneRef.current = true;
      handleJoinRef.current(normalized);
    }, 400);
    return () => window.clearTimeout(t);
  }, []);

  // Reload survival — re-dial the saved room once the restored state is in place
  // (the role/phase/joinInput/messages are seeded lazily in the useState inits).
  useEffect(() => {
    const saved = initialSession;
    if (!saved) return;
    if (saved.role === "join") {
      // A fresh ?code= invite link in the URL wins over a stored join session.
      if (new URLSearchParams(window.location.search).get("code")) return;
      sessionHandledRef.current = true;
      systemHelloRef.current = true; // don't duplicate the hello bubble
      // Dial in auto mode: if the host is still re-registering its room code
      // after its own reload, we retry silently instead of erroring out.
      restoreTimerRef.current = window.setTimeout(() => {
        if (urlJoinDoneRef.current) return;
        urlJoinDoneRef.current = true;
        dialRoomRef.current(saved.code, { auto: true });
      }, 400);
      return;
    }
    // Host — re-register the saved room code; the friend auto-reconnects to it.
    sessionHandledRef.current = true;
    systemHelloRef.current = true;
    // Defer a beat so the restore paints before we start dialing.
    restoreTimerRef.current = window.setTimeout(() => {
      void createHostRoom(saved.code);
    }, 0);
  }, [initialSession, createHostRoom]);

  // Keep the joiner's room code reachable from the connection close handler.
  useEffect(() => {
    roomCodeRef.current = roomCode;
  }, [roomCode]);

  // Persist the live session so an F5 brings the chat (and history) back.
  useEffect(() => {
    if (roleRef.current && roomCode) {
      saveSession(roleRef.current, roomCode, messages);
    }
  }, [messages, roomCode]);

  // ─── Sending ──────────────────────────────────────────────────────
  const sendTyping = useCallback((on: boolean) => {
    const conn = connRef.current;
    if (!conn || !conn.open) return;
    try {
      conn.send(JSON.stringify({ t: "typing", on } satisfies TypingEnvelope));
    } catch {
      /* noop */
    }
  }, []);

  const onDraftChange = useCallback(
    (value: string) => {
      setDraft(value);
      const ta = draftRef.current;
      if (ta) {
        ta.style.height = "auto";
        ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
      }
      if (!connRef.current?.open) return;
      const typing = value.trim().length > 0;
      if (typing && !typingSentRef.current) {
        typingSentRef.current = true;
        sendTyping(true);
      } else if (!typing && typingSentRef.current) {
        typingSentRef.current = false;
        sendTyping(false);
      }
      if (typingStopTimerRef.current !== null) window.clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = window.setTimeout(() => {
        if (typingSentRef.current) {
          typingSentRef.current = false;
          sendTyping(false);
        }
      }, TYPING_IDLE_MS);
    },
    [sendTyping]
  );

  const sendDraft = useCallback(() => {
    const text = draft;
    if (!text.trim()) return;
    const conn = connRef.current;
    if (!conn || !conn.open) {
      setError("Not connected yet — wait a moment for the link to finish.");
      return;
    }
    if (text.length > MAX_TEXT_LENGTH) {
      setError("Message is too large. Keep it under 200,000 characters.");
      return;
    }
    // We're sending — stop telling the peer we're typing.
    if (typingSentRef.current) {
      typingSentRef.current = false;
      sendTyping(false);
    }
    if (typingStopTimerRef.current !== null) {
      window.clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
    }
    const m = addMessage("self", text);
    setDraft("");
    const ta = draftRef.current;
    if (ta) ta.style.height = "auto";
    // Force-scroll to our own message even if we were reading history.
    nearBottomRef.current = true;
    try {
      if (text.length <= CHUNK_SIZE) {
        const single: MsgEnvelope = { t: "msg", m, id: 0, i: 0, n: 1, d: text };
        conn.send(JSON.stringify(single));
      } else {
        const id = ++uidRef.current;
        const n = Math.ceil(text.length / CHUNK_SIZE);
        for (let i = 0; i < n; i++) {
          const chunk: MsgEnvelope = { t: "msg", m, id, i, n, d: text.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE) };
          conn.send(JSON.stringify(chunk));
        }
      }
    } catch {
      setError("Couldn't send that message — the link may have dropped.");
    }
  }, [addMessage, draft, sendTyping]);

  const sendFile = useCallback(
    async (file: File) => {
      const conn = connRef.current;
      if (!conn || !conn.open) {
        setError("Not connected yet — wait a moment for the link to finish.");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`"${file.name}" is too large — the limit is ${formatBytes(MAX_FILE_SIZE)} per file.`);
        return;
      }
      if (file.size === 0) {
        setError("That file is empty — nothing to send.");
        return;
      }
      let buffer: ArrayBuffer;
      try {
        buffer = await file.arrayBuffer();
      } catch {
        setError(`Couldn't read "${file.name}".`);
        return;
      }
      const fid = ++fileIdRef.current;
      const n = Math.ceil(buffer.byteLength / FILE_CHUNK_SIZE);
      const mime = file.type || "application/octet-stream";
      const url = URL.createObjectURL(file); // own preview
      objectUrlsRef.current.add(url);
      const localId = addFileMessage("self", { id: fid, name: file.name, size: file.size, mime, progress: 0, done: false, url });
      nearBottomRef.current = true;
      try {
        const meta: FileMetaEnvelope = { t: "file-meta", id: fid, name: file.name, size: file.size, mime, n };
        conn.send(JSON.stringify(meta));
        for (let i = 0; i < n; i++) {
          const start = i * FILE_CHUNK_SIZE;
          const chunk = buffer.slice(start, Math.min(start + FILE_CHUNK_SIZE, buffer.byteLength));
          const frame = new ArrayBuffer(4 + chunk.byteLength);
          new DataView(frame).setUint32(0, fid);
          new Uint8Array(frame, 4).set(new Uint8Array(chunk));
          conn.send(frame);
        }
        setMessages((prev) =>
          prev.map((msg) =>
            msg.kind === "file" && msg.id === localId && msg.file
              ? { ...msg, file: { ...msg.file, progress: 1, done: true } }
              : msg
          )
        );
      } catch {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.kind === "file" && msg.id === localId && msg.file
              ? { ...msg, file: { ...msg.file, failed: true } }
              : msg
          )
        );
        setError(`Couldn't send "${file.name}" — the link may have dropped.`);
      }
    },
    [addFileMessage]
  );

  const onFilesSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      for (const f of files) void sendFile(f);
      e.target.value = "";
    },
    [sendFile]
  );

  const onComposerKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendDraft();
      }
    },
    [sendDraft]
  );

  const insertEmoji = useCallback(
    (emoji: string) => {
      const ta = draftRef.current;
      const start = ta?.selectionStart ?? draft.length;
      const end = ta?.selectionEnd ?? draft.length;
      const next = draft.slice(0, start) + emoji + draft.slice(end);
      onDraftChange(next);
      setEmojiOpen(false);
      // Restore focus and cursor after the state update.
      window.requestAnimationFrame(() => {
        ta?.focus();
        const pos = start + emoji.length;
        ta?.setSelectionRange(pos, pos);
      });
    },
    [draft, onDraftChange]
  );

  const isSameDay = (a: number, b: number) => new Date(a).toDateString() === new Date(b).toDateString();
  // "Today" = the day of the newest chat message (stable across renders).
  let lastChatTs: number | null = null;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].kind !== "system") {
      lastChatTs = messages[i].ts;
      break;
    }
  }
  const dayLabel = (ts: number, isToday: boolean) =>
    isToday
      ? "Today"
      : new Date(ts).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

  const inviteLink =
    typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}?code=${roomCode}` : "";

  const connected = linkState === "connected";

  // ─── UI ─────────────────────────────────────────────────────────────
  const stepBadge = (n: number) => (
    <span className="flex items-center justify-center w-6 h-6 bg-accent border border-border-strong text-text-on-accent text-[11px] font-extrabold shrink-0 shadow-[2px_2px_0_var(--shadow-color)]">
      {n}
    </span>
  );

  if (phase === "home") {
    return (
      <div className="space-y-5">
        {error && <ErrorNote message={error} onDismiss={() => setError(null)} />}
        <p className="text-sm text-text-secondary leading-relaxed">
          Chat between <strong className="text-text-primary">two devices</strong> (a laptop and a phone, for example)
          with a <strong className="text-text-primary">4-character code</strong>. No account, no sign-up, nothing uploaded —
          your messages and files go <strong className="text-text-primary">directly between the two browsers</strong> over an encrypted link.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onClick={handleHostClick} disabled={busy} className="btn-primary w-full flex flex-col items-start gap-1 p-4 text-left">
            <span className="flex items-center gap-2">
              {busy && <Spinner light />}
              {busy ? "Creating a room…" : "Create a room"}
            </span>
            <span className="text-[11px] font-medium opacity-80 normal-case tracking-normal">
              First device — you&apos;ll get a 4-character code to share.
            </span>
          </button>

          <button
            onClick={() => {
              setError(null);
              setPhase("join");
            }}
            className="btn-secondary w-full flex flex-col items-start gap-1 p-4 text-left"
          >
            <span className="flex items-center gap-2">Join with a code</span>
            <span className="text-[11px] font-medium opacity-80 normal-case tracking-normal">
              Second device — enter the code you received.
            </span>
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-start gap-2.5 p-3 bg-bg-elevated border border-border-base rounded-lg">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent mt-0.5 shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-xs text-text-secondary leading-relaxed">
              Your messages never touch a server. A free public broker only helps the two browsers find each other by
              code — and a built-in relay makes it work even behind strict firewalls.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "host") {
    return (
      <div className="space-y-6">
        <StatusRow
          status="waiting"
          text={
            messages.length > 0
              ? "Back online — waiting for your friend to reconnect…"
              : "Room ready — waiting for a friend to join with this code."
          }
        />
        {error && <ErrorNote message={error} onDismiss={() => setError(null)} />}
        {note && <NoteNote message={note} />}

        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            {stepBadge(1)}
            <div>
              <h3 className="text-sm font-bold text-text-primary">Share this code</h3>
              <p className="text-xs text-text-tertiary">Send it to the other device — any chat app, message, or email works.</p>
            </div>
          </div>

          <div className="bg-bg-elevated border border-border-strong p-4 flex items-center justify-center gap-3">
            {roomCode.split("").map((ch, i) => (
              <span
                key={i}
                className="flex items-center justify-center w-12 h-14 sm:w-14 sm:h-16 bg-bg-surface border border-border-strong shadow-[3px_3px_0_var(--shadow-color)] text-3xl font-extrabold font-mono text-text-primary"
              >
                {ch}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => copyToClipboard(roomCode, "code")} className="btn-primary px-4 py-2 text-xs">
              {copied === "code" ? "✓ Copied" : "Copy code"}
            </button>
            <button onClick={() => copyToClipboard(inviteLink, "link")} className="btn-secondary px-4 py-2 text-xs">
              {copied === "link" ? "✓ Link copied" : "Copy invite link"}
            </button>
            <p className="text-xs text-text-tertiary">
              The invite link opens the chat with the code filled in — your friend just taps to join.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-3 py-2.5 bg-bg-elevated border border-border-strong rounded-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-warning border border-border-strong animate-pulse shrink-0" />
          <p className="text-xs font-semibold text-text-secondary">
            Waiting for someone to join… keep this page open.
          </p>
          <button onClick={resetAll} className="btn-ghost px-3 py-1.5 text-xs text-text-tertiary ml-auto">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (phase === "join") {
    return (
      <div className="space-y-6">
        <StatusRow status="waiting" text={busy ? "Connecting…" : "Enter the 4-character code from the other device."} />
        {error && <ErrorNote message={error} onDismiss={() => setError(null)} />}
        {note && <NoteNote message={note} />}

        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            {stepBadge(1)}
            <div>
              <h3 className="text-sm font-bold text-text-primary">Enter the code</h3>
              <p className="text-xs text-text-tertiary">It was shown on the first device when it created the room.</p>
            </div>
          </div>

          <div className="space-y-2">
            <input
              value={joinInput}
              onChange={(e) => setJoinInput(normalizeCode(e.target.value))}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") handleJoinClick(joinInput);
              }}
              placeholder="e.g. K7M2"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              maxLength={CODE_LENGTH}
              className="w-full text-center text-3xl font-extrabold font-mono tracking-[0.4em] px-3 py-4 rounded-lg bg-bg-input border border-border-strong text-text-primary placeholder:text-text-tertiary/60 placeholder:tracking-normal focus:border-accent focus:outline-none"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleJoinClick(joinInput)}
                disabled={busy || joinInput.length !== CODE_LENGTH}
                className="btn-primary px-5 py-2 text-xs"
              >
                {busy ? (
                  <span className="flex items-center gap-2">
                    <Spinner light />
                    Connecting…
                  </span>
                ) : (
                  "Join chat"
                )}
              </button>
              <button
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text) setJoinInput(normalizeCode(text));
                  } catch {
                    setNote("Your browser blocked reading the clipboard — paste manually with Ctrl+V / Cmd+V.");
                    window.setTimeout(() => setNote(null), 4000);
                  }
                }}
                className="btn-ghost px-4 py-2 text-xs"
              >
                Paste code
              </button>
              <button onClick={resetAll} className="btn-ghost px-4 py-2 text-xs text-text-tertiary">
                Back
              </button>
            </div>
            <p className="text-[11px] text-text-tertiary">Codes are case-insensitive and use letters + digits.</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Connected — WhatsApp-style chat ──────────────────────────────
  const headerStatus = peerTyping
    ? { text: "typing…", className: "text-accent italic" }
    : linkState === "connected"
    ? { text: "online", className: "text-success" }
    : linkState === "closed"
    ? { text: "offline", className: "text-text-tertiary" }
    : { text: "connecting…", className: "text-warning" };

  return (
    <div className="space-y-4">
      {error && <ErrorNote message={error} onDismiss={() => setError(null)} />}
      {linkState === "closed" && (
        <div className="p-3 bg-bg-elevated border border-border-base rounded-xl flex items-center justify-between gap-3">
          <p className="text-xs text-text-secondary">
            {role === "host"
              ? "Your friend went offline — keep this page open and they'll reconnect automatically after a reload."
              : "The other device closed the connection — reconnecting automatically…"}
          </p>
          <button onClick={resetAll} className="btn-secondary px-3 py-1.5 text-xs shrink-0">New session</button>
        </div>
      )}

      {/* Chat card */}
      <div className="flex flex-col overflow-hidden border border-border-strong rounded-2xl bg-bg-surface shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 border-b border-border-base bg-bg-surface">
          <span className="w-9 h-9 rounded-full bg-accent/15 text-accent flex items-center justify-center text-[13px] font-extrabold shrink-0">
            P2
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-text-primary leading-tight truncate">P2P Chat</p>
            <p className={`text-[11px] leading-tight truncate ${headerStatus.className}`}>
              {headerStatus.text}
            </p>
          </div>
          {roomCode && (
            <span className="px-2 py-1 rounded-lg bg-bg-elevated border border-border-base font-mono text-[10px] font-extrabold text-text-secondary shrink-0">
              ROOM {roomCode}
            </span>
          )}
          <button
            onClick={resetAll}
            className="w-9 h-9 rounded-full flex items-center justify-center text-text-tertiary hover:text-danger hover:bg-bg-hover transition-colors shrink-0"
            title="End session"
            aria-label="End session"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          onScroll={onChatScroll}
          style={CHAT_BG_STYLE}
          className="flex flex-col justify-end gap-1.5 h-[55dvh] min-h-[320px] sm:h-[420px] overflow-y-auto overscroll-contain px-3 sm:px-4 py-3"
          role="log"
          aria-live="polite"
          aria-label="Chat messages"
        >
          {messages.length === 0 && !peerTyping ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <span className="text-4xl mb-3">👋</span>
              <p className="text-base font-bold text-text-primary mb-1">Say hi!</p>
              <p className="text-xs text-text-tertiary max-w-[240px]">
                Messages and files appear here instantly on both devices. Try sending a photo or a file.
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => {
                const prev = messages[idx - 1];
                const showDay =
                  msg.kind !== "system" &&
                  (!prev || prev.kind === "system" || !isSameDay(prev.ts, msg.ts));
                const isToday = showDay && lastChatTs !== null && isSameDay(msg.ts, lastChatTs);
                return (
                  <div key={msg.id} className="flex flex-col">
                    {showDay && (
                      <div className="flex justify-center my-1.5">
                        <span className="px-2.5 py-1 rounded-full bg-bg-elevated/90 border border-border-base text-[10px] font-bold text-text-tertiary shadow-sm">
                          {dayLabel(msg.ts, isToday)}
                        </span>
                      </div>
                    )}
                    {msg.kind === "system" ? (
                      <div className="flex justify-center my-1">
                        <span className="px-3 py-1.5 rounded-full bg-bg-elevated/90 border border-border-base text-[11px] font-medium text-text-secondary shadow-sm">
                          {msg.text}
                        </span>
                      </div>
                    ) : msg.kind === "file" && msg.file ? (
                      <FileBubble msg={msg} />
                    ) : (
                      <TextBubble msg={msg} />
                    )}
                  </div>
                );
              })}

              {peerTyping && (
                <div className="flex items-end gap-2 mt-0.5">
                  <PeerAvatar />
                  <div className="px-3.5 py-3 rounded-2xl rounded-bl-md bg-bg-surface border border-border-base shadow-sm">
                    <span className="flex items-center gap-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-text-tertiary/70 animate-bounce"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="relative space-y-1.5">
        {/* Backdrops + popovers */}
        {(emojiOpen || addMenuOpen) && (
          <div className="fixed inset-0 z-40" onClick={() => { setEmojiOpen(false); setAddMenuOpen(false); }} aria-hidden="true" />
        )}

        {addMenuOpen && (
          <div className="absolute bottom-full left-0 mb-2 z-50 flex gap-1 p-1.5 bg-bg-surface border border-border-strong rounded-xl shadow-lg animate-fade-in-up">
            <button
              type="button"
              onClick={() => {
                setAddMenuOpen(false);
                // Let the popover close before opening the native picker.
                window.setTimeout(() => fileInputRef.current?.click(), 0);
              }}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg hover:bg-bg-hover transition-colors text-xs font-semibold text-text-primary"
            >
              <span className="text-base leading-none">📁</span> Send file
            </button>
            <button
              type="button"
              onClick={() => {
                setAddMenuOpen(false);
                setEmojiOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg hover:bg-bg-hover transition-colors text-xs font-semibold text-text-primary"
            >
              <span className="text-base leading-none">😊</span> Emoji
            </button>
          </div>
        )}

        {emojiOpen && (
          <div className="absolute bottom-full left-0 right-0 sm:left-auto sm:right-0 sm:w-96 mb-2 z-50 bg-bg-surface border border-border-strong rounded-xl shadow-lg p-2 animate-fade-in-up">
            <p className="px-1.5 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-text-tertiary">Emoji</p>
            <div className="max-h-60 overflow-y-auto grid grid-cols-8 gap-0.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => insertEmoji(e)}
                  className="flex items-center justify-center aspect-square text-lg hover:bg-bg-hover rounded-md transition-colors"
                  aria-label={`Insert ${e}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Composer row */}
        <div className="flex items-end gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => {
              setEmojiOpen(false);
              setAddMenuOpen((v) => !v);
            }}
            disabled={!connected}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-text-secondary bg-bg-surface border border-border-strong disabled:opacity-50 transition-colors hover:bg-bg-hover shrink-0"
            aria-label="Add attachment or emoji"
            title="Add"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </button>

          <textarea
            ref={draftRef}
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={onComposerKeyDown}
            disabled={!connected}
            placeholder={connected ? "Type a message…" : "Waiting for the link…"}
            rows={1}
            enterKeyHint="send"
            autoCapitalize="sentences"
            className="flex-1 min-w-0 max-h-[120px] resize-none rounded-2xl bg-bg-input border border-border-strong px-3.5 py-2.5 text-[16px] sm:text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
          />

          <button
            onClick={sendDraft}
            disabled={!connected || !draft.trim()}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center bg-accent text-text-on-accent disabled:opacity-50 transition-all hover:bg-accent-hover active:scale-95 shrink-0 shadow-sm"
            aria-label="Send message"
            title="Send"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </button>
        </div>

        {/* Hidden native file picker */}
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={onFilesSelected} />

        {/* Hint row */}
        <div className="flex items-center justify-between gap-2 px-1">
          <p className="text-[11px] text-text-tertiary">
            Files up to {formatBytes(MAX_FILE_SIZE)} · sent directly, never uploaded
          </p>
          {draft && (
            <p className="text-[10px] text-text-tertiary shrink-0">
              {draft.length.toLocaleString()} chars · Enter to send
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function TextBubble({ msg }: { msg: ChatMessage }) {
  const own = msg.from === "self";
  return (
    <div className={`flex items-end gap-2 ${own ? "justify-end" : "justify-start"}`}>
      {!own && <PeerAvatar />}
      <div
        className={`relative max-w-[82%] sm:max-w-[72%] px-3 py-2 rounded-2xl text-[14px] leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
          own ? "rounded-br-md" : "bg-bg-surface border border-border-base rounded-bl-md"
        }`}
        style={own ? { backgroundColor: "color-mix(in srgb, var(--accent) 15%, var(--bg-surface))" } : undefined}
      >
        <p className="text-text-primary">{msg.text}</p>
        <span className={`flex items-center justify-end gap-1 mt-0.5 ml-8 text-[10px] leading-none select-none ${
          own ? (msg.read ? "text-accent" : "text-text-tertiary/80") : "text-text-tertiary"
        }`}>
          {formatTime(msg.ts)}
          {own && <span className="font-bold tracking-tight">{msg.read ? "✓✓" : "✓"}</span>}
        </span>
      </div>
    </div>
  );
}

function FileBubble({ msg }: { msg: ChatMessage }) {
  const own = msg.from === "self";
  const file = msg.file!;
  const isImage = file.mime.startsWith("image/");
  const showPreview = !!file.url && (own || file.done);

  return (
    <div className={`flex items-end gap-2 ${own ? "justify-end" : "justify-start"}`}>
      {!own && <PeerAvatar />}
      <div
        className={`max-w-[85%] sm:max-w-[75%] px-2.5 py-2.5 rounded-2xl shadow-sm ${
          own ? "rounded-br-md" : "bg-bg-surface border border-border-base rounded-bl-md"
        }`}
        style={own ? { backgroundColor: "color-mix(in srgb, var(--accent) 15%, var(--bg-surface))" } : undefined}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${fileTileClass(file.mime)}`} aria-hidden="true">
            {fileEmoji(file.mime)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-text-primary truncate">{file.name}</p>
            <p className="text-[11px] text-text-tertiary mt-0.5">
              {formatBytes(file.size)}
              {!file.done && !file.failed && ` · ${Math.round(file.progress * 100)}%`}
            </p>
            {!file.done && !file.failed && (
              <div className="mt-1.5 h-1.5 w-full min-w-[140px] rounded-full bg-black/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-200"
                  style={{ width: `${Math.max(4, file.progress * 100)}%` }}
                />
              </div>
            )}
          </div>
          <div className="shrink-0">
            {file.failed ? (
              <span className="text-[10px] font-bold text-danger">Failed</span>
            ) : !file.done ? (
              <Spinner />
            ) : own ? (
              <span className="text-[11px] font-bold text-accent">✓ Sent</span>
            ) : (
              file.url && (
                <a
                  href={file.url}
                  download={file.name}
                  className="btn-secondary px-2.5 py-1.5 text-[11px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  Download
                </a>
              )
            )}
          </div>
        </div>
        {isImage && showPreview && (
          <a href={file.url} download={file.name} className="block mt-2" title={`Open ${file.name}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={file.url}
              alt={file.name}
              className="max-h-56 w-full object-cover rounded-xl border border-black/5"
            />
          </a>
        )}
        <span className={`flex items-center justify-end gap-1 mt-1 text-[10px] leading-none select-none ${
          own ? "text-text-tertiary/80" : "text-text-tertiary"
        }`}>
          {formatTime(msg.ts)}
        </span>
      </div>
    </div>
  );
}

function ErrorNote({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="p-3 bg-bg-surface border border-danger shadow-[3px_3px_0_var(--shadow-color)] flex items-start gap-2.5">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-danger mt-0.5 shrink-0">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
      <p className="flex-1 min-w-0 text-xs text-text-secondary leading-relaxed break-words">{message}</p>
      <button onClick={onDismiss} className="text-text-tertiary hover:text-danger transition-colors shrink-0" aria-label="Dismiss">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

function NoteNote({ message }: { message: string }) {
  return (
    <div className="p-3 bg-bg-elevated border border-border-base rounded-lg flex items-start gap-2.5">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning mt-0.5 shrink-0">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
      <p className="text-xs text-text-secondary leading-relaxed">{message}</p>
    </div>
  );
}

function StatusRow({ status, text }: { status: "waiting" | "connected"; text: string }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 bg-bg-elevated border border-border-strong rounded-lg">
      <span className={`w-2.5 h-2.5 rounded-full border border-border-strong shrink-0 ${status === "connected" ? "bg-success" : "bg-warning animate-pulse"}`} />
      <p className="text-xs font-semibold text-text-secondary">{text}</p>
    </div>
  );
}