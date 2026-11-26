"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

const A11Y_STORAGE_KEY = "fileswow-a11y";

interface A11yState {
  fontScale: 100 | 112 | 125 | 135;
  highContrast: boolean;
  dyslexicFont: boolean;
  highlightLinks: boolean;
  reduceMotion: boolean;
  lineSpacing: boolean;
  readingGuide: boolean;
  bigCursor: boolean;
}

const DEFAULT_A11Y: A11yState = {
  fontScale: 100,
  highContrast: false,
  dyslexicFont: false,
  highlightLinks: false,
  reduceMotion: false,
  lineSpacing: false,
  readingGuide: false,
  bigCursor: false,
};

function applyA11yToDom(state: A11yState) {
  const root = document.documentElement;
  root.style.fontSize = state.fontScale === 100 ? "" : `${state.fontScale}%`;
  root.classList.toggle("a11y-high-contrast", state.highContrast);
  root.classList.toggle("a11y-dyslexic", state.dyslexicFont);
  root.classList.toggle("a11y-highlight-links", state.highlightLinks);
  root.classList.toggle("a11y-reduce-motion", state.reduceMotion);
  root.classList.toggle("a11y-line-spacing", state.lineSpacing);
  root.classList.toggle("a11y-big-cursor", state.bigCursor);
}

