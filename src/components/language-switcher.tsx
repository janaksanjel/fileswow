"use client";

import { useEffect, useRef, useState } from "react";
import { LOCALES, useI18n } from "@/lib/i18n";
import { UiIcon } from "@/components/ui-icon";

interface LanguageSwitcherProps {
  direction?: "up" | "down";
  compact?: boolean;
}

export function LanguageSwitcher({ direction = "up", compact = false }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

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

  const menuPos =
    direction === "down"
      ? "top-full right-0 mt-2"
      : "bottom-full left-0 mb-2";

  return (
    <div ref={wrapRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("footer.selectLanguage")}
        className={`inline-flex items-center border border-border-base bg-bg-surface hover:border-border-strong hover:bg-bg-elevated transition-colors cursor-pointer ${
          compact
            ? "gap-1.5 h-9 px-2.5 rounded-lg"
            : "gap-2.5 h-11 px-4 rounded-xl shadow-[var(--elevation-sm)]"
        }`}
      >
        <span className="leading-none" aria-hidden="true">
          <UiIcon name={current.flag} size={compact ? 16 : 18} />
        </span>
        <span className={compact ? "text-[12px] font-semibold uppercase text-text-primary" : "text-[13px] font-medium text-text-primary"}>
          {compact ? current.code.toUpperCase() : current.label}
        </span>
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`text-text-tertiary transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t("footer.selectLanguage")}
          className={`absolute ${menuPos} w-48 rounded-2xl border border-border-base bg-bg-surface shadow-[var(--elevation-xl)] overflow-hidden z-50 p-1.5 animate-fade-in-up`}
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
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                    selected
                      ? "bg-bg-elevated text-text-primary font-semibold"
                      : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary font-medium"
                  }`}
                >
                  <span className="leading-none" aria-hidden="true">
                    <UiIcon name={l.flag} size={17} />
                  </span>
                  <span className="text-[13px]">{l.label}</span>
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
                      className="ml-auto text-accent"
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
