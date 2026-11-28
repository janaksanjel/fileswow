"use client";

import { useEffect, useRef, useState } from "react";

const TOAST_EVENT = "fileswow:toast";

export interface ToastPayload {
  title: string;
  subtitle?: string;
}

/**
 * Trigger a clean, Apple-style completion toast from anywhere in the app.
 */
export function emitAppleToast(title: string, subtitle?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ToastPayload>(TOAST_EVENT, { detail: { title, subtitle } })
  );
}

/**
 * Global host mounted once in AppShell so every tool & page shares one
 * Apple-style floating toast without double-firing.
 */
export function GlobalAppleToastHost() {
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const lastShownAtRef = useRef(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ToastPayload>).detail;
      if (!detail?.title) return;
      const now = Date.now();
      // Deduplicate rapid back-to-back completion events from ToolClient + StepFlow
      if (now - lastShownAtRef.current < 700) return;
      lastShownAtRef.current = now;
      setToast({ title: detail.title, subtitle: detail.subtitle });
    };
    window.addEventListener(TOAST_EVENT, handler);
    return () => window.removeEventListener(TOAST_EVENT, handler);
  }, []);

  return (
    <AppleToast
      open={Boolean(toast)}
      title={toast?.title ?? ""}
      subtitle={toast?.subtitle}
      onClose={() => setToast(null)}
    />
  );
}

interface AppleToastProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  durationMs?: number;
}

/**
 * Clean, Apple-style frosted-glass floating pill toast shown when a tool
 * completes an operation.
 */
export function AppleToast({
  open,
  title,
  subtitle,
  onClose,
  durationMs = 3600,
}: AppleToastProps) {
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(t);
  }, [durationMs, onClose, open]);

  if (!open) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-5 left-1/2 -translate-x-1/2 z-[90] pointer-events-auto animate-in fade-in slide-in-from-top-3 duration-200"
    >
      <div className="flex items-center gap-3 pl-2.5 pr-4 py-2 rounded-full bg-bg-elevated/92 backdrop-blur-xl border border-border-base/80 shadow-[0_12px_36px_-8px_rgba(0,0,0,0.22)]">
        <span className="w-7 h-7 rounded-full bg-success/15 text-success flex items-center justify-center shrink-0">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
        <div className="min-w-0 leading-tight">
          <p className="text-[13px] font-semibold text-text-primary truncate max-w-[240px] sm:max-w-[340px]">
            {title}
          </p>
          {subtitle && (
            <p className="text-[11px] text-text-tertiary truncate max-w-[240px] sm:max-w-[340px]">
              {subtitle}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss notification"
          className="ml-1 w-6 h-6 rounded-full inline-flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * Clean FilesWow-branded loading skeleton displayed while a tool's JS bundle loads.
 */
export function ToolChunkLoader() {
  return (
    <div
      className="py-10 px-4 flex flex-col items-center justify-center gap-4"
      role="status"
      aria-live="polite"
      aria-label="Loading FilesWow tool"
    >
      <div className="relative w-12 h-12 flex items-center justify-center">
        <span className="absolute inset-0 rounded-full border-2 border-border-base" />
        <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin" />
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-accent"
          aria-hidden="true"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      </div>
      <div className="text-center space-y-1">
        <p className="text-[13.5px] font-bold text-text-primary">
          Loading FilesWow workspace…
        </p>
        <p className="text-[11.5px] text-text-tertiary">
          100% browser-based · No uploads
        </p>
      </div>
      <div className="w-full max-w-md space-y-2.5 pt-2">
        <div className="h-24 rounded-2xl bg-bg-elevated/80 border border-border-base animate-pulse" />
        <div className="grid grid-cols-3 gap-2">
          <div className="h-9 rounded-xl bg-bg-elevated/70 animate-pulse" />
          <div className="h-9 rounded-xl bg-bg-elevated/70 animate-pulse" />
          <div className="h-9 rounded-xl bg-bg-elevated/70 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
