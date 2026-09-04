"use client";

import { useTheme } from "@/lib/theme-provider";

export function FloatingActionButton() {
  const { theme, toggle } = useTheme();

  return (
    <div className="fab">
      <button
        onClick={toggle}
        className="w-11 h-11 flex items-center justify-center bg-bg-surface border-2 border-border-strong text-text-primary hover:text-text-on-accent hover:bg-accent hover:border-accent shadow-[4px_4px_0_var(--shadow-color)] transition-all duration-150"
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        {theme === "dark" ? (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        ) : (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>
    </div>
  );
}
