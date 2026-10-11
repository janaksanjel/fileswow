"use client";

import { useEffect, useRef, useState } from "react";

interface ProgressBarProps {
  active: boolean;
  label?: string;
}

/**
 * State 3 (processing): a determinate bar with a % read-out and a step
 * label. The bar reflects elapsed time against the tool's minimum
 * processing window — no fake claims, no bare spinner, no pulsing dots.
 */
export function ProgressBar({ active, label = "Processing on your device…" }: ProgressBarProps) {
  const [percent, setPercent] = useState(0);
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const rafRef = useRef<number>(0);
  const startRef = useRef(0);

  useEffect(() => {
    if (!active) {
      if (visible) {
        setPercent(100);
        setFading(true);
        const t = setTimeout(() => {
          setVisible(false);
          setFading(false);
          setPercent(0);
        }, 400);
        return () => clearTimeout(t);
      }
      return;
    }

    setVisible(true);
    setFading(false);
    setPercent(0);
    startRef.current = performance.now();

    const DURATION = 1750;

    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const t = Math.min(elapsed / DURATION, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setPercent(Math.min(Math.round(eased * 95), 95));

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [active, visible]);

  if (!visible) return null;

  return (
    <div
      className={`mb-5 transition-opacity duration-200 ${fading ? "opacity-0" : "opacity-100"}`}
      role="status"
      aria-live="polite"
    >
      <div className="bg-bg-surface border border-border-base rounded-xl px-4 py-3">
        <div className="flex items-center justify-between gap-4 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-accent shrink-0"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            <span className="text-[12.5px] font-semibold text-text-secondary truncate">{label}</span>
          </div>
          <span className="font-mono text-[11.5px] font-bold text-accent tabular-nums shrink-0">
            {percent}%
          </span>
        </div>

        <div className="h-1.5 rounded-full bg-bg-elevated overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-100 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
