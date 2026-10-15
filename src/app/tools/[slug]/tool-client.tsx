"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { ToolShell } from "@/components/tool-shell";
import { recordToolVisit } from "@/lib/usage";
import { ProgressBar } from "@/components/progress-bar";
import { getToolComponent } from "@/components/tool-registry";
import { ToolIcon } from "@/components/icon";
import { pingIndexNow } from "@/lib/indexnow-ping";
import type { ToolDef } from "@/lib/catalog";
import type { ToolGuide } from "@/lib/content";

const MIN_LOADING_MS = 1800; // every tool shows ≥ 1.8 s of progress

interface ToolClientProps {
  tool: ToolDef;
  relatedTools: ToolDef[];
  guide: ToolGuide | null;
  faq: { q: string; a: string }[];
  relatedPost?: {
    slug: string;
    title: string;
    description: string;
  } | null;
}

export function ToolClient({ tool, relatedTools, guide, faq, relatedPost }: ToolClientProps) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Bumped by "Try again" — remounts the tool UI so it restarts clean.
  const [attempt, setAttempt] = useState(0);
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

  const handleRetry = useCallback(() => {
    if (pendingStop.current) {
      clearTimeout(pendingStop.current);
      pendingStop.current = null;
    }
    setProcessing(false);
    setError(null);
    setAttempt((a) => a + 1);
  }, []);

  useEffect(() => {
    return () => {
      if (pendingStop.current) clearTimeout(pendingStop.current);
    };
  }, []);

  const ToolComponent = getToolComponent(tool.slug);

  // Track usage for "Recently Used" and "Popular" sections
  useEffect(() => {
    recordToolVisit(tool.slug);
  }, [tool.slug]);

  // IndexNow: fire-and-forget ping to Bing/Yandex so real visits to this page
  // keep search indexes instantly fresh. Silently no-ops on rate limit.
  useEffect(() => {
    pingIndexNow([`/tools/${tool.slug}`, "/"]);
  }, [tool.slug]);

  return (
    <ToolShell
      tool={tool}
      relatedTools={relatedTools}
      guide={guide}
      faq={faq}
      relatedPost={relatedPost}
    >
      {/* Processing indicator (state 3) */}
      <ProgressBar active={processing} />

      {/* Error (state 5) — plain language first, detail second, retry third */}
      {error && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-danger/30 bg-danger/[0.04] p-4"
        >
          <div className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-lg bg-danger/10 text-danger flex items-center justify-center shrink-0">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-text-primary">
                That didn&apos;t work
              </p>
              <p className="text-[13px] text-text-secondary leading-relaxed mt-0.5">
                The file couldn&apos;t be processed this time. It usually means the
                file is password-protected, damaged, or too large for this
                browser. Try another file, or start over.
              </p>
              {error && (
                <p className="mt-2 font-mono text-[11px] text-text-tertiary break-words">
                  {error}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3 pl-10">
            <button type="button" onClick={handleRetry} className="btn-primary px-4 py-2 text-[13px]">
              Try again
            </button>
            <button
              type="button"
              onClick={() => setError(null)}
              className="btn-secondary px-4 py-2 text-[13px]"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Dynamic tool UI — remounts on retry so the tool starts clean */}
      {ToolComponent ? (
        <ToolComponent
          key={attempt}
          onProcessing={handleProcessing}
          onError={setError}
        />
      ) : (
        <FallbackToolUI tool={tool} />
      )}
    </ToolShell>
  );
}

function FallbackToolUI({ tool }: { tool: ToolDef }) {
  return (
    <div className="text-center py-12 sm:py-16">
      <div className="w-14 h-14 rounded-xl bg-bg-elevated border border-border-base flex items-center justify-center mx-auto mb-4">
        <ToolIcon name={tool.slug} size={26} />
      </div>
      <h3 className="heading-md text-text-primary mb-2">Coming soon</h3>
      <p className="text-[13.5px] text-text-secondary max-w-sm mx-auto mb-4">
        The <strong>{tool.name}</strong> tool is being built. It uses{" "}
        <code className="px-2 py-0.5 rounded-md bg-bg-elevated border border-border-base text-accent text-[12px] font-mono">
          {tool.engine}
        </code>
        .
      </p>
      <div className="inline-flex items-center gap-1.5 text-[11px] text-text-tertiary uppercase tracking-wider font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-warning" />
        In development
      </div>
    </div>
  );
}
