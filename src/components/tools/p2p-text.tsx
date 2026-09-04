"use client";

// P2P Chat — encrypted WebRTC chat between two devices.
//
// A 4-character room code IS the PeerJS peer ID. The free PeerJS cloud broker
// (0.peerjs.com) only exchanges the one-time WebRTC handshake (SDP/ICE) that
// lets the two browsers find each other. After that, every message flows
// directly between the two devices over an encrypted (DTLS) data channel —
// the broker never sees chat content. No account, no API key, no uploads.

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import Peer, { type DataConnection } from "peerjs";

type Phase = "home" | "host" | "join" | "chat";

interface ChatMessage {
  id: number;
  from: "self" | "peer";
  text: string;
  ts: number;
}

// Wire protocol envelope (JSON string sent over the data connection).
// Long messages are chunked; the receiver reassembles by transfer id.
interface MsgEnvelope {
  t: "msg";
  id: number;
  i: number;
  n: number;
  d: string;
}

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
const JOIN_TIMEOUT_MS = 25_000;

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

export default function P2PTextTool() {
  const [phase, setPhase] = useState<Phase>("home");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const [roomCode, setRoomCode] = useState("");
  const [joinInput, setJoinInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [linkState, setLinkState] = useState<"connecting" | "connected" | "closed" | null>(null);

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const intentionallyClosedRef = useRef(false);
  const phaseRef = useRef<Phase>("home");
  const urlJoinDoneRef = useRef(false);
  const msgIdRef = useRef(0);
  const uidRef = useRef(0); // transfer ids for chunking
  const inboxRef = useRef(new Map<number, { n: number; parts: (string | undefined)[] }>());
  const joinTimeoutRef = useRef<number | null>(null);
  const copyTimerRef = useRef<number | null>(null);
  const draftRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const addMessage = useCallback((from: "self" | "peer", text: string) => {
    setMessages((prev) => [...prev, { id: msgIdRef.current++, from, text, ts: Date.now() }]);
  }, []);

  // Auto-scroll the message list to the newest message.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

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

  const handleData = useCallback(
    (data: unknown) => {
      if (typeof data !== "string") return;
      let parsed: unknown;
      try {
        parsed = JSON.parse(data);
      } catch {
        return; // Not our protocol — ignore.
      }
      const env = parsed as Partial<MsgEnvelope>;
      if (env?.t !== "msg" || typeof env.d !== "string") return;
      const { id, i, n } = env;
      if (typeof id !== "number" || typeof i !== "number" || typeof n !== "number") return;
      if (n < 1 || i < 0 || i >= n) return;

      const map = inboxRef.current;
      let entry = map.get(id);
      if (entry === undefined) {
        entry = { n, parts: new Array<string | undefined>(n) };
        map.set(id, entry);
      }
      entry.parts[i] = env.d;
      if (entry.parts.every((p) => p !== undefined)) {
        const text = (entry.parts as string[]).join("");
        map.delete(id);
        addMessage("peer", text);
      }
    },
    [addMessage]
  );

  const handleConnOpen = useCallback(() => {
    setPhase("chat");
    setLinkState("connected");
    setError(null);
    setBusy(false);
  }, []);

  const attachConn = useCallback(
    (conn: DataConnection) => {
      connRef.current = conn;
      conn.on("open", handleConnOpen);
      conn.on("data", handleData);
      conn.on("close", () => {
        if (intentionallyClosedRef.current) return;
        connRef.current = null;
        setLinkState("closed");
      });
      conn.on("error", () => {
        // Channel errors are usually transient; `close` reports the final state.
      });
    },
    [handleConnOpen, handleData]
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
  }, []);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (joinTimeoutRef.current !== null) window.clearTimeout(joinTimeoutRef.current);
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
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
    };
  }, []);

  const resetAll = useCallback(() => {
    if (joinTimeoutRef.current !== null) window.clearTimeout(joinTimeoutRef.current);
    if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
    intentionallyClosedRef.current = true;
    destroyPeer();
    intentionallyClosedRef.current = false;
    setPhase("home");
    setError(null);
    setNote(null);
    setRoomCode("");
    setJoinInput("");
    setMessages([]);
    setDraft("");
    setEmojiOpen(false);
    setLinkState(null);
    setBusy(false);
  }, [destroyPeer]);

  // ─── Device 1: create a room with a 4-char code ──────────────────
  // Retry loop: if a generated code happens to be taken (rare), roll a new
  // one until the broker accepts the ID, a real error occurs, or we give up.
  const createHostRoom = useCallback(async () => {
    setBusy(true);
    setError(null);
    destroyPeer();
    for (let attempt = 0; attempt < 8; attempt++) {
      const code = generateCode();
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
  }, [attachConn, destroyPeer]);

  const handleHostClick = useCallback(() => {
    setPhase("host");
    void createHostRoom();
  }, [createHostRoom]);

  // ─── Device 2: join with a 4-char code ───────────────────────────
  const handleJoinClick = useCallback(
    (raw: string) => {
      const code = normalizeCode(raw);
      if (code.length !== CODE_LENGTH) {
        setError(`Enter the full ${CODE_LENGTH}-character code.`);
        return;
      }
      urlJoinDoneRef.current = true; // user took over from the invite link
      setError(null);
      setBusy(true);
      setLinkState("connecting");
      destroyPeer();
      let peer: Peer;
      try {
        peer = new Peer({ config: { iceServers: ICE_SERVERS, sdpSemantics: "unified-plan" } });
      } catch {
        setError("This browser does not support WebRTC, which is required for P2P Chat.");
        setBusy(false);
        return;
      }
      peerRef.current = peer;

      peer.on("open", () => {
        const conn = peer.connect(code, { reliable: true });
        attachConn(conn);
      });
      peer.on("error", (err) => {
        if (connRef.current?.open) return; // link is live — broker hiccups don't affect the chat
        if (err.type === "peer-unavailable") {
          setError(`No chat room found with code ${code}. Double-check the code with your friend — rooms disappear when the host closes the page.`);
          setBusy(false);
          setLinkState(null);
          destroyPeer();
        } else if (
          err.type === "network" ||
          err.type === "server-error" ||
          err.type === "socket-error" ||
          err.type === "socket-closed" ||
          err.type === "ssl-unavailable"
        ) {
          setError("Couldn't reach the free connection broker (0.peerjs.com). Check your internet connection and try again.");
          setBusy(false);
          setLinkState(null);
          destroyPeer();
        } else if (err.type === "browser-incompatible") {
          setError("Your browser doesn't support WebRTC, which is required for P2P Chat.");
          setBusy(false);
          setLinkState(null);
          destroyPeer();
        }
      });

      if (joinTimeoutRef.current !== null) window.clearTimeout(joinTimeoutRef.current);
      joinTimeoutRef.current = window.setTimeout(() => {
        const conn = connRef.current;
        if (!conn?.open && phaseRef.current === "join") {
          setError("Couldn't connect. Is the other device still on this page with this code open?");
          setBusy(false);
          setLinkState(null);
          destroyPeer();
        }
      }, JOIN_TIMEOUT_MS);
    },
    [attachConn, destroyPeer]
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
      if (urlJoinDoneRef.current) return;
      urlJoinDoneRef.current = true;
      handleJoinRef.current(normalized);
    }, 400);
    return () => window.clearTimeout(t);
  }, []);

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
    addMessage("self", text);
    setDraft("");
    if (text.length <= CHUNK_SIZE) {
      const single: MsgEnvelope = { t: "msg", id: 0, i: 0, n: 1, d: text };
      conn.send(JSON.stringify(single));
    } else {
      const id = ++uidRef.current;
      const n = Math.ceil(text.length / CHUNK_SIZE);
      for (let i = 0; i < n; i++) {
        const chunk: MsgEnvelope = { t: "msg", id, i, n, d: text.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE) };
        conn.send(JSON.stringify(chunk));
      }
    }
  }, [addMessage, draft]);

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
      setDraft(next);
      setEmojiOpen(false);
      // Restore focus and cursor after the state update.
      window.requestAnimationFrame(() => {
        ta?.focus();
        const pos = start + emoji.length;
        ta?.setSelectionRange(pos, pos);
      });
    },
    [draft]
  );

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const inviteLink =
    typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}?code=${roomCode}` : "";

  // ─── UI ─────────────────────────────────────────────────────────────
  const stepBadge = (n: number) => (
    <span className="flex items-center justify-center w-6 h-6 bg-accent border-2 border-border-strong text-text-on-accent text-[11px] font-extrabold shrink-0 shadow-[2px_2px_0_var(--shadow-color)]">
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
          your messages go <strong className="text-text-primary">directly between the two browsers</strong> over an encrypted link.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onClick={handleHostClick} disabled={busy} className="btn-primary w-full flex flex-col items-start gap-1 p-4 text-left">
            <span className="flex items-center gap-2">
              {busy && <Spinner />}
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
        <StatusRow status="waiting" text="Room ready — waiting for a friend to join with this code." />
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

          <div className="bg-bg-elevated border-2 border-border-strong p-4 flex items-center justify-center gap-3">
            {roomCode.split("").map((ch, i) => (
              <span
                key={i}
                className="flex items-center justify-center w-12 h-14 sm:w-14 sm:h-16 bg-bg-surface border-2 border-border-strong shadow-[3px_3px_0_var(--shadow-color)] text-3xl font-extrabold font-mono text-text-primary"
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

        <div className="flex items-center gap-2.5 px-3 py-2.5 bg-bg-elevated border-2 border-border-strong rounded-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-warning border-2 border-border-strong animate-pulse shrink-0" />
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
              className="w-full text-center text-3xl font-extrabold font-mono tracking-[0.4em] px-3 py-4 rounded-lg bg-bg-input border-2 border-border-strong text-text-primary placeholder:text-text-tertiary/60 placeholder:tracking-normal focus:border-accent focus:outline-none"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleJoinClick(joinInput)}
                disabled={busy || joinInput.length !== CODE_LENGTH}
                className="btn-primary px-5 py-2 text-xs"
              >
                {busy ? (
                  <span className="flex items-center gap-2">
                    <Spinner />
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

  // Connected — chat
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-border-base">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full border-2 border-border-strong ${linkState === "connected" ? "bg-success" : "bg-warning"}`} />
          <p className="text-xs font-bold text-text-primary">
            {linkState === "connected" ? "Connected" : linkState === "closed" ? "Disconnected" : "Connecting…"}
          </p>
          {roomCode && (
            <span className="px-1.5 py-0.5 bg-bg-elevated border-2 border-border-strong text-[10px] font-extrabold font-mono text-text-secondary">
              ROOM {roomCode}
            </span>
          )}
        </div>
        <button onClick={resetAll} className="text-[11px] font-bold text-text-tertiary hover:text-danger transition-colors">
          End session
        </button>
      </div>

      {error && <ErrorNote message={error} onDismiss={() => setError(null)} />}
      {linkState === "closed" && (
        <div className="p-3 bg-bg-elevated border border-border-base rounded-lg flex items-center justify-between gap-3">
          <p className="text-xs text-text-secondary">The other device closed the connection or went offline.</p>
          <button onClick={resetAll} className="btn-secondary px-3 py-1.5 text-xs shrink-0">New session</button>
        </div>
      )}

      {/* Messages */}
      <div className="h-72 sm:h-80 overflow-y-auto space-y-3 px-3 py-3 bg-bg-elevated border-2 border-border-strong">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <p className="text-base font-bold text-text-secondary mb-1">Link is live 🎉</p>
            <p className="text-xs text-text-tertiary">Say hi — messages appear here instantly on both devices.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.from === "self" ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[85%] px-3 py-2 border-2 border-border-strong text-[13px] leading-relaxed whitespace-pre-wrap break-words shadow-[2px_2px_0_var(--shadow-color)] ${
                  msg.from === "self" ? "bg-accent text-text-on-accent" : "bg-bg-surface text-text-primary"
                }`}
              >
                {msg.text}
              </div>
              <span className="mt-1 px-1 text-[10px] font-medium text-text-tertiary">
                {msg.from === "self" ? "You" : "Friend"} · {formatTime(msg.ts)}
              </span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="relative space-y-2">
        {emojiOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setEmojiOpen(false)} aria-hidden="true" />
            <div className="absolute bottom-full left-0 mb-2 z-50 w-80 max-w-[90vw] bg-bg-surface border-2 border-border-strong shadow-[4px_4px_0_var(--shadow-color)] p-2">
              <p className="px-1 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-text-tertiary">Emoji</p>
              <div className="max-h-56 overflow-y-auto grid grid-cols-8 gap-0.5">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => insertEmoji(e)}
                    className="flex items-center justify-center aspect-square text-lg hover:bg-bg-elevated transition-colors"
                    aria-label={`Insert ${e}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => setEmojiOpen((v) => !v)}
            disabled={linkState !== "connected"}
            className="btn-secondary w-11 h-11 text-lg shrink-0 px-0 py-0 disabled:opacity-50"
            aria-label="Emoji picker"
            title="Emoji"
          >
            😊
          </button>
          <textarea
            ref={draftRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onComposerKeyDown}
            disabled={linkState !== "connected"}
            placeholder={linkState === "connected" ? "Type a message… (Enter to send)" : "Waiting for the link…"}
            rows={2}
            className="flex-1 px-3 py-2.5 rounded-lg bg-bg-input border-2 border-border-strong text-text-primary text-sm resize-none placeholder:text-text-tertiary focus:border-accent focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={sendDraft}
            disabled={linkState !== "connected" || !draft.trim()}
            className="btn-primary px-5 py-2.5 text-sm shrink-0"
          >
            Send
          </button>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-text-tertiary">
            {draft.length.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()} chars — messages are sent in chunks
          </p>
        </div>
      </div>
    </div>
  );
}

function ErrorNote({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="p-3 bg-bg-surface border-2 border-danger shadow-[3px_3px_0_var(--shadow-color)] flex items-start gap-2.5">
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
    <div className="flex items-center gap-2.5 px-3 py-2.5 bg-bg-elevated border-2 border-border-strong rounded-lg">
      <span className={`w-2.5 h-2.5 rounded-full border-2 border-border-strong shrink-0 ${status === "connected" ? "bg-success" : "bg-warning animate-pulse"}`} />
      <p className="text-xs font-semibold text-text-secondary">{text}</p>
    </div>
  );
}

function Spinner() {
  return <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow shrink-0" aria-hidden="true" />;
}