"use client";

import { useEffect, useRef, useState } from "react";

interface ProgressBarProps {
  active: boolean;
  label?: string;
}

export function ProgressBar({ active, label = "Processing..." }: ProgressBarProps) {
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
    <div className={`mb-5 transition-opacity duration-200 ${fading ? "opacity-0" : "opacity-100"}`}>
      <div className="bg-bg-surface border border-border-base rounded-xl px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            <span className="text-[12.5px] font-semibold text-text-secondary truncate">{label}</span>
          </div>
          <span className="text-[11.5px] font-mono font-bold text-accent tabular-nums shrink-0">{percent}%</span>
        </div>

        <div className="h-1.5 rounded-full bg-bg-elevated overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light transition-all duration-100 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
