import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-14 h-14 rounded-xl bg-bg-elevated border border-border-base flex items-center justify-center text-2xl mb-5">
        🔍
      </div>
      <h1 className="heading-lg text-text-primary mb-2">
        Tool not found
      </h1>
      <p className="body-sm text-text-secondary mb-8 max-w-md">
        The tool you&apos;re looking for doesn&apos;t exist. Check the URL or
        browse our full catalog.
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/pdf-tools"
          className="btn-secondary"
        >
          PDF Tools
        </Link>
        <Link
          href="/word-tools"
          className="btn-secondary"
        >
          Word Tools
        </Link>
      </div>
    </div>
  );
}
