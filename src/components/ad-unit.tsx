"use client";

// AdUnit — Google AdSense display ad for inline placements.
//
// Setup:
// 1. After AdSense approval, create display ad units in the AdSense dashboard.
// 2. Copy each unit's data-ad-slot number into the env vars below (in .env.local
//    and your hosting provider's env settings). No slot ID → nothing renders,
//    so this is safe to deploy before approval.
// 3. The loader script itself lives in src/app/layout.tsx (<head>), publisher
//    ca-pub-5534909600353741.

import { useEffect, useRef } from "react";

const CLIENT_ID = "ca-pub-5534909600353741";

// Slot IDs from the AdSense dashboard. Optional: unset → component renders nothing.
const SLOTS: Record<string, string | undefined> = {
  home: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME,
  category: process.env.NEXT_PUBLIC_ADSENSE_SLOT_CATEGORY,
  tool: process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOOL,
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdUnitProps {
  /** Which ad slot to render — must have a NEXT_PUBLIC_ADSENSE_SLOT_* env var set to display. */
  slot: keyof typeof SLOTS;
  /** Layout class for the placeholder/ad container. */
  className?: string;
}

export function AdUnit({ slot, className = "" }: AdUnitProps) {
  const adSlot = SLOTS[slot];
  const pushedRef = useRef(false);

  useEffect(() => {
    if (!adSlot || pushedRef.current) return;
    pushedRef.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Loader script not ready (blocked, slow network) — AdSense retries on its own.
    }
  }, [adSlot]);

  // No slot configured (pre-approval) → render nothing at all.
  if (!adSlot) return null;

  return (
    <div className={`ad-unit ${className}`} aria-hidden="true">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={CLIENT_ID}
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

/**
 * Dev-only placeholder so you can see where ads will sit before approval.
 * Renders nothing in production builds.
 */
export function AdPlaceholder({ label, className = "" }: { label: string; className?: string }) {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div
      className={`flex items-center justify-center rounded-xl border border-dashed border-border-strong bg-bg-elevated/50 text-[11px] font-bold uppercase tracking-widest text-text-tertiary min-h-[100px] ${className}`}
      aria-hidden="true"
    >
      Ad — {label}
    </div>
  );
}

/**
 * Complete ad placement: dev placeholder + AdSense unit + the spacing
 * wrapper, all in one. Renders NOTHING when no ad slot env var is set
 * (production) — so pages have no empty gap where an ad would be.
 * In dev, the placeholder still shows so placements stay visible.
 */
export function AdSlot({ slot, label, className = "" }: { slot: keyof typeof SLOTS; label: string; className?: string }) {
  const configured = Boolean(SLOTS[slot]);

  // Production (or any env) with no slot env var → no markup at all.
  if (!configured && process.env.NODE_ENV !== "development") return null;

  return (
    <div className={className}>
      <AdPlaceholder label={label} />
      <AdUnit slot={slot} />
    </div>
  );
}
