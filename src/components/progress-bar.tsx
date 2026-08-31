"use client";

import { useEffect, useRef, useState } from "react";

interface ProgressBarProps {
  /** Whether the progress bar is visible */
  active: boolean;
  /** Custom label shown above the bar */
  label?: string;
}

/**
 * Fake progress bar that fills from 0 % → ~95 % over ≈ 1.5 s
 * while processing is happening, then jumps to 100 % and fades out.
 */
export function ProgressBar({ active, label = "Processing your file…" }: ProgressBarProps) {
  const [percent, setPercent] = useState(0);
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const rafRef = useRef<number>(0);
  const startRef = useRef(0);

  useEffect(() => {
    if (!active) {
      // Jump to 100 then fade
      if (visible) {
        setPercent(100);
        setFading(true);
        const t = setTimeout(() => {
          setVisible(false);
          setFading(false);
          setPercent(0);
        }, 500);
        return () => clearTimeout(t);
      }
      return;
    }

    setVisible(true);
    setFading(false);
    setPercent(0);
    startRef.current = performance.now();

    const DURATION = 1750; // ms to reach ~95 % (fits within 1.8 s minimum)

    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const t = Math.min(elapsed / DURATION, 1);
      // ease-out cubic so it starts fast then slows down
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
    <div className={`mb-4 transition-opacity duration-300 ${fading ? "opacity-0" : "opacity-100"}`}>
      <div className="rounded-lg bg-bg-elevated border border-border-base overflow-hidden">
        {/* Top row — label + percentage */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
            </span>
            <span className="text-xs font-medium text-text-secondary">{label}</span>
          </div>
          <span className="text-xs font-mono font-semibold text-accent tabular-nums">{percent}%</span>
        </div>

        {/* Bar track */}
        <div className="h-1 bg-bg-hover mx-3 mb-3 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-100 ease-out"
            style={{
              width: `${percent}%`,
              background: "linear-gradient(90deg, var(--accent) 0%, var(--accent-light) 100%)",
              boxShadow: percent > 0 ? "0 0 12px rgba(34, 197, 94, 0.5)" : "none",
            }}
          />
        </div>
      </div>
    </div>
  );
}
