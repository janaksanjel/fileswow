"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Dialog — the single modal layer for the site (command palette, confirmations).
 *
 * Behaviour: Esc closes, Tab is trapped inside, focus moves in on open and
 * returns to the trigger on close, background scroll is locked, backdrop
 * click closes. No blur/glass: the backdrop is a flat ink scrim so the
 * dialog reads as a floating paper layer (shadow belongs to floating
 * layers only, per the design tokens).
 */
interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** id of the element that labels the dialog (aria-labelledby) */
  labelledBy?: string;
  /** Accessible name when no visible heading exists */
  label?: string;
  /** Extra classes for the dialog surface */
  className?: string;
  children: ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Dialog({ open, onClose, labelledBy, label, className = "", children }: DialogProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  // On open: remember trigger, lock scroll, move focus inside.
  useEffect(() => {
    if (!open) return;
    restoreRef.current = (document.activeElement as HTMLElement) ?? null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timer = window.setTimeout(() => {
      const surface = surfaceRef.current;
      if (!surface) return;
      const target =
        surface.querySelector<HTMLElement>("[data-autofocus]") ??
        surface.querySelector<HTMLElement>(FOCUSABLE);
      target?.focus();
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = prevOverflow;
      restoreRef.current?.focus?.();
    };
  }, [open]);

  // Esc to close + Tab focus trap.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const surface = surfaceRef.current;
      if (!surface) return;
      const nodes = Array.from(surface.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null
      );
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !surface.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 pt-[10vh] pb-10">
      {/* Dark scrim with backdrop blur */}
      <div
        className="fixed inset-0 animate-fade-in bg-black/60 dark:bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={surfaceRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={labelledBy ? undefined : label}
        className={`relative z-10 animate-fade-in-up ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
