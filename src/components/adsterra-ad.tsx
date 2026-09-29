"use client";

import { useEffect, useMemo, useState } from "react";
import adsterraConfig from "@/config/adsterra.json";

export type AdsterraSlotKey = keyof typeof adsterraConfig.slots;

interface BannerSlotConfig {
  id: string;
  name: string;
  format: string;
  width?: number;
  height?: number;
  enabled: boolean;
  key?: string;
  rawCode?: string;
  scriptUrl?: string;
  note?: string;
}

/**
 * Master On/Off switch helper.
 * If "on": false or "enabled": false in adsterra.json, all ads immediately stop.
 */
export function isAdsterraOn(): boolean {
  const cfg = adsterraConfig as { on?: boolean | string; enabled?: boolean | string };
  if (cfg.on === false || cfg.on === "false" || cfg.on === "off") {
    return false;
  }
  if (cfg.enabled === false || cfg.enabled === "false" || cfg.enabled === "off") {
    return false;
  }
  return Boolean(cfg.on ?? cfg.enabled ?? true);
}

/**
 * Extracts a script URL from raw HTML code if only rawCode was pasted.
 */
function extractScriptSrc(rawHtml: string): string | null {
  const match = rawHtml.match(/src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

/**
 * Renders an isolated iframe banner for Adsterra.
 * Using an iframe prevents document.write conflicts, isolated window.atOptions,
 * and avoids breaking React 19 hydration or client-side navigation.
 */
export function AdsterraBanner({
  slotKey,
  className = "",
}: {
  slotKey: AdsterraSlotKey;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isAdsterraOn()) {
    return null;
  }

  const slot = adsterraConfig.slots[slotKey] as unknown as BannerSlotConfig | undefined;
  if (!slot || !slot.enabled) {
    return null;
  }

  const width = slot.width || 300;
  const height = slot.height || 250;
  const hasKey = Boolean(slot.key && slot.key.trim().length > 0);
  const hasRawCode = Boolean(slot.rawCode && slot.rawCode.trim().length > 0);
  const hasScriptUrl = Boolean(slot.scriptUrl && slot.scriptUrl.trim().length > 0);
  const hasAdCode = hasKey || hasRawCode || hasScriptUrl;

  // In development, if ad code is not yet pasted, display a friendly placeholder
  if (!hasAdCode) {
    if (process.env.NODE_ENV === "development") {
      return (
        <div
          className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-border-strong bg-bg-elevated/40 text-center p-3 transition-colors ${className}`}
          style={{ maxWidth: `${width}px`, minHeight: `${height}px`, width: "100%" }}
          aria-hidden="true"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-accent mb-1">
            Adsterra Ad — {slot.name} ({width}x{height})
          </span>
          <span className="text-[10px] text-text-tertiary">
            ID: {slot.id} • Ready for ad key in <code className="text-text-secondary">src/config/adsterra.json</code>
          </span>
        </div>
      );
    }
    return null;
  }

  // Avoid SSR hydration issues with iframe srcDoc
  if (!mounted) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ width: `${width}px`, height: `${height}px` }}
        aria-hidden="true"
      />
    );
  }

  const srcDoc = hasRawCode
    ? `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <base target="_blank">
    <style>
      html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; display: flex; align-items: center; justify-content: center; background: transparent; }
    </style>
  </head>
  <body>
    ${slot.rawCode}
  </body>
</html>`
    : `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <base target="_blank">
    <style>
      html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; display: flex; align-items: center; justify-content: center; background: transparent; }
    </style>
  </head>
  <body>
    <script type="text/javascript">
      atOptions = {
        'key' : '${slot.key}',
        'format' : 'iframe',
        'height' : ${height},
        'width' : ${width},
        'params' : {}
      };
    </script>
    <script type="text/javascript" src="${slot.scriptUrl || `https://www.highrevenueformat.com/${slot.key}/invoke.js`}"></script>
  </body>
</html>`;

  return (
    <div className={`flex flex-col items-center justify-center my-4 ${className}`} aria-label="Advertisement">
      <div className="text-[10px] uppercase tracking-wider text-text-tertiary/60 mb-1 font-semibold select-none">
        Advertisement
      </div>
      <iframe
        title={`Adsterra ${slot.name}`}
        srcDoc={srcDoc}
        width={width}
        height={height}
        className="rounded-lg shadow-sm border-0 overflow-hidden bg-transparent"
        style={{ width: `${width}px`, height: `${height}px`, border: "none" }}
        loading="lazy"
        scrolling="no"
      />
    </div>
  );
}

/**
 * Responsive Banner:
 * Displays a Leaderboard (728x90) on desktop screens, and a compact/mobile banner (468x60 or 300x250)
 * on mobile/tablet screens so ads never overflow the viewport on smartphones.
 */
export function AdsterraResponsiveBanner({
  desktopSlot = "banner728x90",
  mobileSlot = "banner468x60",
  className = "",
}: {
  desktopSlot?: AdsterraSlotKey;
  mobileSlot?: AdsterraSlotKey;
  className?: string;
}) {
  if (!isAdsterraOn()) {
    return null;
  }

  const desktopConfig = adsterraConfig.slots[desktopSlot] as BannerSlotConfig | undefined;
  const mobileConfig = adsterraConfig.slots[mobileSlot] as BannerSlotConfig | undefined;

  const isDesktopEnabled = desktopConfig?.enabled ?? false;
  const isMobileEnabled = mobileConfig?.enabled ?? false;

  if (!isDesktopEnabled && !isMobileEnabled) {
    return null;
  }

  return (
    <div className={`w-full flex flex-col items-center justify-center ${className}`}>
      {/* Desktop Banner (screens >= 768px) */}
      {isDesktopEnabled && (
        <div className="hidden md:flex justify-center w-full">
          <AdsterraBanner slotKey={desktopSlot} />
        </div>
      )}

      {/* Mobile Banner (screens < 768px) */}
      {isMobileEnabled && (
        <div className="flex md:hidden justify-center w-full">
          <AdsterraBanner slotKey={mobileSlot} />
        </div>
      )}
    </div>
  );
}

/**
 * Global Page-Level Scripts (Social Bar, Popunder, Native Banner):
 * Dynamically injects script tags only on client-side when enabled.
 */
export function AdsterraPageScripts() {
  useEffect(() => {
    if (!isAdsterraOn()) return;

    const addedScripts: HTMLScriptElement[] = [];

    // 1. Social Bar (ID: 31474502)
    const socialBar = adsterraConfig.slots.socialBar;
    const isSocialBarActive =
      socialBar?.enabled &&
      (adsterraConfig.homePage?.enableSocialBar ?? true) &&
      Boolean(socialBar.scriptUrl || socialBar.rawCode);

    if (isSocialBarActive) {
      const src = socialBar.scriptUrl || extractScriptSrc(socialBar.rawCode || "");
      if (src) {
        const s = document.createElement("script");
        s.type = "text/javascript";
        s.src = src;
        s.async = true;
        document.head.appendChild(s);
        addedScripts.push(s);
      }
    }

    // 2. Popunder (ID: 31474501)
    const popunder = adsterraConfig.slots.popunder;
    const isPopunderActive =
      popunder?.enabled &&
      (adsterraConfig.homePage?.enablePopunder ?? true) &&
      Boolean(popunder.scriptUrl || popunder.rawCode);

    if (isPopunderActive) {
      const src = popunder.scriptUrl || extractScriptSrc(popunder.rawCode || "");
      if (src) {
        const s = document.createElement("script");
        s.type = "text/javascript";
        s.src = src;
        s.async = true;
        document.head.appendChild(s);
        addedScripts.push(s);
      }
    }

    return () => {
      // Clean up on component unmount
      for (const s of addedScripts) {
        if (s.parentNode) {
          s.parentNode.removeChild(s);
        }
      }
    };
  }, []);

  return null;
}

/**
 * Side Rails:
 * Displays vertical skyscraper banners (160x300 or 160x600) on the left and right gutters
 * on wide desktop screens (>= 1530px) without overlapping page content.
 */
export function AdsterraSideRails({
  slotKey = "banner160x300",
}: {
  slotKey?: AdsterraSlotKey;
}) {
  const [closedLeft, setClosedLeft] = useState(false);
  const [closedRight, setClosedRight] = useState(false);

  if (!isAdsterraOn()) {
    return null;
  }

  const isEnabled = (adsterraConfig.homePage as { enableSideRails?: boolean })?.enableSideRails ?? true;
  if (!isEnabled) {
    return null;
  }

  const slot = adsterraConfig.slots[slotKey] as BannerSlotConfig | undefined;
  if (!slot?.enabled) {
    return null;
  }

  return (
    <>
      {/* Left Side Rail */}
      {!closedLeft && (
        <aside
          className="hidden min-[1530px]:flex fixed left-3 top-32 z-40 flex-col items-center"
          aria-label="Left Side Advertisement"
        >
          <div className="relative group">
            <button
              onClick={() => setClosedLeft(true)}
              className="absolute -top-2.5 -right-2 w-5 h-5 rounded-full bg-bg-elevated border border-border-base text-text-tertiary hover:text-text-primary text-[11px] font-bold flex items-center justify-center shadow-md cursor-pointer z-50 transition-colors"
              title="Close ad"
              aria-label="Close left advertisement"
            >
              ×
            </button>
            <AdsterraBanner slotKey={slotKey} className="!my-0 shadow-lg rounded-xl overflow-hidden" />
          </div>
        </aside>
      )}

      {/* Right Side Rail */}
      {!closedRight && (
        <aside
          className="hidden min-[1530px]:flex fixed right-3 top-32 z-40 flex-col items-center"
          aria-label="Right Side Advertisement"
        >
          <div className="relative group">
            <button
              onClick={() => setClosedRight(true)}
              className="absolute -top-2.5 -right-2 w-5 h-5 rounded-full bg-bg-elevated border border-border-base text-text-tertiary hover:text-text-primary text-[11px] font-bold flex items-center justify-center shadow-md cursor-pointer z-50 transition-colors"
              title="Close ad"
              aria-label="Close right advertisement"
            >
              ×
            </button>
            <AdsterraBanner slotKey={slotKey} className="!my-0 shadow-lg rounded-xl overflow-hidden" />
          </div>
        </aside>
      )}
    </>
  );
}
