"use client";

import { useEffect, useRef, useState } from "react";

interface ShareButtonsProps {
  url: string;
  title: string;
  label?: string;
}

export function ShareButtons({ url, title, label = "Share this tool" }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [sharedPlatform, setSharedPlatform] = useState<string | null>(null);
  const copyTimerRef = useRef<number | null>(null);
  const shareTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
      if (shareTimerRef.current !== null) window.clearTimeout(shareTimerRef.current);
    };
  }, []);

  const triggerThankYou = (platformName: string) => {
    setSharedPlatform(platformName);
    if (shareTimerRef.current !== null) window.clearTimeout(shareTimerRef.current);
    shareTimerRef.current = window.setTimeout(() => {
      setSharedPlatform(null);
    }, 6000);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      triggerThankYou("Copy link");
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback ignored if clipboard permission is unavailable
    }
  };

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedWhatsapp = encodeURIComponent(`${title} — ${url}`);

  const platforms = [
    {
      name: "WhatsApp",
      href: `https://wa.me/?text=${encodedWhatsapp}`,
      brandClass:
        "bg-[#25D366] text-white border-[#25D366] hover:bg-[#1ebe5d] hover:border-[#1ebe5d]",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      ),
    },
    {
      name: "X",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      brandClass:
        "bg-[#0F1419] text-white border-[#0F1419] dark:bg-white dark:text-[#0F1419] dark:border-white hover:opacity-90",
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      brandClass:
        "bg-[#1877F2] text-white border-[#1877F2] hover:bg-[#1465d1] hover:border-[#1465d1]",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      ),
    },
    {
      name: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      brandClass:
        "bg-[#0A66C2] text-white border-[#0A66C2] hover:bg-[#0958a8] hover:border-[#0958a8]",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect x="2" y="9" width="4" height="12" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      ),
    },
    {
      name: "Telegram",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      brandClass:
        "bg-[#26A5E4] text-white border-[#26A5E4] hover:bg-[#1d92cc] hover:border-[#1d92cc]",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      ),
    },
    {
      name: "Reddit",
      href: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
      brandClass:
        "bg-[#FF4500] text-white border-[#FF4500] hover:bg-[#e03d00] hover:border-[#e03d00]",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="13" r="8" />
          <circle cx="9.5" cy="12.5" r="1" />
          <circle cx="14.5" cy="12.5" r="1" />
          <path d="M9.5 16c1 .8 4 .8 5 0" />
          <path d="M12 5l2-3 3 1" />
        </svg>
      ),
    },
    {
      name: "Pinterest",
      href: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}`,
      brandClass:
        "bg-[#E60023] text-white border-[#E60023] hover:bg-[#cc001f] hover:border-[#cc001f]",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M9 17l2-7.5" />
          <path d="M10.5 13.5c1 .8 3.5.5 4-1.5s-1-4-3.5-4-4 1.5-3.5 3.5" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-3" aria-label={label}>
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <span className="w-full sm:w-auto text-[12px] sm:text-[12.5px] font-medium text-text-secondary sm:mr-1">
          Share:
        </span>

        <button
          type="button"
          onClick={handleCopy}
          className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-[12px] sm:text-[12.5px] font-semibold shadow-xs transition-all cursor-pointer active:scale-[0.98] ${
            copied
              ? "bg-success text-white border-success"
              : "bg-accent text-text-on-accent border-accent hover:bg-accent-hover hover:border-accent-hover"
          }`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          <span>{copied ? "Copied!" : "Copy link"}</span>
        </button>

        {platforms.map((p) => (
          <a
            key={p.name}
            href={p.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => triggerThankYou(p.name)}
            aria-label={`Share on ${p.name}`}
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-[12px] sm:text-[12.5px] font-semibold shadow-xs transition-all active:scale-[0.98] ${p.brandClass}`}
          >
            {p.icon}
            <span>{p.name}</span>
          </a>
        ))}
      </div>

      {sharedPlatform && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between gap-3 rounded-xl bg-success/12 border border-success/30 px-3.5 py-2.5 text-[13px] text-text-primary"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-lg leading-none" aria-hidden="true">
              😊
            </span>
            <span>
              <strong className="font-semibold">Congratulations &amp; thank you!</strong>{" "}
              {sharedPlatform === "Copy link"
                ? "Link copied — thanks for sharing this tool with others!"
                : `Thanks for sharing on ${sharedPlatform}!`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSharedPlatform(null)}
            aria-label="Dismiss thank you message"
            className="text-text-tertiary hover:text-text-primary text-xs font-semibold px-1.5 py-0.5 rounded-lg transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
