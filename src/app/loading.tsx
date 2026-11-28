export default function RootLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 px-4">
      <div className="relative w-10 h-10 flex items-center justify-center">
        <span className="absolute inset-0 rounded-full border-2 border-border-base" />
        <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin" />
      </div>
      <p className="text-[13px] font-medium text-text-secondary">Loading…</p>
    </div>
  );
}
