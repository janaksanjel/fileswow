"use client";

import { useRef, useState, useCallback } from "react";
import { ToolShell } from "@/components/tool-shell";
import { ProgressBar } from "@/components/progress-bar";
import { getToolComponent } from "@/components/tool-registry";
import type { ToolDef } from "@/lib/catalog";

const MIN_LOADING_MS = 1800; // every tool shows ≥ 1.8 s of progress

interface ToolClientProps {
  tool: ToolDef;
  relatedTools: ToolDef[];
}

export function ToolClient({ tool, relatedTools }: ToolClientProps) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startRef = useRef(0);
  const pendingStop = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleProcessing = useCallback((value: boolean) => {
    if (value) {
      // Start
      if (pendingStop.current) {
        clearTimeout(pendingStop.current);
        pendingStop.current = null;
      }
      startRef.current = performance.now();
      setProcessing(true);
    } else {
      // Stop — enforce minimum duration
      const elapsed = performance.now() - startRef.current;
      const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
      pendingStop.current = setTimeout(() => {
        setProcessing(false);
        pendingStop.current = null;
      }, remaining);
    }
  }, []);

  const ToolComponent = getToolComponent(tool.slug);

  return (
    <ToolShell tool={tool} relatedTools={relatedTools}>
      {/* Processing indicator */}
      <ProgressBar active={processing} />

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-bg-surface border-2 border-danger shadow-[3px_3px_0_var(--shadow-color)] flex items-start gap-2.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-danger mt-0.5 shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-wide text-danger">Something went wrong</p>
            <p className="text-xs text-text-secondary mt-0.5 break-words">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-text-tertiary hover:text-danger transition-colors shrink-0" aria-label="Dismiss">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Dynamic tool UI */}
      {ToolComponent ? (
        <ToolComponent onProcessing={handleProcessing} onError={setError} />
      ) : (
        <FallbackToolUI tool={tool} />
      )}
    </ToolShell>
  );
}

function FallbackToolUI({ tool }: { tool: ToolDef }) {
  return (
    <div className="text-center py-12 sm:py-16">
      <div className="w-14 h-14 bg-bg-elevated border-2 border-border-strong flex items-center justify-center text-2xl mx-auto mb-4">
        {tool.icon}
      </div>
      <h3 className="heading-md text-text-primary mb-2">Coming Soon</h3>
      <p className="body-sm text-text-secondary max-w-sm mx-auto mb-4">
        The <strong>{tool.name}</strong> tool is being built. It uses{" "}
        <code className="px-1.5 py-0.5 bg-bg-elevated border-2 border-border-strong text-accent text-[11px] font-mono">
          {tool.engine}
        </code>.
      </p>
      <div className="inline-flex items-center gap-1.5 text-[10px] text-text-tertiary uppercase tracking-wider font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-warning" />
        In development
      </div>
    </div>
  );
}
