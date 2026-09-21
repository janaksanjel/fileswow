"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ALL_TOOLS, CATEGORY_COUNTS, type ToolDef } from "@/lib/catalog";
import { SITE_NAME } from "@/lib/site";

/**
 * "Wow" — the FilesWow support assistant.
 * A fully client-side, rule-based chatbot that knows the whole site:
 * tools, categories, privacy model, transfer, and more.
 * No server, no API — instant answers with links to the right tools.
 *
 * Chat history is persisted to localStorage as a browser session.
 * Clearing the chat starts a brand-new session.
 */

interface BotLink {
  label: string;
  href: string;
}

interface ChatMessage {
  id: number;
  from: "bot" | "user";
  text: string;
  links?: BotLink[];
  chips?: string[];
}

const BOT_NAME = "Wow";

const GREETING_TEXT = `Hey there! 👋 I'm ${BOT_NAME} — the friendly helper around ${SITE_NAME}. Looking for a tool, curious how things work, or just browsing? Ask me anything — I don't bite.`;
const GREETING_CHIPS = ["What is FilesWow?", "Find a tool", "Is it really private?", "Transfer files"];

function makeGreeting(id: number): ChatMessage {
  return { id, from: "bot", text: GREETING_TEXT, chips: GREETING_CHIPS };
}

// ─── Session persistence (localStorage) ───────────────────────────

const STORAGE_KEY = "fwwow-chat-session-v1";
const MAX_STORED_MESSAGES = 100;

interface StoredSession {
  sessionId: string;
  startedAt: number;
  messages: ChatMessage[];
}

function newSessionId(): string {
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadSession(): StoredSession {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredSession;
        if (
          parsed &&
          typeof parsed.sessionId === "string" &&
          Array.isArray(parsed.messages) &&
          parsed.messages.length > 0 &&
          parsed.messages.every((m) => m && typeof m.id === "number" && typeof m.text === "string" && (m.from === "bot" || m.from === "user"))
        ) {
          return parsed;
        }
      }
    } catch {
      // Corrupted storage — fall through and start fresh.
    }
  }
  return { sessionId: newSessionId(), startedAt: Date.now(), messages: [makeGreeting(0)] };
}

function saveSession(session: StoredSession) {
  if (typeof window === "undefined") return;
  try {
    // Cap the stored history so localStorage never grows unbounded.
    const trimmed = session.messages.slice(-MAX_STORED_MESSAGES);
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...session, messages: trimmed })
    );
  } catch {
    // Storage full/blocked — chat still works, just won't persist.
  }
}

// ─── Tool search over the catalog ─────────────────────────────────

const STOP_WORDS = new Set([
  "a", "an", "the", "to", "for", "of", "in", "on", "how", "do", "i",
  "my", "me", "can", "you", "find", "want", "need", "tool", "tools",
  "please", "help", "some", "any", "with", "from", "is", "are", "it",
]);

