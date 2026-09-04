import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="flex items-center justify-center w-24 h-24 bg-accent border-2 border-border-strong shadow-[6px_6px_0_var(--shadow-color)] mb-8">
        <span className="text-3xl font-black text-text-on-accent">404</span>
      </div>
      <h1 className="heading-lg text-text-primary mb-2">Page not found</h1>
      <p className="body-sm text-text-secondary mb-8 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist. Check the URL or
        browse our tools.
      </p>
      <div className="flex items-center gap-2">
        <Link href="/" className="btn-primary">
          Home
        </Link>
        <Link href="/pdf-tools" className="btn-secondary">
          PDF Tools
        </Link>
      </div>
    </div>
  );
}
