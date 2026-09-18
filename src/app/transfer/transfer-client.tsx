"use client";

// P2P File Transfer — Send Anywhere-style, up to 50 GB, zero server storage.
//
// Same architecture as the P2P Chat tool: the free PeerJS cloud broker
// (0.peerjs.com) only relays the one-time WebRTC handshake so the two browsers
// can find each other. After that, every byte flows directly between the two
// devices over an encrypted (DTLS) RTCDataChannel — the broker never sees the
// files, nothing is stored anywhere, and closing the page destroys the room.
//
// Sender: picks files → gets a 6-digit code + QR + invite link. When the
// receiver pairs, the sender streams the files in 256 KB chunks with
// backpressure, and announces each file with a small JSON control message.
//
// Receiver: enters the code (or scans the QR / opens the link), picks a save
// location once (File System Access API) and files stream straight to disk.
// Browsers without FSA (Firefox, Safari, iOS) fall back to in-memory buffers
// and get one download link per finished file.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Peer, { type DataConnection } from "peerjs";

// ─── Constants ───────────────────────────────────────────────────────────

const CODE_LENGTH = 6;
const CODE_TTL_MS = 10 * 60 * 1000; // pairing code expires after 10 minutes
// Chunk sizing — WebRTC data channels REJECT messages larger than the
// negotiated SCTP maxMessageSize (256 KB Chrome↔Chrome, 64 KB cross-browser),
// and an oversized send kills the whole channel. So chunks are sized per
// connection: min(maxMessageSize − 4 KB, 64 KB), floored at 16 KB.
const MIN_CHUNK = 16 * 1024;
const MAX_CHUNK = 64 * 1024;
const CHUNK_SAFETY_MARGIN = 4 * 1024;
const DEFAULT_CHUNK = 60 * 1024;

function bestChunkSize(conn: DataConnection): number {
  try {
    const max = (conn.peerConnection as RTCPeerConnection | undefined)?.sctp?.maxMessageSize;
    if (typeof max === "number" && max > MIN_CHUNK + CHUNK_SAFETY_MARGIN) {
      return Math.max(MIN_CHUNK, Math.min(MAX_CHUNK, max - CHUNK_SAFETY_MARGIN));
    }
  } catch {
    /* noop */
  }
  return DEFAULT_CHUNK; // conservative cross-browser fallback
}
const BUFFER_HIGH_WATER = 4 * 1024 * 1024; // backpressure ceiling (4 MB)
const BUFFER_POLL_MS = 8; // buffer drain poll interval
const MAX_TOTAL_BYTES = 50 * 1024 * 1024 * 1024; // 50 GB
const JOIN_TIMEOUT_MS = 30_000;
const ICE_SERVERS: RTCIceServer[] = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  { urls: "stun:stun.cloudflare.com:3478" },
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

// ─── Wire protocol ───────────────────────────────────────────────────────
// Control messages are JSON strings; file bytes are raw ArrayBuffer frames
// (serialization "raw" = untouched passthrough). A binary frame's first 4
// bytes are the big-endian file id, the rest is the chunk payload.

interface HelloMsg {
  t: "hello";
  device: string;
}
interface AcceptMsg {
  t: "accept";
  device: string;
}
interface ManifestMsg {
  t: "manifest";
  files: FileMeta[];
  totalSize: number;
}
interface FileStartMsg {
  t: "file-start";
  id: number;
  name: string;
  size: number;
  mime: string;
  /** 0-based index within the manifest. */
  idx: number;
  count: number;
}
interface FileDoneMsg {
  t: "file-done";
  id: number;
}
interface AllDoneMsg {
  t: "all-done";
}
interface CancelMsg {
  t: "cancel";
  reason: string;
}

type ControlMsg =
  | HelloMsg
  | AcceptMsg
  | ManifestMsg
  | FileStartMsg
  | FileDoneMsg
  | AllDoneMsg
  | CancelMsg;

interface FileMeta {
  id: number;
  name: string;
  size: number;
  mime: string;
}

// ─── Small helpers ───────────────────────────────────────────────────────

const CODE_CHARS = "0123456789";

function generateCode(): string {
  const buf = new Uint32Array(CODE_LENGTH);
  crypto.getRandomValues(buf);
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) out += CODE_CHARS[buf[i] % 10];
  return out;
}