function searchTools(query: string, max: number = 4): ToolDef[] {
  const tokens = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
  if (tokens.length === 0) return [];

  const scored = ALL_TOOLS.map((tool) => {
    const name = tool.name.toLowerCase();
    const desc = tool.description.toLowerCase();
    let score = 0;
    for (const t of tokens) {
      if (name === t) score += 10;
      else if (name.includes(t)) score += 5;
      if (desc.includes(t)) score += 2;
      if (tool.slug.includes(t)) score += 3;
    }
    return { tool, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max);

  return scored.map((s) => s.tool);
}

function toolsToLinks(tools: ToolDef[]): BotLink[] {
  return tools.map((t) => ({ label: `${t.icon} ${t.name}`, href: `/tools/${t.slug}` }));
}

// ─── Intent knowledge base ────────────────────────────────────────

interface Answer {
  text: string;
  links?: BotLink[];
  chips?: string[];
}

function has(text: string, ...words: string[]): boolean {
  return words.some((w) => text.includes(w));
}

function answer(qRaw: string): Answer {
  const q = qRaw.toLowerCase();

  // ── Identity questions come FIRST — they always win ────────────

  // Who made the bot / the site — the human answer
  if (
    has(
      q,
      "who made you", "who made this", "who created you", "who created this", "who built you",
      "who built this", "who developed", "your creator", "your developer", "your maker",
      "your owner", "who owns", "who is the owner", "creator", "founder", "developer",
      "janak", "sanjel", "nepal", "author", "who wrote", "whose site"
    )
  ) {
    return {
      text: "I was built by Janak Sanjel 👨‍💻 — a developer from Nepal who created FilesWow so everyone could have fast, private file tools without paywalls or sign-ups. He's the human behind me; I just do the typing. 😄 Want to see more of his work? His personal site is worth a visit:",
      links: [
        { label: "🌐 janaksanjel.com.np", href: "https://janaksanjel.com.np" },
        { label: "ℹ️ About FilesWow", href: "/about" },
      ],
      chips: ["What is FilesWow?", "Find a tool", "Is it really private?"],
    };
  }

  // Who the bot is — answered warmly, like a person would
  if (
    has(
      q,
      "who are you", "who r u", "hu r u", "what are you", "your name", "may i know your name",
      "are you a bot", "are you human", "are you real", "are you ai", "are you robot",
      "introduce yourself", "tell me about yourself", "what should i call you"
    )
  ) {
    return {
      text: "I'm Wow 🙂 — the little assistant that lives on FilesWow. Honestly? I'm software, not a person — but I was taught by one, and I really do enjoy helping people find the right tool in seconds instead of hunting through menus. So, what brings you here today?",
      chips: ["Find a tool", "Is it really private?"],
    };
  }

  // ── Everything else ─────────────────────────────────────────────

  // Greetings
  if (/^(hi|hello|hey|yo|hola|good (morning|afternoon|evening))\b/.test(q) || q === "hi!") {
    return {
      text: "Hey! 😊 Good to see you. What can I help you find today? You can ask me things like \"how do I merge PDFs?\" or \"which tools are free?\"",
      chips: [ "Find a tool", "PDF tools", "Is it really private?", "What is FilesWow?"],
    };
  }

  // What is the site
  if (has(q, "what is fileswow", "about this site", "what is this site", "about fileswow", "what do you do", "what can you do")) {
    return {
      text: `${SITE_NAME} is a suite of ${ALL_TOOLS.length} free online tools for PDF, Word and image files — merge, split, compress, convert, edit, sign and more. Everything runs 100% in your browser: no uploads, no accounts, no watermarks, completely private. There's also device-to-device file transfer up to 50 GB.`,
      links: [
        { label: "🏠 Home", href: "/" },
        { label: "ℹ️ About us", href: "/about" },
      ],
      chips: ["Find a tool", "PDF tools", "Transfer files"],
    };
  }

  // Free / pricing
  if (has(q, "free", "price", "pricing", "cost", "pay", "subscription", "premium", "pro")) {
    return {
      text: "Yep — every single tool here is 100% free. No subscriptions, no accounts, no watermarks, and no limits. Janak built it that way on purpose: good tools shouldn't come with a paywall.",
      chips: ["Find a tool", "What is FilesWow?"],
    };
  }

  // Privacy / safety / upload
  if (has(q, "private", "privacy", "safe", "secure", "upload", "server", "data", "cookie", "tracking", "gdpr")) {
    return {
      text: "Great question — and a fair one! Your files never leave your device. Everything happens locally in your browser, and nothing is uploaded to any server, so we physically can't peek at your files. Only optional, anonymous analytics cookies are used (you can decline them in Cookie settings). The Privacy Policy has every detail.",
      links: [{ label: "🔒 Privacy Policy", href: "/privacy" }],
      chips: ["What is FilesWow?", "Find a tool"],
    };
  }

  // Transfer
  if (has(q, "transfer", "send file", "share file", "p2p", "peer")) {
    return {
      text: "FilesWow Transfer lets you send files directly from your device to another person — peer-to-peer, encrypted, up to 50 GB, with no cloud storage in between. The recipient just opens the link while you keep the tab open.",
      links: [{ label: "📤 Open Transfer", href: "/transfer" }],
      chips: ["Is it really private?", "What is FilesWow?"],
    };
  }

  // Category hubs
  if (has(q, "pdf tool", "pdf tools", "all pdf")) {
    return {
      text: `We have ${CATEGORY_COUNTS.pdf} PDF tools — merge, split, compress, convert to/from Word & JPG, watermark, protect, sign, OCR, and more.`,
      links: [
        { label: "📄 All PDF Tools", href: "/pdf-tools" },
        { label: "🔗 Merge PDF", href: "/tools/merge-pdf" },
        { label: "✂️ Split PDF", href: "/tools/split-pdf" },
        { label: "🗜️ Compress PDF", href: "/tools/compress-pdf" },
      ],
      chips: ["Compress a PDF", "PDF to Word", "Find a tool"],
    };
  }
  if (has(q, "word tool", "word tools", "docx", ".doc", "all word")) {
    return {
      text: `We have ${CATEGORY_COUNTS.word} Word tools — convert Word to PDF, merge documents, extract text, protect files and more.`,
      links: [
        { label: "📝 All Word Tools", href: "/word-tools" },
        { label: "🔄 Word to PDF", href: "/tools/word-to-pdf" },
        { label: "🔗 Merge Word", href: "/tools/merge-word" },
      ],
      chips: ["Word to PDF", "Find a tool"],
    };
  }
  if (has(q, "image tool", "image tools", "photo", "picture", "jpg", "png", "all image")) {
    return {
      text: `We have ${CATEGORY_COUNTS.image} image tools — compress, resize, crop, convert JPG/PNG/WebP, remove backgrounds, add filters and more.`,
      links: [
        { label: "🖼️ All Image Tools", href: "/image-tools" },
        { label: "🗜️ Compress Image", href: "/tools/compress-image" },
        { label: "✨ Remove Background", href: "/tools/background-remove-image" },
      ],
      chips: ["Compress an image", "Find a tool"],
    };
  }
  if (has(q, "text tool", "text tools", "all text")) {
    return {
      text: `We have ${CATEGORY_COUNTS.text} text & data tools — word counters, case converters, JSON/formatter utilities and more.`,
      links: [{ label: "🔤 All Text Tools", href: "/text-tools" }],
      chips: ["Find a tool"],
    };
  }

  // How many tools
  if (has(q, "how many", "number of tools")) {
    return {
      text: `There are ${ALL_TOOLS.length} tools in total: ${CATEGORY_COUNTS.pdf} PDF, ${CATEGORY_COUNTS.word} Word, ${CATEGORY_COUNTS.image} image and ${CATEGORY_COUNTS.text} text & data tools — all free, all in-browser.`,
      chips: ["PDF tools", "Word tools", "Image tools"],
    };
  }

  // Contact / support
  if (has(q, "contact", "support", "email", "feedback", "bug", "report", "issue")) {
    return {
      text: "Found a bug, or just want to say hi? The About page has all the ways to reach us — real messages get read by a real human (Janak himself). And of course, I'm always here if you need help finding a tool!",
      links: [{ label: "ℹ️ About & Contact", href: "/about" }],
      chips: ["What is FilesWow?", "Find a tool"],
    };
  }

  // Thanks / bye
  if (has(q, "thank", "thanks", "thx", "great", "awesome", "perfect")) {
    return { text: "Anytime! 😊 That's what I'm here for. Anything else I can help with?", chips: ["Find a tool", "What is FilesWow?"] };
  }
  if (has(q, "bye", "goodbye", "see you", "later")) {
    return { text: "See you around! 👋 I'll be right here if you ever need me." };
  }

  // Shortcut: known tool names mentioned directly (compress a pdf, word to pdf, ...)
  const direct = searchTools(q, 4);

  // Generic "find a tool"
  if (has(q, "find", "search", "looking for", "where", "which tool", "need a tool", "help me") || direct.length > 0) {
    if (direct.length > 0) {
      const first = direct[0];
      return {
        text: `I found ${direct.length > 1 ? `${direct.length} matching tools` : "this tool"} — the best match is "${first.name}": ${first.description}`,
        links: toolsToLinks(direct),
        chips: ["PDF tools", "Is it really private?"],
      };
    }
    return {
      text: "I can point you to the right tool — just tell me what you want to do, e.g. \"compress a PDF\", \"convert Word to PDF\" or \"remove image background\". Or browse the full catalog:",
      links: [
        { label: "📄 PDF Tools", href: "/pdf-tools" },
        { label: "📝 Word Tools", href: "/word-tools" },
        { label: "🖼️ Image Tools", href: "/image-tools" },
        { label: "🔤 Text Tools", href: "/text-tools" },
      ],
    };
  }

  // Fallback: try tool search one more time, else polite fallback
  const fallback = searchTools(q, 3);
  if (fallback.length > 0) {
    return {
      text: "This might be what you're looking for:",
      links: toolsToLinks(fallback),
      chips: ["Find a tool", "PDF tools"],
    };
  }

  return {
    text: "Hmm, you got me there 🤔 — I'm just a small helper, best at finding tools and explaining how FilesWow works. Try something like \"how do I merge PDFs?\" or pick a suggestion below.",
    chips: ["What is FilesWow?", "Find a tool", "Transfer files"],
  };
}

// ─── Component ────────────────────────────────────────────────────

export function SupportBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([makeGreeting(0)]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const idCounter = useRef(1);
  const sessionRef = useRef<StoredSession>({ sessionId: newSessionId(), startedAt: Date.now(), messages: [] });

  // Restore the previous chat session from localStorage (client-only,
  // after first paint, so SSR markup and hydration always match).
  useEffect(() => {
    const stored = loadSession();
    sessionRef.current = stored;
    setMessages(stored.messages);
    const maxId = stored.messages.reduce((m, msg) => Math.max(m, msg.id), 0);
    idCounter.current = maxId + 1;
    setHydrated(true);
  }, []);

  // Persist chat history whenever it changes.
  useEffect(() => {
    if (!hydrated) return;
    sessionRef.current = { ...sessionRef.current, messages };
    saveSession(sessionRef.current);
  }, [messages, hydrated]);

  // Scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing, open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [open]);

  const push = useCallback((msg: Omit<ChatMessage, "id">) => {
    setMessages((prev) => [...prev, { ...msg, id: idCounter.current++ }]);
  }, []);

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text || typing) return;
      push({ from: "user", text });
      setInput("");
      setTyping(true);
      // Small human-feeling delay before the answer
      window.setTimeout(() => {
        const a = answer(text);
        push({ from: "bot", text: a.text, links: a.links, chips: a.chips });
        setTyping(false);
      }, 450 + Math.random() * 350);
    },
    [push, typing]
  );

  // Clear chat → start a brand-new session.
  const clearChat = useCallback(() => {
    const fresh: StoredSession = {
      sessionId: newSessionId(),
      startedAt: Date.now(),
      messages: [makeGreeting(0)],
    };
    sessionRef.current = fresh;
    idCounter.current = 1;
    setMessages(fresh.messages);
    saveSession(fresh);
    inputRef.current?.focus();
  }, []);

  const lastChips = [...messages].reverse().find((m) => m.from === "bot" && m.chips)?.chips;

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div
          role="dialog"
          aria-label={`${BOT_NAME} support chat`}
          className="fixed bottom-[4.75rem] left-3 right-3 sm:left-auto sm:right-5 sm:w-[380px] z-50 flex flex-col rounded-2xl border border-border-base bg-bg-surface shadow-2xl overflow-hidden sm:h-[560px] h-[min(70vh,560px)]"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-accent to-accent-hover text-white shrink-0">
            <span className="relative w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-[17px]">
              🙂
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-accent" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold leading-tight">{BOT_NAME}</p>
              <p className="text-[11px] text-white/80 leading-tight">FilesWow Assistant · always online</p>
            </div>
            {/* Clear chat — starts a new session */}
            {messages.length > 1 && (
              <button
                onClick={clearChat}
                className="w-8 h-8 rounded-lg hover:bg-white/15 flex items-center justify-center transition-colors"
                aria-label="Clear chat and start a new session"
                title="Clear chat — start new session"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                </svg>
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-lg hover:bg-white/15 flex items-center justify-center transition-colors"
              aria-label="Close chat"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3.5 py-4 space-y-3 bg-bg-base">
            {messages.map((m) => (
              <div key={m.id} className={m.from === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    m.from === "user"
                      ? "max-w-[85%] rounded-2xl rounded-br-md px-3.5 py-2.5 bg-accent text-white text-[13px] leading-relaxed shadow-sm"
                      : "max-w-[88%] rounded-2xl rounded-bl-md px-3.5 py-2.5 bg-bg-surface border border-border-base text-text-primary text-[13px] leading-relaxed shadow-sm"
                  }
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  {m.links && m.links.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1.5">
                      {m.links.map((l) => {
                        const cls = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-elevated border border-border-base text-[12.5px] font-semibold text-accent hover:bg-accent hover:text-white hover:border-accent transition-all";
                        const arrow = (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        );
                        return l.href.startsWith("http") ? (
                          <a key={l.href + l.label} href={l.href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className={cls}>
                            {l.label}
                            {arrow}
                          </a>
                        ) : (
                          <Link key={l.href + l.label} href={l.href} onClick={() => setOpen(false)} className={cls}>
                            {l.label}
                            {arrow}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-bg-surface border border-border-base shadow-sm">
                  <span className="flex gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce [animation-delay:120ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce [animation-delay:240ms]" />
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick reply chips */}
          {lastChips && !typing && (
            <div className="px-3 pt-2 pb-1 flex gap-1.5 overflow-x-auto shrink-0 bg-bg-base [scrollbar-width:none]">
              {lastChips.map((c) => (
                <button
                  key={c}
                  onClick={() => send(c)}
                  className="shrink-0 px-3 py-1.5 rounded-full border border-border-base bg-bg-surface text-[12px] font-medium text-text-secondary hover:text-accent hover:border-accent transition-colors"
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 p-3 border-t border-border-base bg-bg-surface shrink-0"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything…"
              className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-bg-base border border-border-base text-[13px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/60 focus:border-accent"
              aria-label="Message"
            />
            <button
              type="submit"
              disabled={!input.trim() || typing}
              className="w-10 h-10 shrink-0 rounded-xl bg-accent text-white flex items-center justify-center shadow-sm hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="Send message"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Floating button — bottom-right, dragged down low */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 right-4 sm:right-5 z-50 w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-b from-accent-light to-accent text-white shadow-xl border border-accent-hover/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        aria-label={open ? "Close support chat" : "Open support chat"}
        title={`Need help? Chat with ${BOT_NAME}`}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
    </>
  );
}
