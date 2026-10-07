"use client";

import React from "react";
import type { WorkflowCategory } from "@/lib/workflow-config";

export interface ProcessingStateProps {
  progress: number;
  stageMessage: string;
  operationName: string;
  fileName: string;
  category: WorkflowCategory;
}

export function ProgressIndicator({ progress }: { progress: number }) {
  const clamped = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div className="w-full max-w-md mx-auto space-y-2">
      <div className="flex items-center justify-between text-xs font-bold text-text-secondary px-0.5">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          Processing
        </span>
        <span className="font-mono text-accent">{clamped}%</span>
      </div>

      <div className="w-full h-3 rounded-full bg-bg-elevated border border-border-base p-0.5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full transition-all duration-300 ease-out shadow-xs"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export function ProcessingState({
  progress,
  stageMessage,
  operationName,
  fileName,
  category,
}: ProcessingStateProps) {
  // Milestone pipeline nodes
  const milestones = [
    { label: "File", done: progress >= 15 },
    { label: "Scanning", done: progress >= 40 },
    { label: "Processing", done: progress >= 70 },
    { label: "Optimizing", done: progress >= 90 },
    { label: "Ready", done: progress >= 100 },
  ];

  return (
    <div className="w-full max-w-lg mx-auto py-10 px-4 text-center space-y-8 animate-fade-in">
      {/* Central Animated Radar / Scanner graphic */}
      <div className="relative inline-flex items-center justify-center">
        {/* Pulsing Outer Rings */}
        <span className="absolute -inset-4 rounded-full border border-accent/25 animate-ping opacity-60 pointer-events-none" />
        <span className="absolute -inset-8 rounded-full border border-accent/15 animate-pulse opacity-40 pointer-events-none" />

        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-bg-surface border-2 border-accent/40 shadow-xl flex flex-col items-center justify-center relative overflow-hidden">
          {/* Animated Scanning Beam */}
          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent animate-pulse top-1/2 -translate-y-1/2" />

          {/* Category Icon */}
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-accent animate-bounce" style={{ animationDuration: "2s" }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>

          <span className="text-[10px] font-black uppercase text-accent/80 tracking-wider mt-1">
            {category.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Headline & Current Stage */}
      <div className="space-y-2">
        <h3 className="heading-md text-text-primary">
          Processing {operationName}...
        </h3>
        <p className="text-xs sm:text-sm text-text-secondary font-medium animate-pulse">
          {stageMessage}
        </p>
        <p className="text-xs text-text-tertiary truncate max-w-xs mx-auto">
          {fileName}
        </p>
      </div>

      {/* Progress Bar Component */}
      <ProgressIndicator progress={progress} />

      {/* Visual Pipeline Concept: FILE -> SCANNING -> PROCESSING -> OPTIMIZING -> READY */}
      <div className="pt-2">
        <div className="flex items-center justify-center gap-1 sm:gap-2">
          {milestones.map((ms, i) => (
            <React.Fragment key={ms.label}>
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    ms.done
                      ? "bg-accent scale-110 shadow-xs ring-2 ring-accent/25"
                      : "bg-bg-elevated border border-border-strong"
                  }`}
                />
                <span
                  className={`text-[10px] font-semibold tracking-tight transition-colors ${
                    ms.done ? "text-accent font-bold" : "text-text-tertiary"
                  }`}
                >
                  {ms.label}
                </span>
              </div>
              {i < milestones.length - 1 && (
                <div
                  className={`w-6 sm:w-10 h-0.5 -mt-3.5 transition-colors duration-300 ${
                    milestones[i + 1].done ? "bg-accent" : "bg-border-base"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

