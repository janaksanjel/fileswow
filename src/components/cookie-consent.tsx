"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Professional GDPR-style cookie consent banner.
 * Accept → analytics allowed. Decline → essential-only. Choice persists in
 * localStorage (`fwwow-cookie-consent`) and the banner never shows again.
 * A small floating "Cookie settings" button lets users change their mind.
 */

const STORAGE_KEY = "fwwow-cookie-consent";

export type CookieConsent = "accepted" | "declined";

export function getStoredConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "accepted" || v === "declined" ? v : null;
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [consent, setConsent] = useState<CookieConsent | null>(null);

  useEffect(() => {
    const stored = getStoredConsent();
    if (stored) {
      // Defer to a task so the effect stays free of synchronous setState.
      const t = window.setTimeout(() => setConsent(stored), 0);
      return () => window.clearTimeout(t);
    }
    // Small delay so the page paints first — feels less intrusive.
    const t = window.setTimeout(() => setVisible(true), 800);
    return () => window.clearTimeout(t);
  }, []);

  const choose = (value: CookieConsent) => {
    window.localStorage.setItem(STORAGE_KEY, value);
    setConsent(value);
    setVisible(false);
  };

  return (
    <>
      {visible && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Cookie consent"
          className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-50 rounded-2xl border border-border-base bg-bg-surface shadow-2xl p-5"
        >
          <div className="flex items-start gap-3.5">
            <span className="shrink-0 w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-text-on-accent shadow-sm">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
                <path d="M8.5 8.5h.01M7 12.5h.01M11 15.5h.01M15 13h.01" />
              </svg>
            </span>
            <div className="min-w-0">
              <h2 className="text-[14px] font-bold text-text-primary">We value your privacy</h2>
              <p className="mt-1 text-[12.5px] leading-relaxed text-text-secondary">
                FilesWow processes your files <strong className="font-semibold text-text-primary">100% in your browser</strong> —
                we never see them. We only use optional cookies for anonymous analytics to improve the site.
                Read our{" "}
                <Link href="/privacy" className="text-accent font-medium underline underline-offset-2 hover:opacity-80">
                  Privacy&nbsp;Policy
                </Link>
                .
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2.5">
            <button
              onClick={() => choose("accepted")}
              className="btn-primary flex-1 text-[13px] active:scale-[0.98]"
            >
              Accept all
            </button>
            <button
              onClick={() => choose("declined")}
              className="btn-secondary flex-1 text-[13px] active:scale-[0.98]"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Floating button to reopen settings after a choice has been made */}
      {!visible && consent && (
        <button
          onClick={() => {
            window.localStorage.removeItem(STORAGE_KEY);
            setConsent(null);
            setVisible(true);
          }}
          className="fab-cookie fixed bottom-4 left-4 z-40 inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-border-base bg-bg-surface text-text-secondary text-[11.5px] font-semibold shadow-lg backdrop-blur-md hover:text-text-primary hover:border-border-strong transition-all"
          aria-label="Cookie settings"
          title="Cookie settings"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
            <path d="M8.5 8.5h.01M7 12.5h.01M11 15.5h.01" />
          </svg>
          Cookie settings
        </button>
      )}
    </>
  );
}
