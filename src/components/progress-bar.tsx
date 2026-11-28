"use client";

import { useEffect, useRef, useState } from "react";

interface ProgressBarProps {
  active: boolean;
  label?: string;
}

const RING_RADIUS = 34;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * Bespoke FilesWow-branded tool loading screen scoped to the tool workbench.
 * Features the FilesWow document-sparkle emblem inside a radial progress ring,
 * live stage pills, and frosted-glass Apple-inspired polish.
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
        queueMicrotask(() => {
          setPercent(100);
          setFading(true);
        });
        const t = setTimeout(() => {
          setVisible(false);
          setFading(false);
          setPercent(0);
        }, 260);
        return () => clearTimeout(t);
      }
      return;
    }

    queueMicrotask(() => {
      setVisible(true);
      setFading(false);
      setPercent(0);
    });
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

  const strokeDashoffset =
    RING_CIRCUMFERENCE - (percent / 100) * RING_CIRCUMFERENCE;

  const stageIndex = percent < 35 ? 0 : percent < 80 ? 1 : 2;
  const stages = ["Reading", "Processing", "Finalizing"];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={`absolute inset-0 z-30 flex items-center justify-center p-4 bg-bg-surface/84 backdrop-blur-md transition-opacity duration-200 ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="w-full max-w-[330px] rounded-3xl bg-bg-elevated/95 border border-border-base/90 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.2)] px-6 py-6 flex flex-col items-center text-center gap-4">
        {/* FilesWow Brand Badge */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent-subtle border border-accent/20 text-[10px] font-bold tracking-wider uppercase text-accent">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          FilesWow Engine
        </span>

        {/* Branded Document-Sparkle Emblem + Radial Ring */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg
            width="96"
            height="96"
            viewBox="0 0 96 96"
            className="-rotate-90"
            aria-hidden="true"
          >
            <circle
              cx="48"
              cy="48"
              r={RING_RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="4.5"
              className="text-border-base"
            />
            <circle
              cx="48"
              cy="48"
              r={RING_RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              className="text-accent transition-[stroke-dashoffset] duration-150 ease-out"
            />
          </svg>

          {/* Center FilesWow Document + Sparkle Mark */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-11 h-11 rounded-2xl bg-accent-subtle/80 border border-accent/20 flex items-center justify-center text-accent shadow-xs">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <path d="m12 12 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z" fill="currentColor" stroke="none" />
              </svg>
            </div>
          </div>
        </div>

        {/* Title + Live % */}
        <div className="space-y-1 min-w-0 w-full">
          <div className="flex items-center justify-center gap-2">
            <p className="text-[14.5px] font-bold text-text-primary truncate">
              {label}
            </p>
            <span className="text-[12.5px] font-bold text-accent tabular-nums shrink-0">
              {percent}%
            </span>
          </div>

          {/* 3-Step Brand Progress Pills */}
          <div className="flex items-center justify-center gap-1.5 pt-1.5">
            {stages.map((st, idx) => {
              const done = idx < stageIndex;
              const current = idx === stageIndex;
              return (
                <span
                  key={st}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                    current
                      ? "bg-accent text-white"
                      : done
                        ? "bg-success/15 text-success"
                        : "bg-bg-surface text-text-tertiary border border-border-base"
                  }`}
                >
                  {done ? `✓ ${st}` : st}
                </span>
              );
            })}
          </div>
        </div>

        <p className="text-[11px] text-text-tertiary">
          100% private · Zero server uploads
        </p>
      </div>
    </div>
  );
}