export function AccessibilityWidget({ onGradient = false }: { onGradient?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<A11yState>(DEFAULT_A11Y);
  const [guideY, setGuideY] = useState(240);
  const [speaking, setSpeaking] = useState(false);

  // Load saved preferences on mount
  useEffect(() => {
    setMounted(true);
    queueMicrotask(() => {
      try {
        const raw = window.localStorage.getItem(A11Y_STORAGE_KEY);
        if (raw) {
          const parsed = { ...DEFAULT_A11Y, ...JSON.parse(raw) } as A11yState;
          setState(parsed);
          applyA11yToDom(parsed);
        }
      } catch {
        // Ignore storage errors
      }
    });
  }, []);

  const updateState = useCallback((updater: (prev: A11yState) => A11yState) => {
    setState((prev) => {
      const next = updater(prev);
      applyA11yToDom(next);
      try {
        window.localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    setState(DEFAULT_A11Y);
    applyA11yToDom(DEFAULT_A11Y);
    try {
      window.localStorage.removeItem(A11Y_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, []);

  // Reading Guide pointer tracking
  useEffect(() => {
    if (!state.readingGuide) return;
    const onMove = (e: PointerEvent) => setGuideY(e.clientY);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [state.readingGuide]);

  // Esc closes drawer
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Stop speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleReadAloud = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const mainEl = document.getElementById("main-content");
    const text = mainEl?.innerText?.trim() || document.body.innerText.trim();
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 6000));
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const activeCount =
    (state.fontScale !== 100 ? 1 : 0) +
    (state.highContrast ? 1 : 0) +
    (state.dyslexicFont ? 1 : 0) +
    (state.highlightLinks ? 1 : 0) +
    (state.reduceMotion ? 1 : 0) +
    (state.lineSpacing ? 1 : 0) +
    (state.readingGuide ? 1 : 0) +
    (state.bigCursor ? 1 : 0) +
    (speaking ? 1 : 0);

  const toggleItems: Array<{
    key: keyof Omit<A11yState, "fontScale">;
    label: string;
    desc: string;
    icon: React.ReactNode;
  }> = [
    {
      key: "highContrast",
      label: "High Contrast",
      desc: "Sharper text & borders",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3v18a9 9 0 0 0 0-18z" fill="currentColor" />
        </svg>
      ),
    },
    {
      key: "dyslexicFont",
      label: "Readable Font",
      desc: "Dyslexia-friendly letter spacing",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="4 7 4 4 20 4 20 7" />
          <line x1="9" y1="20" x2="15" y2="20" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </svg>
      ),
    },
    {
      key: "highlightLinks",
      label: "Highlight Links",
      desc: "Clear underline on all links",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      ),
    },
    {
      key: "lineSpacing",
      label: "Line Spacing",
      desc: "Extra vertical breathing room",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="11" y1="6" x2="21" y2="6" />
          <line x1="11" y1="12" x2="21" y2="12" />
          <line x1="11" y1="18" x2="21" y2="18" />
          <polyline points="3 8 6 5 9 8" />
          <polyline points="3 16 6 19 9 16" />
        </svg>
      ),
    },
    {
      key: "readingGuide",
      label: "Reading Guide",
      desc: "Focus ruler follows your pointer",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="9" width="18" height="6" rx="1.5" />
          <line x1="3" y1="4" x2="21" y2="4" />
          <line x1="3" y1="20" x2="21" y2="20" />
        </svg>
      ),
    },
    {
      key: "reduceMotion",
      label: "Reduce Motion",
      desc: "Disable transitions & animations",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <line x1="9" y1="9" x2="9" y2="15" />
          <line x1="15" y1="9" x2="15" y2="15" />
        </svg>
      ),
    },
    {
      key: "bigCursor",
      label: "Large Cursor",
      desc: "High-visibility pointer",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 3l14 9-6 2-3 6z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Accessibility tools"
        title="Accessibility tools"
        className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
          onGradient
            ? "text-white/90 hover:text-white hover:bg-white/15"
            : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
        }`}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
          <path d="M7.5 11.5h9" />
          <path d="M12 11.5v4l-2.5 3.5" />
          <path d="M12 15.5l2.5 3.5" />
        </svg>
        {activeCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-text-on-accent text-[9.5px] font-bold flex items-center justify-center shadow-xs">
            {activeCount}
          </span>
        )}
      </button>

      {/* Live Reading Guide bar */}
      {mounted &&
        state.readingGuide &&
        createPortal(
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-x-0 z-[120] h-10 -translate-y-1/2 border-y-2 border-accent/70 bg-accent/10 backdrop-blur-[0.5px]"
            style={{ top: `${guideY}px` }}
          />,
          document.body
        )}

      {/* Slide-over Accessibility Sheet */}
      {mounted &&
        open &&
        createPortal(
          <div className="fixed inset-0 z-[105] overflow-hidden">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Accessibility tools"
              className="fixed inset-y-0 right-0 z-[106] w-full max-w-[360px] bg-bg-surface border-l border-border-base shadow-[var(--elevation-xl)] flex flex-col animate-slide-left"
            >
              {/* Header */}
              <div className="px-4 sm:px-5 py-3.5 border-b border-border-base flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-accent-subtle text-accent-ink flex items-center justify-center shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
                      <path d="M7.5 11.5h9" />
                      <path d="M12 11.5v4l-2.5 3.5" />
                      <path d="M12 15.5l2.5 3.5" />
                    </svg>
                  </span>
                  <div>
                    <h2 className="text-[14.5px] font-semibold text-text-primary leading-tight">
                      Accessibility
                    </h2>
                    <p className="text-[11.5px] text-text-tertiary">
                      Display, reading &amp; audio
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-bg-elevated hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                  aria-label="Close accessibility tools"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-3.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {/* Apple-style Segmented Text Size */}
                <div>
                  <div className="flex items-center justify-between mb-1.5 px-1">
                    <span className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">
                      Text Size
                    </span>
                    <span className="text-[11.5px] font-mono font-semibold text-accent-ink">
                      {state.fontScale}%
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-bg-elevated border border-border-base">
                    {([100, 112, 125, 135] as const).map((scale) => (
                      <button
                        key={scale}
                        type="button"
                        onClick={() => updateState((prev) => ({ ...prev, fontScale: scale }))}
                        className={`h-8 rounded-lg text-[12px] font-semibold transition-all cursor-pointer ${
                          state.fontScale === scale
                            ? "bg-bg-surface text-text-primary shadow-xs ring-1 ring-border-base"
                            : "text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        {scale}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Read Page Aloud Pill */}
                <button
                  type="button"
                  onClick={toggleReadAloud}
                  className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl border transition-all cursor-pointer ${
                    speaking
                      ? "bg-accent text-text-on-accent border-accent shadow-xs"
                      : "bg-bg-elevated/55 hover:bg-bg-elevated text-text-primary border-border-base"
                  }`}
                >
                  <div className="flex items-center gap-3 text-left min-w-0">
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        speaking ? "bg-white/20 text-white" : "bg-bg-surface text-accent-ink border border-border-base"
                      }`}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <span className="block text-[13px] font-semibold truncate">
                        {speaking ? "Stop Reading Aloud" : "Read Page Aloud"}
                      </span>
                      <span className={`block text-[11px] truncate ${speaking ? "text-white/85" : "text-text-tertiary"}`}>
                        {speaking ? "Speaking current page…" : "Listen with speech synthesis"}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 ${
                      speaking ? "bg-white/20 text-white" : "bg-bg-surface text-text-primary border border-border-base"
                    }`}
                  >
                    {speaking ? "Stop" : "Play"}
                  </span>
                </button>

                {/* Grouped macOS/iOS Settings Rows with real Toggle Switches */}
                <div className="rounded-2xl border border-border-base bg-bg-elevated/35 divide-y divide-border-base overflow-hidden">
                  {toggleItems.map((item) => {
                    const active = state[item.key];
                    return (
                      <button
                        key={item.key}
                        type="button"
                        role="switch"
                        aria-checked={active}
                        onClick={() =>
                          updateState((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                        }
                        className="w-full flex items-center justify-between gap-3 px-3.5 py-2 text-left hover:bg-bg-elevated/70 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                              active
                                ? "bg-accent text-text-on-accent"
                                : "bg-bg-surface text-text-secondary border border-border-base"
                            }`}
                          >
                            {item.icon}
                          </span>
                          <div className="min-w-0">
                            <span className="block text-[13px] font-medium text-text-primary truncate">
                              {item.label}
                            </span>
                            <span className="block text-[11px] text-text-tertiary truncate">
                              {item.desc}
                            </span>
                          </div>
                        </div>

                        {/* iOS-style switch */}
                        <span
                          aria-hidden="true"
                          className={`relative inline-flex h-5.5 w-9.5 shrink-0 items-center rounded-full transition-colors duration-200 ${
                            active ? "bg-accent" : "bg-border-strong"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform duration-200 ${
                              active ? "translate-x-4.5" : "translate-x-1"
                            }`}
                          />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-border-base bg-bg-warm flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={resetAll}
                  disabled={activeCount === 0}
                  className="btn-secondary px-3.5 py-2 text-[12.5px] font-semibold disabled:opacity-40 cursor-pointer"
                >
                  Reset all
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn-primary px-5 py-2 text-[12.5px] font-semibold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
