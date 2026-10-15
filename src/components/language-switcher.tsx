"use client";

import { useEffect, useRef, useState } from "react";
import { LOCALES, useI18n } from "@/lib/i18n";
import { UiIcon } from "@/components/ui-icon";

/**
 * Language switcher — flag + native language label, dropdown opens upward
 * like the reference design. Lives in the (dark) footer, so the styling
 * is fixed dark rather than theme-token based.
 */
export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("footer.selectLanguage")}
        className="inline-flex items-center gap-2.5 h-11 px-4 rounded-xl border border-white/15 bg-white/[0.04] hover:border-white/30 hover:bg-white/[0.07] transition-colors"
      >
        <span className="leading-none" aria-hidden="true">
          <UiIcon name={current.flag} size={19} />
        </span>
        <span className="text-[12.5px] font-bold uppercase tracking-[0.08em] text-white">
          {current.label}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`text-white/60 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t("footer.selectLanguage")}
          className="absolute bottom-full left-0 mb-2 w-56 rounded-xl border border-white/10 bg-[#182138] shadow-[0_16px_40px_rgba(0,0,0,0.45)] overflow-hidden z-50 py-1.5 animate-fade-in-up"
        >
          {LOCALES.map((l) => {
            const selected = l.code === locale;
            return (
              <li key={l.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    setLocale(l.code);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    selected ? "bg-white/[0.06] text-white" : "text-[#cbd5e1] hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  <span className="leading-none" aria-hidden="true">
                    <UiIcon name={l.flag} size={19} />
                  </span>
                  <span className="text-[13px] font-semibold uppercase tracking-[0.06em]">
                    {l.label}
                  </span>
                  {selected && (
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ml-auto text-[#ff9a24]"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
