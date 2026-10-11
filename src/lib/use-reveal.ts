"use client";

import { useEffect, type RefObject } from "react";

/**
 * One-shot scroll reveal: adds `is-visible` to every `.reveal` descendant the
 * first time it enters the viewport (8px fade-up defined in globals.css).
 * transform/opacity only, unobserved after firing, and neutralised entirely by
 * the prefers-reduced-motion rules in CSS. Elements already in view on load
 * reveal immediately, so there is no flash of hidden content.
 */
export function useReveal<T extends HTMLElement>(ref: RefObject<T | null>) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const targets = Array.from(root.querySelectorAll<HTMLElement>(".reveal"));
    if (targets.length === 0) return;

    if (typeof IntersectionObserver === "undefined") {
      targets.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.05 }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ref]);
}