function normalizeCode(input: string): string {
  return input.replace(/\D/g, "").slice(0, CODE_LENGTH);
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value >= 100 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function fileEmoji(name: string, mime: string): string {
  const lower = name.toLowerCase();
  if (mime.startsWith("image/")) return "🖼️";
  if (mime.startsWith("video/")) return "🎬";
  if (mime.startsWith("audio/")) return "🎵";
  if (mime === "application/pdf" || lower.endsWith(".pdf")) return "📕";
  if (/\.(zip|rar|7z|tar|gz|bz2|xz)$/.test(lower) || mime.includes("zip")) return "📦";
  if (/\.(docx?|odt|rtf)$/.test(lower)) return "📘";
  if (/\.(pptx?|key)$/.test(lower)) return "📙";
  if (/\.(xlsx?|csv|ods)$/.test(lower)) return "📗";
  if (mime.startsWith("text/") || /\.(txt|md|json|xml|html?)$/.test(lower)) return "📄";
  if (/\.(exe|dmg|apk|msi|appimage)$/.test(lower)) return "⚙️";
  return "📎";
}

function guessDevice(): string {
  const ua = navigator.userAgent;
  const os = /Android/i.test(ua)
    ? "Android"
    : /iPhone|iPad|iPod/i.test(ua)
      ? "iOS"
      : /Mac/i.test(ua)
        ? "Mac"
        : /Windows/i.test(ua)
          ? "Windows"
          : /Linux/i.test(ua)
            ? "Linux"
            : "Device";
  const browser = /Edg\//i.test(ua)
    ? "Edge"
    : /OPR\//i.test(ua)
      ? "Opera"
      : /Chrome\//i.test(ua)
        ? "Chrome"
        : /Firefox\//i.test(ua)
          ? "Firefox"
          : /Safari\//i.test(ua)
            ? "Safari"
            : "Browser";
  return `${os} · ${browser}`;
}

/** Receiver save target: either a disk directory handle or in-memory buffers. */
interface SaveTarget {
  streaming: boolean;
  dir?: FileSystemDirectoryHandle;
  /** Fallback map: fileId → chunks (flushed to disk for streaming mode). */
  memory: Map<number, BlobPart[]>;
}

interface ReceivedFile {
  id: number;
  idx: number;
  name: string;
  size: number;
  mime: string;
  received: number;
  done: boolean;
  url?: string;
  savedToDisk?: boolean;
  failed?: boolean;
}

const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

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

// ─── Component ───────────────────────────────────────────────────────────

type Role = null | "sending" | "receiving";

interface LogEntry {
  id: number;
  ts: number;
  text: string;
  tone: "info" | "success" | "error";
}

export function TransferClient() {
  const [role, setRole] = useState<Role>(null);
  const [error, setError] = useState<string | null>(null);

  // Sender state
  const [files, setFiles] = useState<File[]>([]);
  const [phase, setPhase] = useState<"idle" | "creating" | "waiting" | "connected" | "transferring" | "done" | "failed">("idle");
  const [code, setCode] = useState("");
  const [codeExpiry, setCodeExpiry] = useState<number | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [peerDevice, setPeerDevice] = useState<string | null>(null);
  const [sentBytes, setSentBytes] = useState(0);
  const [sendStartedAt, setSendStartedAt] = useState<number | null>(null);
  const [sendFinishedAt, setSendFinishedAt] = useState<number | null>(null);
  const [activeName, setActiveName] = useState<string | null>(null);
  const [activeProgress, setActiveProgress] = useState(0);
  const [elapsedTick, setElapsedTick] = useState(0);
  // Ticker-sampled timestamp — render code reads this instead of Date.now(),
  // keeping render pure while still updating once per second.
  const [nowTs, setNowTs] = useState(() => (typeof window === "undefined" ? 0 : Date.now()));

  // Receiver state
  const [codeInput, setCodeInput] = useState(() =>
    typeof window === "undefined" ? "" : normalizeCode(new URLSearchParams(window.location.search).get("code") ?? "")
  );
  const [joinPhase, setJoinPhase] = useState<"idle" | "connecting" | "connected" | "transferring" | "done" | "failed">("idle");
  const [incoming, setIncoming] = useState<ReceivedFile[]>([]);
  const [manifestCount, setManifestCount] = useState(0);
  const [manifestSize, setManifestSize] = useState(0);
  const [saveMode, setSaveMode] = useState<"streaming" | "memory" | null>(null);
  const [receivedBytes, setReceivedBytes] = useState(0);
  const [pickProgress, setPickProgress] = useState(false);

  // Shared refs
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const filesRef = useRef<File[]>([]);
  const cancelRef = useRef(false);
  const intentionallyClosedRef = useRef(false);
  const logIdRef = useRef(0);
  const joinTimerRef = useRef<number | null>(null);
  const copyTimerRef = useRef<number | null>(null);
  const expiryTimerRef = useRef<number | null>(null);
  const saveTargetRef = useRef<SaveTarget | null>(null);
  const codeRef = useRef("");
  const mountedRef = useRef(false);
  const transferActiveRef = useRef(false);
  const sentBytesRef = useRef(0);
  const receivedBytesRef = useRef(0);
  const activeProgressRef = useRef(0);
  const lastFlushRef = useRef(0);
  const receiveActiveRef = useRef(false);
  const deviceName = useMemo(() => (typeof navigator === "undefined" ? "Device" : guessDevice()), []);

  const totalBytes = useMemo(() => files.reduce((sum, f) => sum + f.size, 0), [files]);
  const totalSizeTooBig = totalBytes > MAX_TOTAL_BYTES;

  const inviteLink =
    typeof window !== "undefined" && code ? `${window.location.origin}/transfer?code=${code}` : "";

  // ─── Logs ──────────────────────────────────────────────────────────────
  const [log, setLog] = useState<LogEntry[]>([]);
  const addLog = useCallback((text: string, tone: LogEntry["tone"] = "info") => {
    const id = ++logIdRef.current;
    setLog((prev) => [...prev.slice(-40), { id, ts: Date.now(), text, tone }]);
  }, []);

  // Countdown ticker for code expiry + elapsed time
  useEffect(() => {
    const t = window.setInterval(() => {
      setElapsedTick((v) => v + 1);
      setNowTs(Date.now());
    }, 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const clearTimers = useCallback(() => {
    for (const ref of [joinTimerRef, copyTimerRef, expiryTimerRef]) {
      if (ref.current !== null) {
        window.clearTimeout(ref.current);
        ref.current = null;
      }
    }
  }, []);

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
  }, []);

  const teardown = useCallback(() => {
    clearTimers();
    cancelRef.current = true;
    destroyPeer();
    cancelRef.current = false;
    intentionallyClosedRef.current = false;
    transferActiveRef.current = false;
  }, [clearTimers, destroyPeer]);

  // Unmount cleanup that survives Fast Refresh (dev) and StrictMode's
  // double-mount: destruction is deferred a tick and skipped entirely if the
  // component mounted again in the meantime — a live P2P link is never killed
  // by a dev-time rebuild. Real tab closes are handled by `pagehide` below.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      window.setTimeout(() => {
        if (mountedRef.current) return; // remounted (Fast Refresh) — keep the link
        clearTimers();
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
      }, 300);
    };
  }, [clearTimers]);

  // Tell the other device immediately when this tab actually closes.
  useEffect(() => {
    const onHide = () => {
      try {
        connRef.current?.close();
        peerRef.current?.destroy();
      } catch {
        /* noop */
      }
    };
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, []);

  // Guard long transfers against accidental tab closes.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!transferActiveRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  const copyToClipboard = useCallback(async (text: string, key: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* noop */
      }
      document.body.removeChild(ta);
    }
    setCopied(key);
    if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => setCopied(null), 2000);
  }, []);

  // ─── Sender: send a whole queue of files ───────────────────────────────
  const sendAllFiles = useCallback(
    async (conn: DataConnection) => {
      const queue = filesRef.current;
      const total = queue.reduce((s, f) => s + f.size, 0);
      sentBytesRef.current = 0;
      lastFlushRef.current = 0;
      setSentBytes(0);
      setPhase("transferring");
      setSendStartedAt(Date.now());
      transferActiveRef.current = true;
      addLog(`Transferring ${queue.length} file${queue.length === 1 ? "" : "s"} (${formatBytes(total)})…`);
      try {
        const manifest: ManifestMsg = {
          t: "manifest",
          files: queue.map((f, i) => ({ id: i, name: f.name, size: f.size, mime: f.type || "application/octet-stream" })),
          totalSize: total,
        };
        conn.send(JSON.stringify(manifest));

        const chunkSize = bestChunkSize(conn);
        for (let i = 0; i < queue.length; i++) {
          if (cancelRef.current) throw new Error("cancelled");
          const file = queue[i];
          const mime = file.type || "application/octet-stream";
          const wireId = i;
          setActiveName(file.name);
          setActiveProgress(0);
          activeProgressRef.current = 0;

          conn.send(
            JSON.stringify({ t: "file-start", id: wireId, name: file.name, size: file.size, mime, idx: i, count: queue.length } satisfies FileStartMsg)
          );

          let offset = 0;
          while (offset < file.size) {
            if (cancelRef.current) throw new Error("cancelled");
            if (!conn.open) throw new Error("Connection lost");
            const end = Math.min(offset + chunkSize, file.size);
            const buf = await file.slice(offset, end).arrayBuffer();
            const frame = new ArrayBuffer(4 + buf.byteLength);
            new DataView(frame).setUint32(0, wireId);
            new Uint8Array(frame, 4).set(new Uint8Array(buf));
            conn.send(frame);
            offset = end;
            sentBytesRef.current += buf.byteLength;
            activeProgressRef.current = file.size > 0 ? offset / file.size : 1;
            // Throttled UI sync (~5×/s) — no setState per chunk.
            const t = Date.now();
            if (t - lastFlushRef.current >= 200) {
              lastFlushRef.current = t;
              setSentBytes(sentBytesRef.current);
              setActiveProgress(activeProgressRef.current);
            }
            // Backpressure: wait while the channel's send buffer is full.
            while (conn.open && conn.dataChannel && conn.dataChannel.bufferedAmount > BUFFER_HIGH_WATER) {
              await sleep(BUFFER_POLL_MS);
              if (!conn.open) throw new Error("Connection lost");
            }
          }
          conn.send(JSON.stringify({ t: "file-done", id: wireId } satisfies FileDoneMsg));
        }

        conn.send(JSON.stringify({ t: "all-done" } satisfies AllDoneMsg));
        setActiveName(null);
        setActiveProgress(1);
        setSentBytes(sentBytesRef.current);
        setSendFinishedAt(Date.now());
        setPhase("done");
        transferActiveRef.current = false;
        addLog("All files sent — transfer complete. ✅", "success");
      } catch (err) {
        transferActiveRef.current = false;
        if (cancelRef.current) {
          setPhase("idle");
          return;
        }
        setActiveName(null);
        setPhase("failed");
        const message = err instanceof Error && err.message === "Connection lost"
          ? "Connection to the other device was lost."
          : "Sending failed — the connection dropped.";
        setError(message);
        addLog(message, "error");
        try {
          conn.send(JSON.stringify({ t: "cancel", reason: "sender-error" } satisfies CancelMsg));
        } catch {
          /* noop */
        }
      }
    },
    [addLog]
  );

  // ─── Receiver: control message handling ────────────────────────────────
  const attachReceiverConn = useCallback(
    (conn: DataConnection, saveTarget: SaveTarget) => {
      const incomingById = new Map<number, ReceivedFile>();
      const memoryParts = saveTarget.memory;
      const dir = saveTarget.dir;
      // One writable per active file when streaming to disk — chunks are written
      // sequentially as they arrive, so 50 GB never has to fit in RAM.
      const writables = new Map<number, FileSystemWritableFileStream>();
      // Strict write serialization: FileSystemWritableFileStream rejects a
      // write() issued while a previous one is still in flight, so every write
      // is chained onto the previous operation's promise.
      const writeChains = new Map<number, Promise<void>>();
      // Chunks that arrived before the writable finished opening.
      const pendingBeforeWritable = new Map<number, ArrayBuffer[]>();

      const enqueueWrite = (id: number, chunk: ArrayBuffer, onFail?: () => void) => {
        const prev = writeChains.get(id) ?? Promise.resolve();
        const next = prev
          .then(async () => {
            const w = writables.get(id);
            if (!w) return;
            await w.write(chunk);
          })
          .catch(() => {
            // Disk write failed — degrade this file to memory buffering.
            writables.delete(id);
            saveTarget.streaming = false;
            const rf = incomingById.get(id);
            if (rf) rf.savedToDisk = false;
            const parts = memoryParts.get(id) ?? [];
            parts.push(chunk);
            memoryParts.set(id, parts);
            onFail?.();
          });
        writeChains.set(id, next);
      };

      const closeWritable = async (id: number, keep: boolean) => {
        // Wait for all queued writes to finish before closing/aborting.
        await writeChains.get(id);
        writeChains.delete(id);
        const w = writables.get(id);
        if (!w) return;
        writables.delete(id);
        try {
          if (keep) await w.close();
          else await w.abort();
        } catch {
          /* noop */
        }
      };

      const finalizeMemoryFile = (rf: ReceivedFile) => {
        try {
          const parts = memoryParts.get(rf.id) ?? [];
          const blob = new Blob(parts, { type: rf.mime });
          memoryParts.delete(rf.id);
          const url = URL.createObjectURL(blob);
          setIncoming(prev => prev.map(f => (f.id === rf.id ? { ...f, done: true, url } : f)));
          addLog(`"${rf.name}" ready to save (${formatBytes(rf.size)}).`, "success");
        } catch {
          setIncoming(prev => prev.map(f => (f.id === rf.id ? { ...f, failed: true } : f)));
          addLog(`Couldn't assemble "${rf.name}" — out of memory. Use Chrome/Edge for very large files.`, "error");
        }
      };

      conn.on("data", (raw: unknown) => {
        // Binary frame: [4-byte file id][payload]
        if (raw instanceof ArrayBuffer) {
          if (raw.byteLength <= 4) return;
          const wireId = new DataView(raw).getUint32(0);
          const rf = incomingById.get(wireId);
          if (!rf) return;
          const chunk = raw.slice(4);
          rf.received += chunk.byteLength;
          receivedBytesRef.current += chunk.byteLength;
          if (dir && saveTarget.streaming) {
            if (writables.has(rf.id)) {
              enqueueWrite(rf.id, chunk);
            } else {
              // Writable still opening — hold the chunk until it's ready.
              const queued = pendingBeforeWritable.get(rf.id) ?? [];
              queued.push(chunk);
              pendingBeforeWritable.set(rf.id, queued);
            }
          } else {
            const parts = memoryParts.get(rf.id) ?? [];
            parts.push(chunk);
            memoryParts.set(rf.id, parts);
          }
          // Throttled UI sync (~5×/s) — no setState per chunk.
          const now = Date.now();
          if (now - lastFlushRef.current >= 200) {
            lastFlushRef.current = now;
            setReceivedBytes(receivedBytesRef.current);
            setIncoming(prev => prev.map(f => (f.id === rf.id ? { ...f, received: rf.received } : f)));
          }
          return;
        }
        if (typeof raw !== "string") return;
        let msg: ControlMsg;
        try {
          msg = JSON.parse(raw) as ControlMsg;
        } catch {
          return;
        }
        if (!msg || typeof msg.t !== "string") return;

        switch (msg.t) {
          case "hello":
            setPeerDevice(msg.device ?? "Other device");
            addLog(`${msg.device} is ready to send.`);
            try {
              conn.send(JSON.stringify({ t: "accept", device: deviceName } satisfies AcceptMsg));
            } catch {
              /* noop */
            }
            break;
          case "manifest":
            setManifestCount(msg.files.length);
            setManifestSize(msg.totalSize);
            setJoinPhase("transferring");
            addLog(`Receiving ${msg.files.length} file${msg.files.length === 1 ? "" : "s"} (${formatBytes(msg.totalSize)})…`);
            break;
          case "file-start": {
            const rf: ReceivedFile = {
              id: msg.id,
              idx: msg.idx,
              name: msg.name,
              size: msg.size,
              mime: msg.mime,
              received: 0,
              done: false,
              savedToDisk: saveTarget.streaming,
            };
            incomingById.set(msg.id, rf);
            memoryParts.set(msg.id, []);
            setIncoming(prev => [...prev, rf]);
            if (dir && saveTarget.streaming) {
              void (async () => {
                let writable: FileSystemWritableFileStream | null = null;
                try {
                  const handle = await dir.getFileHandle(String(rf.id) + ".part", { create: true });
                  writable = await handle.createWritable();
                } catch {
                  saveTarget.streaming = false;
                  rf.savedToDisk = false;
                  addLog(`Couldn't create "${rf.name}" on disk — buffering in memory instead.`, "error");
                }
                if (writable) {
                  writables.set(rf.id, writable);
                }
                // Flush chunks that arrived while the writable was opening.
                const queued = pendingBeforeWritable.get(rf.id);
                if (queued) {
                  pendingBeforeWritable.delete(rf.id);
                  if (writables.has(rf.id)) {
                    for (const c of queued) enqueueWrite(rf.id, c);
                  } else {
                    // Disk open failed — keep everything in memory.
                    const parts = memoryParts.get(rf.id) ?? [];
                    parts.push(...queued);
                    memoryParts.set(rf.id, parts);
                  }
                }
              })();
            }
            break;
          }
          case "file-done": {
            const rf = incomingById.get(msg.id);
            if (!rf) break;
            if (dir && saveTarget.streaming) {
              void (async () => {
                try {
                  // Wait for an in-flight writable open, then drain queued writes.
                  for (let i = 0; i < 250 && writables.has(msg.id) && pendingBeforeWritable.has(msg.id); i++) await sleep(20);
                  if (!writables.has(msg.id) && pendingBeforeWritable.has(msg.id)) {
                    // Writable never opened (disk failure) — memory assembly instead.
                    finalizeMemoryFile(rf);
                    return;
                  }
                  await closeWritable(msg.id, true);
                  const partHandle = await dir.getFileHandle(String(msg.id) + ".part");
                  const finalHandle = await dir.getFileHandle(rf.name, { create: true });
                  const writable = await finalHandle.createWritable();
                  await writable.write(await partHandle.getFile());
                  await writable.close();
                  await dir.removeEntry(String(msg.id) + ".part");
                  memoryParts.delete(msg.id);
                  setIncoming(prev => prev.map(f => (f.id === msg.id ? { ...f, done: true, savedToDisk: true } : f)));
                  setReceivedBytes(receivedBytesRef.current);
                  addLog(`Saved "${rf.name}" (${formatBytes(rf.size)}).`, "success");
                } catch {
                  finalizeMemoryFile(rf);
                }
              })();
            } else {
              finalizeMemoryFile(rf);
            }
            break;
          }
          case "all-done":
            setJoinPhase("done");
            setReceivedBytes(receivedBytesRef.current);
            setIncoming(prev => prev.map(f => ({ ...f, received: f.size })));
            addLog("All files received — transfer complete. ✅", "success");
            break;
          case "cancel":
            for (const id of Array.from(writables.keys())) void closeWritable(id, false);
            receiveActiveRef.current = false;
            if (msg.reason === "busy") {
              setError("The sender is already paired with another device. Ask them to cancel that transfer or generate a new code, then try again.");
              addLog("Sender busy — already connected to another device.", "error");
            } else {
              setError("The sender cancelled the transfer or an error occurred on their side.");
              addLog("The sender cancelled the transfer or an error occurred.", "error");
            }
            setJoinPhase("failed");
            break;
        }
      });

      conn.on("close", () => {
        if (intentionallyClosedRef.current) return;
        for (const id of Array.from(writables.keys())) void closeWritable(id, false);
        receiveActiveRef.current = false;
        setReceivedBytes(receivedBytesRef.current);
        setJoinPhase(prev => (prev === "done" ? prev : "failed"));
        if (incomingById.size === 0) {
          setError("The sender closed the connection before any files were sent. Ask for a fresh code and try again.");
        }
        addLog("Connection closed — the sender went offline. Completed files are kept.", "error");
      });

      conn.on("error", () => {
        /* final state reported by `close` */
      });
    },
    [addLog, deviceName]
  );

  // ─── Sender: create room & wait for receiver ───────────────────────────
  const createRoom = useCallback(
    async () => {
      setError(null);
      setPhase("creating");
      sentBytesRef.current = 0;
      setSentBytes(0);
      setSendFinishedAt(null);
      setActiveName(null);
      setActiveProgress(0);
      setShowQr(false);
      setLog([]);
      destroyPeer();
      intentionallyClosedRef.current = false;

      const newCode = generateCode();
      codeRef.current = newCode;
      let peer: Peer;
      try {
        peer = new Peer(`fw-tx-${newCode}`, { config: { iceServers: ICE_SERVERS } });
      } catch {
        setError("This browser does not support WebRTC, which is required for transfers.");
        setPhase("failed");
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
        peer.on("open", () => settle("open"));
        peer.on("connection", (conn) => {
          if (connRef.current) {
            // Already paired with a device — tell the newcomer why, then drop it.
            conn.on("open", () => {
              try {
                conn.send(JSON.stringify({ t: "cancel", reason: "busy" } satisfies CancelMsg));
              } catch {
                /* noop */
              }
              window.setTimeout(() => {
                try { conn.close(); } catch { /* noop */ }
              }, 250);
            });
            return;
          }
          connRef.current = conn;
          conn.on("open", () => {
            setPhase("connected");
            setCodeExpiry(null);
            if (expiryTimerRef.current !== null) window.clearTimeout(expiryTimerRef.current);
            try {
              conn.send(JSON.stringify({ t: "hello", device: deviceName } satisfies HelloMsg));
            } catch {
              /* noop */
            }
            void sendAllFiles(conn);
          });
        });
        peer.on("error", (err) => {
          if (settled) return;
          if (err.type === "unavailable-id") settle("taken");
          else if (err.type === "network" || err.type === "server-error" || err.type === "socket-error" || err.type === "socket-closed" || err.type === "ssl-unavailable") {
            setError("Couldn't reach the free connection broker. Check your internet connection and try again.");
            settle("fatal");
          } else if (err.type === "browser-incompatible") {
            setError("Your browser doesn't support WebRTC, which is required for transfers.");
            settle("fatal");
          } else {
            settle("fatal");
          }
        });
      });

      if (outcome === "open") {
        setCode(newCode);
        setPhase("waiting");
        setCodeExpiry(Date.now() + CODE_TTL_MS);
        // Auto-expire: tear down the room when the TTL passes and no one connected.
        if (expiryTimerRef.current !== null) window.clearTimeout(expiryTimerRef.current);
        expiryTimerRef.current = window.setTimeout(() => {
          if (!connRef.current?.open && !intentionallyClosedRef.current) {
            destroyPeer();
            setPhase("failed");
            setError("The code expired after 10 minutes. Add your files again to get a fresh code.");
            setCodeExpiry(null);
          }
        }, CODE_TTL_MS);
        addLog(`Room ready — share code ${newCode}.`);
        return;
      }
      setPhase("failed");
    },
    [addLog, destroyPeer, deviceName, sendAllFiles]
  );

  const handleSendClick = useCallback(() => {
    if (files.length === 0 || totalSizeTooBig) return;
    setRole("sending");
    void createRoom();
  }, [createRoom, files.length, totalSizeTooBig]);

  const generateNewCode = useCallback(() => {
    void createRoom();
  }, [createRoom]);

  // ─── Sender: file selection ────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const list = Array.from(incoming);
      if (list.length === 0) return;
      setError(null);
      setFiles(prev => {
        const existing = new Set(prev.map(f => `${f.name}:${f.size}:${f.lastModified}`));
        const deduped = list.filter(f => !existing.has(`${f.name}:${f.size}:${f.lastModified}`));
        return [...prev, ...deduped];
      });
    },
    []
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearFiles = useCallback(() => setFiles([]), []);

  // ─── Receiver: pick save location, then connect ────────────────────────
  const pickDirectory = useCallback(async (): Promise<SaveTarget> => {
    const anyWindow = window as unknown as {
      showDirectoryPicker?: (options?: { mode?: "readwrite" }) => Promise<FileSystemDirectoryHandle>;
    };
    if (anyWindow.showDirectoryPicker) {
      try {
        setPickProgress(true);
        const dir = await anyWindow.showDirectoryPicker({ mode: "readwrite" });
        setSaveMode("streaming");
        return { streaming: true, dir, memory: new Map() };
      } catch (err) {
        // User dismissed the picker — treat as abort, not fallback.
        if (err instanceof DOMException && err.name === "AbortError") throw err;
        // Picker exists but failed (permissions etc.) — fall through to memory.
      } finally {
        setPickProgress(false);
      }
    }
    setSaveMode("memory");
    return { streaming: false, memory: new Map() };
  }, []);

  const connectAsReceiver = useCallback(
    async (rawCode: string) => {
      const code6 = normalizeCode(rawCode);
      if (code6.length !== CODE_LENGTH) {
        setError(`Enter the full ${CODE_LENGTH}-digit code.`);
        return;
      }
      if (receiveActiveRef.current) return; // a receive session is already running
      setError(null);
      setIncoming([]);
      setReceivedBytes(0);
      receivedBytesRef.current = 0;
      lastFlushRef.current = 0;
      setManifestCount(0);
      setManifestSize(0);
      setPeerDevice(null);
      setJoinPhase("connecting");
      setLog([]);
      intentionallyClosedRef.current = false;

      let saveTarget: SaveTarget;
      try {
        saveTarget = await pickDirectory();
      } catch {
        return; // user dismissed the folder picker — stay idle
      }
      setRole("receiving"); // switch to the receiving view for the whole session
      receiveActiveRef.current = true;
      saveTargetRef.current = saveTarget;
      if (saveTarget.streaming) addLog("Files will stream straight to the folder you picked.");

      destroyPeer();
      let peer: Peer;
      try {
        peer = new Peer({ config: { iceServers: ICE_SERVERS } });
      } catch {
        setError("This browser does not support WebRTC, which is required for transfers.");
        setJoinPhase("failed");
        return;
      }
      peerRef.current = peer;

      joinTimerRef.current = window.setTimeout(() => {
        if (!connRef.current?.open) {
          receiveActiveRef.current = false;
          setError(`No sender found with code ${code6}. Double-check the code — it expires after 10 minutes, and the sender's tab must stay open.`);
          setJoinPhase("failed");
          destroyPeer();
        }
      }, JOIN_TIMEOUT_MS);

      peer.on("open", () => {
        const conn = peer.connect(`fw-tx-${code6}`, { reliable: true, serialization: "raw" });
        connRef.current = conn;
        attachReceiverConn(conn, saveTarget);
        conn.on("open", () => {
          if (joinTimerRef.current !== null) {
            window.clearTimeout(joinTimerRef.current);
            joinTimerRef.current = null;
          }
          setJoinPhase("connected");
          addLog(`Connected to ${code6} — waiting for file info…`);
        });
      });

      peer.on("error", (err) => {
        if (connRef.current?.open) return;
        if (err.type === "peer-unavailable") {
          setError(`No sender found with code ${code6}. Double-check the code — it expires after 10 minutes.`);
        } else if (err.type === "network" || err.type === "server-error" || err.type === "socket-error" || err.type === "socket-closed" || err.type === "ssl-unavailable") {
          setError("Couldn't reach the free connection broker. Check your internet connection and try again.");
        } else if (err.type === "browser-incompatible") {
          setError("Your browser doesn't support WebRTC, which is required for transfers.");
        } else {
          setError("Connection failed. Check the code and try again.");
        }
        receiveActiveRef.current = false;
        setJoinPhase("failed");
        destroyPeer();
      });
    },
    [addLog, attachReceiverConn, destroyPeer, pickDirectory]
  );

  const handleReceiveClick = useCallback(() => {
    void connectAsReceiver(codeInput);
  }, [codeInput, connectAsReceiver]);

  // URL ?code= prefill is applied in the useState initializer above.

  // QR code generation (lazy-loaded, like image-qr-generator)
  useEffect(() => {
    if (!showQr || !inviteLink || qrDataUrl) return;
    let cancelled = false;
    void (async () => {
      try {
        const QRCode = (await import("qrcode")).default;
        const url = await QRCode.toDataURL(inviteLink, { width: 240, margin: 2 });
        if (!cancelled) setQrDataUrl(url);
      } catch {
        if (!cancelled) setQrDataUrl(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showQr, inviteLink, qrDataUrl]);

  const backToHome = useCallback(() => {
    teardown();
    saveTargetRef.current = null;
    receiveActiveRef.current = false;
    setRole(null);
    setPhase("idle");
    setJoinPhase("idle");
    setCode("");
    setCodeExpiry(null);
    setQrDataUrl(null);
    setShowQr(false);
    setIncoming([]);
    setSaveMode(null);
    setSentBytes(0);
    setReceivedBytes(0);
    receivedBytesRef.current = 0;
    sentBytesRef.current = 0;
    setSendStartedAt(null);
    setSendFinishedAt(null);
    setActiveName(null);
    setActiveProgress(0);
    setPeerDevice(null);
    setError(null);
    setLog([]);
  }, [teardown]);

  // ─── Derived values ─────────────────────────────────────────────────────
  const totalSize = files.reduce((s, f) => s + f.size, 0);
  const transferTotal = role === "sending" ? totalSize : manifestSize;
  const transferProgress = transferTotal > 0 ? Math.min(1, (role === "sending" ? sentBytes : receivedBytes) / transferTotal) : 0;
  const elapsedLabel = useMemo(() => {
    void elapsedTick; // re-render every second
    if (!sendStartedAt) return null;
    const end = sendFinishedAt ?? nowTs;
    const secs = Math.max(1, Math.round((end - sendStartedAt) / 1000));
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;    }, [elapsedTick, nowTs, sendStartedAt, sendFinishedAt]);

  const speedLabel = useMemo(() => {
    void elapsedTick;
    if (!sendStartedAt) return null;
    const elapsedMs = (sendFinishedAt ?? nowTs) - sendStartedAt;
    if (elapsedMs < 800) return null;
    const bps = (role === "sending" ? sentBytes : receivedBytes) / (elapsedMs / 1000);
    return `${formatBytes(bps)}/s`;    }, [elapsedTick, nowTs, sendStartedAt, sendFinishedAt, role, sentBytes, receivedBytes]);

  const overallPct = Math.round(transferProgress * 100);
  const receivedDoneCount = incoming.filter(f => f.done).length;

  // ═══════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════

  // ── Landing: Send Anywhere-style — upload on top, code input below ──
  if (role === null) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="heading-lg text-text-primary">Send files straight to any device</h1>
          <p className="body-md text-text-secondary mt-2 max-w-xl mx-auto">
            Up to <strong className="text-text-primary">50 GB</strong>, peer-to-peer and end-to-end encrypted.
            No sign-up, no cloud storage — files go directly from device to device.
          </p>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-danger/[0.05] border border-danger/25 flex items-start gap-3" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-danger mt-0.5 shrink-0" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <p className="text-[13px] font-semibold text-danger flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-text-tertiary hover:text-danger transition-colors shrink-0 rounded-md p-1" aria-label="Dismiss">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {/* ① Upload zone */}
        <section aria-labelledby="send-heading" className="mb-10">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent text-text-on-accent text-[11px] font-extrabold">1</span>
            <h2 id="send-heading" className="heading-md text-text-primary">Send files</h2>
          </div>

          <div
            className={`panel p-4 sm:p-6 transition-colors ${dragOver ? "dropzone-active" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="sr-only"
              onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
              aria-label="Choose files to send"
            />
            {files.length === 0 ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-3 py-10 sm:py-14 rounded-xl border-2 border-dashed border-border-strong hover:border-accent hover:bg-accent-subtle/30 transition-colors cursor-pointer"
              >
                <span className="w-14 h-14 rounded-2xl bg-accent-subtle flex items-center justify-center">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </span>
                <span className="text-sm font-semibold text-text-primary">Add files — click or drop here</span>
                <span className="text-xs text-text-tertiary">Any file type · up to 50 GB total · nothing is uploaded</span>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-text-primary">
                    {files.length} file{files.length === 1 ? "" : "s"} · {formatBytes(totalSize)}
                    {totalSizeTooBig && <span className="text-danger font-semibold"> — over the 50 GB limit</span>}
                  </p>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-ghost text-xs">
                      + Add more
                    </button>
                    <button type="button" onClick={clearFiles} className="btn-ghost text-xs text-danger hover:text-danger">
                      Clear all
                    </button>
                  </div>
                </div>
                <ul className="divide-y divide-border-base max-h-56 overflow-y-auto -mx-1 px-1">
                  {files.map((f, i) => (
                    <li key={`${f.name}:${f.size}:${f.lastModified}:${i}`} className="flex items-center gap-3 py-2">
                      <span aria-hidden="true" className="text-base shrink-0">{fileEmoji(f.name, f.type)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-medium text-text-primary truncate">{f.name}</span>
                        <span className="block text-[11px] text-text-tertiary">{formatBytes(f.size)}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="icon-btn w-7 h-7 shrink-0"
                        aria-label={`Remove ${f.name}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={handleSendClick}
                  disabled={totalSizeTooBig}
                  className="btn-primary w-full h-11 text-sm"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  Get transfer code
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-10" aria-hidden="true">
          <span className="h-px flex-1 bg-border-base" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">or</span>
          <span className="h-px flex-1 bg-border-base" />
        </div>

        {/* ② Receive with code */}
        <section aria-labelledby="receive-heading" className="mb-10">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent text-text-on-accent text-[11px] font-extrabold">2</span>
            <h2 id="receive-heading" className="heading-md text-text-primary">Receive files</h2>
          </div>
          <form
            className="panel p-4 sm:p-6"
            onSubmit={(e) => { e.preventDefault(); handleReceiveClick(); }}
          >
            <p className="text-[13px] text-text-secondary mb-3">
              Enter the <strong className="text-text-primary">6-digit code</strong> shown on the sending device. You&apos;ll pick a save folder before connecting.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                value={codeInput}
                onChange={(e) => setCodeInput(normalizeCode(e.target.value))}
                className="input flex-1 text-center font-mono text-xl tracking-[0.5em] sm:text-left sm:tracking-[0.35em] h-11"
                maxLength={CODE_LENGTH}
                aria-label="6-digit transfer code"
              />
              <button type="submit" disabled={codeInput.length !== CODE_LENGTH || pickProgress} className="btn-primary h-11 px-5 text-sm shrink-0">
                {pickProgress ? (
                  <>
                    <Spinner light /> Pick a folder…
                  </>
                ) : (
                  "Receive"
                )}
              </button>
            </div>
            <p className="text-[11px] text-text-tertiary mt-2.5">
              Codes expire after 10 minutes and work only while the sender&apos;s tab stays open.
            </p>
          </form>
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
              <p className="text-[12.5px] font-bold text-text-primary">Zero storage</p>
              <p className="text-[11.5px] text-text-secondary leading-snug mt-0.5">Files never touch a server — nothing is stored, ever.</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 p-3.5 bg-bg-surface border border-border-base rounded-xl">
            <span className="w-8 h-8 rounded-lg bg-accent-subtle flex items-center justify-center shrink-0">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <div>
              <p className="text-[12.5px] font-bold text-text-primary">End-to-end encrypted</p>
              <p className="text-[11.5px] text-text-secondary leading-snug mt-0.5">DTLS-encrypted direct link between the two devices.</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 p-3.5 bg-bg-surface border border-border-base rounded-xl">
            <span className="w-8 h-8 rounded-lg bg-warning/[0.12] flex items-center justify-center shrink-0">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </span>
            <div>
              <p className="text-[12.5px] font-bold text-text-primary">Up to 50 GB</p>
              <p className="text-[11.5px] text-text-secondary leading-snug mt-0.5">Streams straight to disk — bigger than your RAM.</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-12">
          <h2 className="heading-md text-text-primary mb-4">FAQ</h2>
          <div className="space-y-2.5">
            {[
              { q: "Are my files uploaded to a server?", a: "No. Files travel directly between the two devices over an encrypted peer-to-peer connection. Only the one-time handshake is brokered — file bytes never touch any server and nothing is ever stored." },
              { q: "How large can the files be?", a: "Up to 50 GB per transfer in browsers that support streaming to disk (Chrome, Edge, Opera). Firefox and Safari buffer in memory, which limits practical size to available RAM." },
              { q: "How long is the code valid?", a: "10 minutes, or until the transfer completes — whichever comes first. You can generate a fresh code in one click." },
              { q: "Do both devices need to be online?", a: "Yes. This is a direct device-to-device transfer, not a cloud upload. Both tabs must stay open until the transfer finishes." },
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

  // ── Shared status bar pieces ──
  const pct = overallPct;

  // ── SENDER VIEW ──
  if (role === "sending") {
    const waiting = phase === "creating" || phase === "waiting";
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="heading-lg text-text-primary">{waiting ? "Send files" : phase === "done" ? "Transfer complete" : "Sending…"}</h1>
            <p className="body-sm text-text-secondary mt-1">
              {files.length} file{files.length === 1 ? "" : "s"} · {formatBytes(totalSize)} · {deviceName}
            </p>
          </div>
          <button onClick={backToHome} className="btn-ghost text-xs shrink-0">
            ← Cancel
          </button>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-danger/[0.05] border border-danger/25 flex items-start gap-3" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-danger mt-0.5 shrink-0" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <p className="text-[13px] font-semibold text-danger flex-1">{error}</p>
          </div>
        )}

        {/* Waiting / code sharing */}
        {waiting && (
          <div className="panel p-4 sm:p-6 mb-6 space-y-5">
            <div className="flex items-center justify-center gap-2 px-3 py-2 bg-bg-elevated border border-border-strong rounded-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-warning border border-border-strong animate-pulse shrink-0" />
              <p className="text-xs font-semibold text-text-secondary">
                {phase === "creating" ? "Creating a secure room…" : "Waiting for the other device — keep this tab open."}
              </p>
            </div>

            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-3">
                Step 1 — enter this code on the other device
              </p>
              <div className="flex items-center justify-center gap-2">
                {code.split("").map((ch, i) => (
                  <span
                    key={i}
                    className="flex items-center justify-center w-10 h-14 sm:w-12 sm:h-16 bg-bg-surface border border-border-strong shadow-sm text-2xl sm:text-3xl font-extrabold font-mono text-text-primary rounded-lg"
                  >
                    {ch}
                  </span>
                ))}
              </div>
              {codeExpiry && (
                <p className="text-[11px] text-text-tertiary mt-2.5">
                  Expires in <span className="font-mono font-semibold text-text-secondary">{formatCountdown(codeExpiry - nowTs)}</span>
                </p>
              )}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                <button onClick={() => copyToClipboard(code, "code")} className="btn-primary px-4 py-2 text-xs">
                  {copied === "code" ? "✓ Code copied" : "Copy code"}
                </button>
                <button onClick={() => setShowQr(v => !v)} className="btn-secondary px-4 py-2 text-xs">
                  {showQr ? "Hide QR" : "Show QR"}
                </button>
                <button onClick={generateNewCode} className="btn-ghost text-xs">
                  New code
                </button>
              </div>
            </div>

            {showQr && (
              <div className="flex flex-col items-center gap-2 pt-2">
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- data URL from the qrcode lib; next/image adds nothing here
                  <img src={qrDataUrl} alt="QR code linking to this transfer" width={240} height={240} className="rounded-xl border border-border-strong bg-white p-2" />
                ) : (
                  <div className="w-[240px] h-[240px] rounded-xl border border-border-strong bg-bg-elevated flex items-center justify-center">
                    <Spinner />
                  </div>
                )}
                <p className="text-[11px] text-text-tertiary">Scan to open the receive page with the code filled in.</p>
              </div>
            )}

            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-2">Step 2 — or share the invite link</p>
              <div className="flex items-center gap-2">
                <input readOnly value={inviteLink} className="input flex-1 text-xs font-mono truncate" aria-label="Invite link" onFocus={(e) => e.currentTarget.select()} />
                <button onClick={() => copyToClipboard(inviteLink, "link")} className="btn-secondary px-4 py-2 text-xs shrink-0">
                  {copied === "link" ? "✓ Copied" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Connected / transferring / done */}
        {(phase === "connected" || phase === "transferring" || phase === "done" || phase === "failed") && (
          <div className="panel p-4 sm:p-6 mb-6 space-y-4">
            {phase === "connected" && (
              <div className="flex items-center gap-2.5 px-3 py-2.5 bg-bg-elevated border border-border-strong rounded-lg">
                <span className="w-2.5 h-2.5 rounded-full bg-success shrink-0" />
                <p className="text-xs font-semibold text-text-secondary flex-1">
                  {peerDevice ?? "Other device"} connected — starting transfer…
                </p>
                <Spinner />
              </div>
            )}

            {(phase === "transferring" || phase === "done" || phase === "failed") && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-text-primary truncate">{activeName ?? (phase === "done" ? "All files sent" : "Transfer")}</span>
                  <span className="text-text-secondary shrink-0 ml-2">
                    {formatBytes(role === "sending" ? sentBytes : 0)} / {formatBytes(totalSize)} · {pct}%
                  </span>
                </div>
                <div className="h-2.5 bg-bg-elevated border border-border-base rounded-full overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                  <div
                    className={`h-full rounded-full transition-[width] duration-200 ${phase === "failed" ? "bg-danger" : "bg-accent"}`}
                    style={{ width: `${phase === "failed" ? 100 : pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-text-tertiary">
                  <span>{speedLabel ? `${speedLabel} · ` : ""}{elapsedLabel ?? ""}</span>
                  {phase === "done" && sendFinishedAt && sendStartedAt && (
                    <span className="text-success font-semibold">Done in {elapsedLabel}</span>
                  )}
                </div>
              </div>
            )}

            {phase === "done" && (
              <div className="flex items-start gap-2.5 px-3 py-2.5 bg-success/[0.07] border border-success/25 rounded-lg">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <p className="text-xs font-semibold text-text-primary">
                  Sent {files.length} file{files.length === 1 ? "" : "s"} ({formatBytes(totalSize)}) — the other device now has everything.
                </p>
              </div>
            )}
          </div>
        )}

        {/* File list + activity log */}
        <div className="panel p-4 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-3">Queue</p>
          <ul className="divide-y divide-border-base">
            {files.map((f, i) => {
              const before = files.slice(0, i).reduce((s, x) => s + x.size, 0);
              const fileDone = phase === "done" || sentBytes >= before + f.size;
              const fileActive = phase === "transferring" && activeName === f.name;
              return (
                <li key={`${f.name}:${f.size}:${i}`} className="flex items-center gap-3 py-2.5">
                  <span aria-hidden="true">{fileEmoji(f.name, f.type)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium text-text-primary truncate">{f.name}</span>
                    <span className="block text-[11px] text-text-tertiary">{formatBytes(f.size)}</span>
                  </span>
                  <span className={`text-[11px] font-semibold shrink-0 ${fileDone ? "text-success" : fileActive ? "text-accent" : "text-text-tertiary"}`}>
                    {fileDone ? "✓ Sent" : fileActive ? `${Math.round(activeProgress * 100)}%` : "Queued"}
                  </span>
                </li>
              );
            })}
          </ul>

          {log.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border-base">
              <p className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-2">Activity</p>
              <ul className="space-y-1">
                {log.slice(-6).reverse().map((entry) => (
                  <li key={entry.id} className="flex items-center gap-2 text-[11.5px]">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${entry.tone === "error" ? "bg-danger" : entry.tone === "success" ? "bg-success" : "bg-text-tertiary"}`} />
                    <span className="text-text-secondary">{entry.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── RECEIVER VIEW ──
  const joining = joinPhase === "connecting" || joinPhase === "connected";
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="heading-lg text-text-primary">
            {joinPhase === "done" ? "Transfer complete" : joinPhase === "failed" ? "Transfer failed" : joining ? "Receiving…" : "Receiving files"}
          </h1>
          <p className="body-sm text-text-secondary mt-1">
            {manifestCount > 0
              ? `${manifestCount} file${manifestCount === 1 ? "" : "s"} · ${formatBytes(manifestSize)} · ${deviceName}`
              : `Code ${codeInput} · ${deviceName}`}
          </p>
        </div>
        <button onClick={backToHome} className="btn-ghost text-xs shrink-0">
          ← Cancel
        </button>
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-danger/[0.05] border border-danger/25 flex items-start gap-3" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-danger mt-0.5 shrink-0" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <p className="text-[13px] font-semibold text-danger flex-1">{error}</p>
        </div>
      )}

      {/* Connecting */}
      {joining && (
        <div className="panel p-4 sm:p-6 mb-6">
          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-bg-elevated border border-border-strong rounded-lg">
            <Spinner />
            <p className="text-xs font-semibold text-text-secondary flex-1">
              {joinPhase === "connecting" ? "Connecting to the sender…" : "Connected — waiting for file info…"}
            </p>
          </div>
          {peerDevice && (
            <p className="text-[11px] text-text-tertiary mt-3">Sender: {peerDevice}</p>
          )}
          {saveMode && (
            <p className="text-[11px] text-text-tertiary mt-1">
              Save target: {saveMode === "streaming" ? "the folder you picked (streaming to disk)" : "browser memory (one download per file)"}
            </p>
          )}
        </div>
      )}

      {/* Overall progress */}
      {(joinPhase === "transferring" || joinPhase === "done") && (
        <div className="panel p-4 sm:p-6 mb-6 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-text-primary">Overall progress</span>
              <span className="text-text-secondary">
                {formatBytes(receivedBytes)} / {formatBytes(manifestSize)} · {pct}%
              </span>
            </div>
            <div className="h-2.5 bg-bg-elevated border border-border-base rounded-full overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full bg-accent rounded-full transition-[width] duration-200" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex items-center justify-between text-[11px] text-text-tertiary">
              <span>{speedLabel ? `${speedLabel}` : ""}{saveMode ? ` · saving ${saveMode === "streaming" ? "to disk" : "to memory"}` : ""}</span>
              {receivedDoneCount > 0 && <span>{receivedDoneCount}/{manifestCount} files ready</span>}
            </div>
          </div>
          {joinPhase === "done" && (
            <div className="flex items-start gap-2.5 px-3 py-2.5 bg-success/[0.07] border border-success/25 rounded-lg">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <p className="text-xs font-semibold text-text-primary">
                {saveMode === "streaming"
                  ? "All files were saved straight into the folder you picked."
                  : "All files received — tap Save on each file below to keep them."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Incoming file list */}
      {incoming.length > 0 && (
        <div className="panel p-4 sm:p-6 mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-3">Files</p>
          <ul className="divide-y divide-border-base">
            {incoming.map((f) => {
              const fpct = f.size > 0 ? Math.min(100, Math.round((f.received / f.size) * 100)) : 0;
              return (
                <li key={f.id} className="py-2.5">
                  <div className="flex items-center gap-3">
                    <span aria-hidden="true">{fileEmoji(f.name, f.mime)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium text-text-primary truncate">{f.name}</span>
                      <span className="block text-[11px] text-text-tertiary">
                        {formatBytes(f.received)} / {formatBytes(f.size)}
                        {f.savedToDisk && !f.done ? " · streaming to disk" : ""}
                      </span>
                    </span>
                    {f.done && f.url && (
                      <a href={f.url} download={f.name} className="btn-primary px-3.5 py-1.5 text-xs shrink-0">
                        Save file
                      </a>
                    )}
                    {f.done && f.savedToDisk && !f.url && (
                      <span className="text-[11px] font-bold text-success shrink-0">✓ Saved to disk</span>
                    )}
                    {f.failed && <span className="text-[11px] font-bold text-danger shrink-0">Failed</span>}
                    {!f.done && !f.failed && (
                      <span className="text-[11px] font-semibold text-accent shrink-0 w-10 text-right">{fpct}%</span>
                    )}
                  </div>
                  {!f.done && !f.failed && (
                    <div className="mt-1.5 h-1.5 bg-bg-elevated border border-border-base rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full transition-[width] duration-200" style={{ width: `${fpct}%` }} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Activity log */}
      {log.length > 0 && (
        <div className="panel p-4 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-2">Activity</p>
          <ul className="space-y-1">
            {log.slice(-8).reverse().map((entry) => (
              <li key={entry.id} className="flex items-center gap-2 text-[11.5px]">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${entry.tone === "error" ? "bg-danger" : entry.tone === "success" ? "bg-success" : "bg-text-tertiary"}`} />
                <span className="text-text-secondary">{entry.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Finished — clear way back */}
      {joinPhase === "done" && (
        <div className="mt-6 flex items-center justify-center">
          <button onClick={backToHome} className="btn-primary px-5 py-2 text-xs">
            Receive more files
          </button>
        </div>
      )}

      {/* Retry after failure */}
      {joinPhase === "failed" && (
        <div className="mt-6 flex items-center justify-center gap-2.5">
          <button onClick={() => { void connectAsReceiver(codeInput); }} className="btn-primary px-5 py-2 text-xs">
            Try again
          </button>
          <button onClick={backToHome} className="btn-secondary px-5 py-2 text-xs">
            Enter a different code
          </button>
        </div>
      )}
    </div>
  );
}
