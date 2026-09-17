"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";

type Theme = "dark" | "light";
type Origin = { x: number; y: number };

interface ThemeContextValue {
  theme: Theme;
  toggle: (origin?: Origin) => void;
  set: (t: Theme, origin?: Origin) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggle: () => {},
  set: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

/* Minimal View Transitions API typing (DOM lib may not ship it). */
interface ViewTransitionLike {
  ready: Promise<void>;
}
type DocumentWithViewTransition = Document & {
  startViewTransition?: (
    update: () => void | Promise<void>
  ) => ViewTransitionLike;
};

/* How long the fallback color fade runs (keep in sync with the
   `html.theme-fade` transition durations in globals.css). */
const THEME_FADE_MS = 350;
/* Duration of the circular reveal, in ms. */
const REVEAL_DURATION_MS = 550;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);
  const themeRef = useRef<Theme>("light");

  // Read stored preference or system preference on mount
  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored) {
      setTheme(stored);
    } else if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      setTheme("dark");
    }
    setMounted(true);
  }, []);

  // Apply theme to DOM
  useEffect(() => {
    if (!mounted) return;
    themeRef.current = theme;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  /** Synchronously swap the theme (state + DOM + storage). */
  const applyTheme = useCallback((next: Theme) => {
    flushSync(() => setTheme(next));
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  }, []);

  /** Animated theme change: circular reveal from the click point,
      falling back to a short color fade where unsupported. */
  const changeTheme = useCallback(
    (next: Theme, origin?: Origin) => {
      if (typeof window === "undefined") return;

      const reducedMotion =
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ??
        false;
      const doc = document as DocumentWithViewTransition;

      if (reducedMotion) {
        applyTheme(next);
        return;
      }

      // Fallback: brief cross-fade of theme colors.
      if (typeof doc.startViewTransition !== "function") {
        const root = document.documentElement;
        root.classList.add("theme-fade");
        applyTheme(next);
        window.setTimeout(
          () => root.classList.remove("theme-fade"),
          THEME_FADE_MS + 50
        );
        return;
      }

      // Reveal the new theme with a circle expanding from the click.
      const transition = doc.startViewTransition(() => applyTheme(next));
      transition.ready
        .then(() => {
          const x = origin?.x ?? window.innerWidth / 2;
          const y = origin?.y ?? window.innerHeight / 3;
          const radius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
          );
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${radius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: REVEAL_DURATION_MS,
              easing: "cubic-bezier(0.33, 0, 0.2, 1)",
              pseudoElement: "::view-transition-new(root)",
            }
          );
        })
        .catch(() => {
          // Transition skipped (e.g. rapid re-toggle) — nothing to do.
        });
    },
    [applyTheme]
  );

  const toggle = useCallback(
    (origin?: Origin) => {
      changeTheme(themeRef.current === "dark" ? "light" : "dark", origin);
    },
    [changeTheme]
  );

  const set = useCallback(
    (t: Theme, origin?: Origin) => {
      changeTheme(t, origin);
    },
    [changeTheme]
  );

  // Prevent flash: render nothing until mounted
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle, set }}>
      {children}
    </ThemeContext.Provider>
  );
}
