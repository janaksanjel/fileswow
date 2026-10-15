"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n, type Locale } from "@/lib/i18n";

export default function NotFound() {
  const router = useRouter();
  const { setLocale } = useI18n();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const match = window.location.pathname.match(/^\/(en|es|pt)(\/.*)/);
      if (match) {
        const loc = match[1] as Locale;
        const targetPath = match[2] || "/";
        setLocale(loc);
        router.replace(targetPath);
      }
    }
  }, [router, setLocale]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-20 h-20 rounded-2xl bg-accent-subtle text-accent ring-1 ring-inset ring-accent/20 flex items-center justify-center mb-7 shadow-sm">
        <span className="text-[26px] font-extrabold tracking-tight">404</span>
      </div>
      <h1 className="heading-lg text-text-primary mb-2">Page not found</h1>
      <p className="body-md text-text-secondary mb-9 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist. Check the URL or
        browse our tools.
      </p>
      <div className="flex items-center gap-2.5">
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

