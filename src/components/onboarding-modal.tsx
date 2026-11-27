"use client";

import { useCallback, useEffect, useState } from "react";
import { LOCALES, useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme-provider";
import { UiIcon } from "@/components/ui-icon";

const ONBOARDING_STORAGE_KEY = "fileswow-onboarded";
export const USER_NAME_STORAGE_KEY = "fileswow-user-name";
export const USER_NAME_EVENT = "fileswow-user-name-changed";

export function OnboardingModal() {
  const { locale, setLocale } = useI18n();
  const { theme, set: setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const existingName = window.localStorage.getItem(USER_NAME_STORAGE_KEY);
        if (existingName) setNameInput(existingName);
        if (!window.localStorage.getItem(ONBOARDING_STORAGE_KEY)) {
          setOpen(true);
        }
      } catch {
        // Ignore storage errors
      }
    });
  }, []);

  const finishOnboarding = useCallback((saveName: boolean) => {
    try {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "1");
      if (saveName) {
        const trimmed = nameInput.trim();
        if (trimmed) {
          window.localStorage.setItem(USER_NAME_STORAGE_KEY, trimmed);
        } else {
          window.localStorage.removeItem(USER_NAME_STORAGE_KEY);
        }
        window.dispatchEvent(new Event(USER_NAME_EVENT));
      }
    } catch {
      // Ignore storage errors
    }
    setOpen(false);
  }, [nameInput]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finishOnboarding(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, finishOnboarding]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-md transition-opacity"
        onClick={() => finishOnboarding(false)}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Welcome setup"
        className="relative z-10 w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-2xl sm:rounded-3xl bg-bg-surface border border-border-base shadow-[var(--elevation-xl)] animate-fade-in-up"
      >
        {/* Top bar with logo & 3-step indicator */}
        <div className="px-4 sm:px-6 pt-5 pb-3.5 border-b border-border-base bg-bg-warm flex items-center justify-between gap-3 sticky top-0 z-10">
          <div className="flex items-center min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/headerlogo-sm.png" alt="FilesWow" width={150} height={40} className="logo-light h-7 sm:h-8 w-auto object-contain" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/headerlogo-dark.png" alt="FilesWow" width={150} height={40} className="logo-dark h-7 sm:h-8 w-auto object-contain" />
          </div>

          <div className="flex items-center gap-1.5 shrink-0" aria-label={`Step ${step} of 3`}>
            {[1, 2, 3].map((idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  step === idx
                    ? "w-6 bg-accent"
                    : step > idx
                    ? "w-2.5 bg-success"
                    : "w-2 bg-border-strong"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Screen 1: Language Selection */}
        {step === 1 && (
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            <div>
              <p className="text-[11px] sm:text-[11.5px] font-semibold uppercase tracking-[0.08em] text-accent-ink mb-1">
                Step 1 of 3
              </p>
              <h2 className="text-[18px] sm:text-[20px] font-semibold tracking-tight text-text-primary">
                Choose your language
              </h2>
              <p className="text-[13px] sm:text-[13.5px] text-text-secondary mt-1">
                Select the language you&apos;d like to use across FilesWow.
              </p>
            </div>

            <div className="space-y-2.5" role="radiogroup" aria-label="Language options">
              {LOCALES.map((item) => {
                const selected = item.code === locale;
                return (
                  <button
                    key={item.code}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setLocale(item.code)}
                    className={`w-full min-h-[52px] flex items-center justify-between gap-3 px-3.5 sm:px-4 py-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      selected
                        ? "border-accent bg-accent-subtle ring-1 ring-accent"
                        : "border-border-base bg-bg-surface hover:bg-bg-elevated/70 hover:border-border-strong"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="shrink-0 leading-none" aria-hidden="true">
                        <UiIcon name={item.flag} size={22} />
                      </span>
                      <div className="min-w-0">
                        <span className="block text-[14px] sm:text-[14.5px] font-semibold text-text-primary truncate">
                          {item.label}
                        </span>
                        <span className="block text-[11px] font-mono uppercase text-text-tertiary">
                          {item.code}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors shrink-0 ${
                        selected
                          ? "bg-accent border-accent text-text-on-accent"
                          : "border-border-strong bg-transparent"
                      }`}
                    >
                      {selected && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="pt-1 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => finishOnboarding(false)}
                className="min-h-[44px] px-3 py-2 text-[13px] font-medium text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn-primary min-h-[44px] px-5 py-2.5 text-[13.5px] flex items-center gap-1.5 cursor-pointer"
              >
                <span>Continue</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Screen 2: Theme Selection */}
        {step === 2 && (
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            <div>
              <p className="text-[11px] sm:text-[11.5px] font-semibold uppercase tracking-[0.08em] text-accent-ink mb-1">
                Step 2 of 3
              </p>
              <h2 className="text-[18px] sm:text-[20px] font-semibold tracking-tight text-text-primary">
                Choose your theme
              </h2>
              <p className="text-[13px] sm:text-[13.5px] text-text-secondary mt-1">
                Pick a look that feels comfortable — you can switch anytime.
              </p>
            </div>

            <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3" role="radiogroup" aria-label="Theme options">
              {/* Light Mode Card */}
              <button
                type="button"
                role="radio"
                aria-checked={theme === "light"}
                onClick={(e) => setTheme("light", { x: e.clientX, y: e.clientY })}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  theme === "light"
                    ? "border-accent bg-accent-subtle ring-1 ring-accent"
                    : "border-border-base bg-bg-surface hover:border-border-strong"
                }`}
              >
                <div className="rounded-xl border border-[#E5E5EA] bg-[#F5F5F7] p-2.5 mb-2.5 space-y-1.5">
                  <div className="h-2.5 w-full rounded bg-[#059669]" />
                  <div className="rounded-lg bg-white p-2 border border-[#E5E5EA] space-y-1">
                    <div className="h-1.5 w-2/3 rounded bg-[#1D1D1F]" />
                    <div className="h-1.5 w-1/2 rounded bg-[#86868B]" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13.5px] font-semibold text-text-primary">Light</span>
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                      theme === "light"
                        ? "bg-accent border-accent text-text-on-accent"
                        : "border-border-strong"
                    }`}
                  >
                    {theme === "light" && (
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                </div>
              </button>

              {/* Dark Mode Card */}
              <button
                type="button"
                role="radio"
                aria-checked={theme === "dark"}
                onClick={(e) => setTheme("dark", { x: e.clientX, y: e.clientY })}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  theme === "dark"
                    ? "border-accent bg-accent-subtle ring-1 ring-accent"
                    : "border-border-base bg-bg-surface hover:border-border-strong"
                }`}
              >
                <div className="rounded-xl border border-[#2C2C2E] bg-[#000000] p-2.5 mb-2.5 space-y-1.5">
                  <div className="h-2.5 w-full rounded bg-[#059669]" />
                  <div className="rounded-lg bg-[#1C1C1E] p-2 border border-[#38383A] space-y-1">
                    <div className="h-1.5 w-2/3 rounded bg-[#F5F5F7]" />
                    <div className="h-1.5 w-1/2 rounded bg-[#98989D]" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13.5px] font-semibold text-text-primary">Dark</span>
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                      theme === "dark"
                        ? "bg-accent border-accent text-text-on-accent"
                        : "border-border-strong"
                    }`}
                  >
                    {theme === "dark" && (
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                </div>
              </button>
            </div>

            <div className="pt-1 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-secondary min-h-[44px] px-4 py-2.5 text-[13px] flex items-center gap-1.5 cursor-pointer"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="btn-primary min-h-[44px] px-5 py-2.5 text-[13.5px] flex items-center gap-1.5 cursor-pointer"
              >
                <span>Continue</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Screen 3: Enter Your Name */}
        {step === 3 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              finishOnboarding(true);
            }}
            className="p-4 sm:p-6 space-y-4 sm:space-y-5"
          >
            <div>
              <p className="text-[11px] sm:text-[11.5px] font-semibold uppercase tracking-[0.08em] text-accent-ink mb-1">
                Step 3 of 3
              </p>
              <h2 className="text-[18px] sm:text-[20px] font-semibold tracking-tight text-text-primary">
                Enter your name
              </h2>
              <p className="text-[13px] sm:text-[13.5px] text-text-secondary mt-1">
                Personalize your workspace — you can edit your name anytime in the top bar.
              </p>
            </div>

            <div>
              <label htmlFor="onboarding-name-input" className="block text-[12px] font-semibold text-text-secondary mb-1.5">
                Your name
              </label>
              <input
                id="onboarding-name-input"
                type="text"
                maxLength={32}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Alex"
                autoFocus
                className="input h-11 text-[14.5px]"
              />
            </div>

            <div className="pt-1 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn-secondary min-h-[44px] px-4 py-2.5 text-[13px] flex items-center gap-1.5 cursor-pointer"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                <span>Back</span>
              </button>
              <button
                type="submit"
                className="btn-primary min-h-[44px] px-5 py-2.5 text-[13.5px] flex items-center gap-1.5 cursor-pointer"
              >
                <span>Get started</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
