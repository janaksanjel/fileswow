export default function ToolPageLoading() {
  return (
    <div className="max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2 mb-4 sm:mb-5">
        <div className="h-3.5 w-10 rounded bg-bg-elevated animate-pulse" />
        <div className="h-3.5 w-16 rounded bg-bg-elevated animate-pulse" />
        <div className="h-3.5 w-28 rounded bg-bg-elevated animate-pulse" />
      </div>

      {/* Unified Tool Window skeleton */}
      <div className="rounded-2xl border border-border-base bg-bg-surface shadow-[var(--elevation-sm)] overflow-hidden">
        <div className="px-4 sm:px-7 py-4 sm:py-5 border-b border-border-base bg-bg-warm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-bg-elevated animate-pulse shrink-0" />
            <div className="space-y-2">
              <div className="h-5 w-44 rounded-lg bg-bg-elevated animate-pulse" />
              <div className="h-3.5 w-64 max-w-[60vw] rounded bg-bg-elevated/80 animate-pulse" />
            </div>
          </div>
          <div className="hidden sm:block h-4 w-28 rounded bg-bg-elevated animate-pulse" />
        </div>

        <div className="p-6 sm:p-10 flex flex-col items-center justify-center gap-4">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <span className="absolute inset-0 rounded-full border-2 border-border-base" />
            <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin" />
          </div>
          <p className="text-[13px] font-medium text-text-secondary">
            Loading tool…
          </p>
          <div className="w-full max-w-lg h-36 rounded-2xl bg-bg-elevated/70 border border-border-base animate-pulse" />
        </div>
      </div>
    </div>
  );
}
