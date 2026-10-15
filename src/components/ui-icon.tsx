import type { JSX } from "react";

/**
 * UiIcon — professional, colorful SVG icons for general UI affordances
 * (status marks, buttons, file types, labels).
 *
 * This replaces every emoji / text-glyph icon in the interface so all icons
 * are clean vector artwork. Tool-specific artwork lives in ./icon.tsx (ToolIcon).
 */

interface UiIconProps {
  name: UiIconName;
  size?: number;
  className?: string;
}

type UiIconRender = (props: { size: number; className: string }) => JSX.Element;

const base = (size: number, className: string, children: JSX.Element) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    {children}
  </svg>
);

/** Rounded document body + folded corner, used by the file-type icons. */
const docBody = (color: string, light: string, glyph: JSX.Element) => (
  <>
    <path
      d="M6.6 3.5h7.1L19 9.4V19a1.6 1.6 0 0 1-1.6 1.6H6.6A1.6 1.6 0 0 1 5 19V5.1A1.6 1.6 0 0 1 6.6 3.5z"
      fill={color}
    />
    <path d="M13.7 3.5 19 9.4h-5.3z" fill={light} />
    {glyph}
  </>
);

const glyphLines = (color = "#ffffff") => (
  <>
    <rect x="7.8" y="12.4" width="8.4" height="1.6" rx="0.8" fill={color} opacity="0.9" />
    <rect x="7.8" y="15.4" width="6.2" height="1.6" rx="0.8" fill={color} opacity="0.7" />
    <rect x="7.8" y="18.4" width="4.2" height="1.4" rx="0.7" fill={color} opacity="0.5" />
  </>
);

const glyphLabel = (text: string, fill = "#ffffff") => (
  <text
    x="12"
    y="17.6"
    textAnchor="middle"
    fontSize="6.4"
    fontWeight="700"
    fontFamily="system-ui, sans-serif"
    fill={fill}
    letterSpacing="0.2"
  >
    {text}
  </text>
);

const uiIcons = {
  // ── Status / affordances ─────────────────────────────────────
  check: ({ size, className }) =>
    base(
      size,
      className,
      <>
        <circle cx="12" cy="12" r="9.5" fill="#DCFCE7" />
        <path
          d="M7.6 12.3l3 3 5.9-6.3"
          stroke="#16A34A"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  checkDouble: ({ size, className }) =>
    base(
      size,
      className,
      <>
        <path
          d="M2.2 12.6l3.6 3.6 6.4-7"
          stroke="#22C55E"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.4 16.6l1 1 9.8-10.8"
          stroke="#3B82F6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  close: ({ size, className }) =>
    base(
      size,
      className,
      <path
        d="M6.8 6.8l10.4 10.4M17.2 6.8L6.8 17.2"
        stroke="#EF4444"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    ),
  warning: ({ size, className }) =>
    base(
      size,
      className,
      <>
        <path
          d="M12 3.4a1.5 1.5 0 0 1 1.3.75l8.2 14.3a1.5 1.5 0 0 1-1.3 2.25H3.8a1.5 1.5 0 0 1-1.3-2.25l8.2-14.3A1.5 1.5 0 0 1 12 3.4z"
          fill="#F59E0B"
        />
        <path d="M12 9.2v4.4" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="16.6" r="1.3" fill="#fff" />
      </>
    ),
  info: ({ size, className }) =>
    base(
      size,
      className,
      <>
        <circle cx="12" cy="12" r="9" fill="#3B82F6" />
        <path d="M12 11.2v5.2" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="12" cy="7.9" r="1.4" fill="#fff" />
      </>
    ),

  // ── Actions ─────────────────────────────────────────────────
  copy: ({ size, className }) =>
    base(
      size,
      className,
      <>
        <path
          d="M15.6 5.5H7.4A2.6 2.6 0 0 0 4.8 8.1v8.2"
          stroke="#93C5FD"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <rect x="8.6" y="8.6" width="11" height="11" rx="2.6" fill="#3B82F6" />
        <rect x="11.2" y="12.4" width="5.8" height="1.6" rx="0.8" fill="#fff" opacity="0.9" />
        <rect x="11.2" y="15.6" width="3.8" height="1.6" rx="0.8" fill="#fff" opacity="0.6" />
      </>
    ),
  download: ({ size, className }) =>
    base(
      size,
      className,
      <>
        <path d="M12 4.2v9.4" stroke="#3B82F6" strokeWidth="2.3" strokeLinecap="round" />
        <path
          d="M8 10l4 4 4-4"
          stroke="#3B82F6"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4.6 15.4v2.1A2.5 2.5 0 0 0 7.1 20h9.8a2.5 2.5 0 0 0 2.5-2.5v-2.1"
          stroke="#60A5FA"
          strokeWidth="2.3"
          strokeLinecap="round"
        />
      </>
    ),
  upload: ({ size, className }) =>
    base(
      size,
      className,
      <>
        <path d="M12 15.4V6" stroke="#16A34A" strokeWidth="2.3" strokeLinecap="round" />
        <path
          d="M8 9.6l4-4 4 4"
          stroke="#16A34A"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4.6 15.4v2.1A2.5 2.5 0 0 0 7.1 20h9.8a2.5 2.5 0 0 0 2.5-2.5v-2.1"
          stroke="#4ADE80"
          strokeWidth="2.3"
          strokeLinecap="round"
        />
      </>
    ),
  send: ({ size, className }) =>
    base(
      size,
      className,
      <>
        <path
          d="M21 3.4 10.6 13.8"
          stroke="#3B82F6"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M21 3.4 14.4 21l-3.8-7.2L3.4 10z"
          fill="#3B82F6"
          stroke="#3B82F6"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M10.6 13.8 21 3.4" stroke="#DBEAFE" strokeWidth="1.4" strokeLinecap="round" />
      </>
    ),
  lock: ({ size, className }) =>
    base(
      size,
      className,
      <>
        <rect x="4.8" y="10.4" width="14.4" height="9.8" rx="2.6" fill="#3B82F6" />
        <path
          d="M8.4 10.4V8a3.6 3.6 0 0 1 7.2 0v2.4"
          stroke="#93C5FD"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="12" cy="14.4" r="1.8" fill="#fff" />
        <path d="M12 15.6v1.8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      </>
    ),
  unlock: ({ size, className }) =>
    base(
      size,
      className,
      <>
        <rect x="4.8" y="10.4" width="14.4" height="9.8" rx="2.6" fill="#F59E0B" />
        <path
          d="M8.4 10.4V8a3.6 3.6 0 0 1 7.2 0"
          stroke="#FCD34D"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="12" cy="14.4" r="1.8" fill="#fff" />
        <path d="M12 15.6v1.8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      </>
    ),
  bookmark: ({ size, className }) =>
    base(
      size,
      className,
      <path
        d="M6.6 4.6h10.8a1.6 1.6 0 0 1 1.6 1.6v13.6L12 16l-7 3.8V6.2a1.6 1.6 0 0 1 1.6-1.6z"
        fill="#F59E0B"
        stroke="#D97706"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    ),
  pencil: ({ size, className }) =>
    base(
      size,
      className,
      <>
        <path
          d="M4.2 19.8l.7-3.2L15.6 5.9a1.9 1.9 0 0 1 2.7 0l.6.6a1.9 1.9 0 0 1 0 2.7L8.2 18.9z"
          fill="#F59E0B"
        />
        <path d="M4.2 19.8l.7-3.2 2.5 2.3z" fill="#78350F" />
        <path d="M15.3 6.2l2.8 2.8" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),

  // ── File types ──────────────────────────────────────────────
  fileText: ({ size, className }) => base(size, className, docBody("#64748B", "#CBD5E1", glyphLines())),
  filePdf: ({ size, className }) =>
    base(size, className, docBody("#EF4444", "#FCA5A5", glyphLabel("PDF"))),
  fileDoc: ({ size, className }) =>
    base(size, className, docBody("#2563EB", "#93C5FD", glyphLabel("W"))),
  fileSlides: ({ size, className }) =>
    base(size, className, docBody("#EA580C", "#FDBA74", glyphLabel("P"))),
  fileSheet: ({ size, className }) =>
    base(size, className, docBody("#16A34A", "#86EFAC", glyphLabel("X"))),
  fileImage: ({ size, className }) =>
    base(
      size,
      className,
      docBody(
        "#3B82F6",
        "#93C5FD",
        <>
          <circle cx="9.6" cy="13.4" r="1.5" fill="#fff" />
          <path d="M7.4 18.4l3.3-3.9 2.3 2.4 2.3-2.9 2.7 4.4z" fill="#fff" />
        </>
      )
    ),
  fileVideo: ({ size, className }) =>
    base(
      size,
      className,
      docBody(
        "#8B5CF6",
        "#C4B5FD",
        <path d="M10.4 12.1l5.6 3.2-5.6 3.2z" fill="#fff" />
      )
    ),
  fileAudio: ({ size, className }) =>
    base(
      size,
      className,
      docBody(
        "#EC4899",
        "#F9A8D4",
        <>
          <circle cx="9.8" cy="17" r="2" fill="#fff" />
          <path d="M11.8 17v-6l4.2-1.2v5.8" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <circle cx="16" cy="15.9" r="1.7" fill="#fff" />
        </>
      )
    ),
  fileArchive: ({ size, className }) =>
    base(
      size,
      className,
      docBody(
        "#F59E0B",
        "#FCD34D",
        <>
          <rect x="8" y="14.6" width="8" height="4.6" rx="1" fill="#fff" />
          <rect x="10.7" y="11.4" width="2.6" height="5.6" rx="1.3" fill="#fff" />
          <rect x="11.2" y="16.4" width="1.6" height="1.8" rx="0.5" fill="#F59E0B" />
        </>
      )
    ),
  fileGeneric: ({ size, className }) =>
    base(
      size,
      className,
      docBody(
        "#94A3B8",
        "#E5E7EB",
        <path
          d="M14.8 11.6v4.2a2.7 2.7 0 0 1-5.4 0v-5.3a3.6 3.6 0 0 1 7.2 0v5.6"
          stroke="#fff"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      )
    ),

  // ── Navigation / misc ───────────────────────────────────────
  folder: ({ size, className }) =>
    base(
      size,
      className,
      <>
        <path
          d="M3.6 7.2a2 2 0 0 1 2-2h3.3l2 2.3h7.5a2 2 0 0 1 2 2v1H3.6z"
          fill="#F59E0B"
        />
        <rect x="3.6" y="9.4" width="16.8" height="9.4" rx="2" fill="#FBBF24" />
      </>
    ),
  gear: ({ size, className }) =>
    base(
      size,
      className,
      <>
        <rect x="3.6" y="10.4" width="16.8" height="3.2" rx="1.6" fill="#64748B" />
        <rect x="10.4" y="3.6" width="3.2" height="16.8" rx="1.6" fill="#64748B" />
        <rect
          x="6.3"
          y="6.3"
          width="11.4"
          height="3.2"
          rx="1.6"
          fill="#64748B"
          transform="rotate(45 12 12)"
        />
        <rect
          x="6.3"
          y="6.3"
          width="11.4"
          height="3.2"
          rx="1.6"
          fill="#64748B"
          transform="rotate(-45 12 12)"
        />
        <circle cx="12" cy="12" r="6" fill="#64748B" />
        <circle cx="12" cy="12" r="2.4" fill="#E5E7EB" />
      </>
    ),
  link: ({ size, className }) =>
    base(
      size,
      className,
      <>
        <path
          d="M10.2 13.8a4.2 4.2 0 0 1 0-6l2.6-2.6a4.2 4.2 0 0 1 6 6l-1.4 1.4"
          stroke="#3B82F6"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M13.8 10.2a4.2 4.2 0 0 1 0 6l-2.6 2.6a4.2 4.2 0 0 1-6-6l1.4-1.4"
          stroke="#60A5FA"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
      </>
    ),
  globe: ({ size, className }) =>
    base(
      size,
      className,
      <>
        <circle cx="12" cy="12" r="8.6" fill="#3B82F6" />
        <ellipse cx="12" cy="12" rx="3.9" ry="8.6" fill="none" stroke="#BFDBFE" strokeWidth="1.5" />
        <path
          d="M3.9 12h16.2M5.2 8h13.6M5.2 16h13.6"
          stroke="#BFDBFE"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </>
    ),
  home: ({ size, className }) =>
    base(
      size,
      className,
      <>
        <path
          d="M12 3.6 3.4 11v8.1a1.7 1.7 0 0 0 1.7 1.7h4.1v-5.4h5.6v5.4h4.1a1.7 1.7 0 0 0 1.7-1.7V11z"
          fill="#3B82F6"
        />
        <rect x="10" y="15.4" width="4" height="5.4" rx="0.8" fill="#BFDBFE" />
      </>
    ),
  sparkle: ({ size, className }) =>
    base(
      size,
      className,
      <>
        <path
          d="M10.8 3.4l2.1 4.7 5 .6-3.7 3.4 1 4.9-4.4-2.4-4.4 2.4 1-4.9L3.7 8.7l5-.6z"
          fill="#F59E0B"
        />
        <path
          d="M18.4 15.4l.8 1.8 1.8.8-1.8.8-.8 1.8-.8-1.8-1.8-.8 1.8-.8z"
          fill="#FBBF24"
        />
      </>
    ),
  scissors: ({ size, className }) =>
    base(
      size,
      className,
      <>
        <path d="M8.6 15.2 17.6 4.4" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M15.4 15.2 6.4 4.4" stroke="#CBD5E1" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="6.6" cy="18.2" r="2.8" fill="none" stroke="#EF4444" strokeWidth="2" />
        <circle cx="17.4" cy="18.2" r="2.8" fill="none" stroke="#F87171" strokeWidth="2" />
      </>
    ),
  compress: ({ size, className }) =>
    base(
      size,
      className,
      <>
        <path
          d="M8.4 6.8 12 3.4l3.6 3.4"
          stroke="#06B6D4"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.4 17.2 12 20.6l3.6-3.4"
          stroke="#06B6D4"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="4.4" y="9.4" width="15.2" height="2.4" rx="1.2" fill="#67E8F9" />
        <rect x="4.4" y="12.4" width="15.2" height="2.4" rx="1.2" fill="#06B6D4" />
      </>
    ),
  cycle: ({ size, className }) =>
    base(
      size,
      className,
      <>
        <path
          d="M19.4 12A7.4 7.4 0 0 1 7.1 18.5"
          stroke="#22C55E"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M4.6 12A7.4 7.4 0 0 1 16.9 5.5"
          stroke="#3B82F6"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        <path d="M6.4 14.6l.7 4.4 4.2-1.9z" fill="#22C55E" />
        <path d="M17.6 9.4l-.7-4.4-4.2 1.9z" fill="#3B82F6" />
      </>
    ),
  clock: ({ size, className }) =>
    base(
      size,
      className,
      <>
        <circle cx="12" cy="12" r="8.6" fill="#3B82F6" />
        <circle cx="12" cy="12" r="6.6" fill="#EFF6FF" />
        <path
          d="M12 7.8V12l3 1.9"
          stroke="#1D4ED8"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  ruler: ({ size, className }) =>
    base(
      size,
      className,
      <g transform="rotate(-45 12 12)">
        <rect x="3" y="9" width="18" height="6" rx="1.6" fill="#F59E0B" />
        <path
          d="M7 9v2.6M11 9v3.4M15 9v2.6M19 9v3.4"
          stroke="#FEF3C7"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </g>
    ),
  portrait: ({ size, className }) =>
    base(
      size,
      className,
      <>
        <rect x="7" y="3.4" width="10" height="17.2" rx="2.2" fill="#3B82F6" />
        <rect x="9.4" y="6" width="5.2" height="7.6" rx="1" fill="#BFDBFE" />
        <rect x="9.4" y="15.4" width="5.2" height="2.6" rx="1.3" fill="#93C5FD" />
      </>
    ),
  landscape: ({ size, className }) =>
    base(
      size,
      className,
      <>
        <rect x="3.4" y="7" width="17.2" height="10" rx="2.2" fill="#22C55E" />
        <rect x="6" y="9.4" width="7.6" height="5.2" rx="1" fill="#BBF7D0" />
        <rect x="15.4" y="9.4" width="2.6" height="5.2" rx="1.3" fill="#86EFAC" />
      </>
    ),

  // ── Page transitions / effects ──────────────────────────────
  stop: ({ size, className }) =>
    base(size, className, <rect x="5.8" y="5.8" width="12.4" height="12.4" rx="2.4" fill="#64748B" />),
  fade: ({ size, className }) =>
    base(
      size,
      className,
      <>
        <circle cx="12" cy="12" r="8.4" fill="#E5E7EB" />
        <path d="M12 3.6a8.4 8.4 0 0 1 0 16.8z" fill="#8B5CF6" />
      </>
    ),
  slideRight: ({ size, className }) =>
    base(
      size,
      className,
      <>
        <rect x="3.6" y="7.6" width="11.4" height="8.8" rx="2" fill="#3B82F6" opacity="0.45" />
        <path
          d="M14.4 12h5.8m-2.4-3 3 3-3 3"
          stroke="#3B82F6"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </>
    ),
  slideUp: ({ size, className }) =>
    base(
      size,
      className,
      <>
        <rect x="7.6" y="11.6" width="8.8" height="8.8" rx="2" fill="#3B82F6" opacity="0.45" />
        <path
          d="M12 13.8V8m-3 2.4 3-3 3 3"
          stroke="#3B82F6"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </>
    ),
  drop: ({ size, className }) =>
    base(
      size,
      className,
      <>
        <path
          d="M12 3.4s5.6 6.3 5.6 9.8a5.6 5.6 0 1 1-11.2 0C6.4 9.7 12 3.4 12 3.4z"
          fill="#3B82F6"
        />
        <ellipse cx="9.9" cy="14.6" rx="1.5" ry="2.2" fill="#BFDBFE" opacity="0.9" />
      </>
    ),

  camera: ({ size, className }) =>
    base(
      size,
      className,
      <>
        <path
          d="M8.6 6.6 9.8 4.6h4.4l1.2 2h2.6A2.6 2.6 0 0 1 20.6 9.2v8A2.6 2.6 0 0 1 18 19.8H6a2.6 2.6 0 0 1-2.6-2.6v-8a2.6 2.6 0 0 1 2.6-2.6z"
          fill="#3B82F6"
        />
        <circle cx="12" cy="13.2" r="4.2" fill="#DBEAFE" />
        <circle cx="12" cy="13.2" r="2.4" fill="#1D4ED8" />
        <circle cx="17.6" cy="10" r="0.9" fill="#FDE68A" />
      </>
    ),

  // ── Language flags (footer switcher) ────────────────────────
  flagUS: ({ size, className }) =>
    base(
      size,
      className,
      <>
        <defs>
          <clipPath id="ui-flag-us">
            <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
          </clipPath>
        </defs>
        <g clipPath="url(#ui-flag-us)">
          <rect x="3" y="5.5" width="18" height="13" fill="#fff" />
          <rect x="3" y="5.5" width="18" height="1.86" fill="#EF4444" />
          <rect x="3" y="9.21" width="18" height="1.86" fill="#EF4444" />
          <rect x="3" y="12.93" width="18" height="1.86" fill="#EF4444" />
          <rect x="3" y="16.64" width="18" height="1.86" fill="#EF4444" />
          <rect x="3" y="5.5" width="8" height="7.1" fill="#1E3A8A" />
          {[0, 1, 2].map((row) =>
            [0, 1, 2].map((col) => (
              <circle
                key={`${row}-${col}`}
                cx={4.6 + col * 1.9}
                cy={7.3 + row * 1.75}
                r="0.6"
                fill="#fff"
              />
            ))
          )}
        </g>
        <rect
          x="3"
          y="5.5"
          width="18"
          height="13"
          rx="2.5"
          fill="none"
          stroke="#0F172A"
          strokeOpacity="0.25"
          strokeWidth="0.9"
        />
      </>
    ),
  flagES: ({ size, className }) =>
    base(
      size,
      className,
      <>
        <defs>
          <clipPath id="ui-flag-es">
            <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
          </clipPath>
        </defs>
        <g clipPath="url(#ui-flag-es)">
          <rect x="3" y="5.5" width="18" height="13" fill="#C60B1E" />
          <rect x="3" y="8.75" width="18" height="6.5" fill="#FFC400" />
          <rect x="7.8" y="10.2" width="2.6" height="3.6" rx="0.7" fill="#AD1519" />
        </g>
        <rect
          x="3"
          y="5.5"
          width="18"
          height="13"
          rx="2.5"
          fill="none"
          stroke="#0F172A"
          strokeOpacity="0.25"
          strokeWidth="0.9"
        />
      </>
    ),
  flagPT: ({ size, className }) =>
    base(
      size,
      className,
      <>
        <defs>
          <clipPath id="ui-flag-pt">
            <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
          </clipPath>
        </defs>
        <g clipPath="url(#ui-flag-pt)">
          <rect x="3" y="5.5" width="18" height="13" fill="#DA291C" />
          <rect x="3" y="5.5" width="7.4" height="13" fill="#046A38" />
          <circle cx="10.4" cy="12" r="2.9" fill="#FFE900" />
          <circle cx="10.4" cy="12" r="2.1" fill="#fff" />
          <path
            d="M9.4 10.4h2v1.3c0 1-.6 1.7-1 2-.4-.3-1-1-1-2z"
            fill="#DA291C"
          />
        </g>
        <rect
          x="3"
          y="5.5"
          width="18"
          height="13"
          rx="2.5"
          fill="none"
          stroke="#0F172A"
          strokeOpacity="0.25"
          strokeWidth="0.9"
        />
      </>
    ),

  // ── Friendly / chat ─────────────────────────────────────────
  smile: ({ size, className }) =>
    base(
      size,
      className,
      <>
        <circle cx="12" cy="12" r="9" fill="#FBBF24" />
        <circle cx="9" cy="10" r="1.3" fill="#78350F" />
        <circle cx="15" cy="10" r="1.3" fill="#78350F" />
        <path
          d="M8.4 14.4a4.6 4.6 0 0 0 7.2 0"
          stroke="#78350F"
          strokeWidth="1.7"
          strokeLinecap="round"
          fill="none"
        />
      </>
    ),
  chat: ({ size, className }) =>
    base(
      size,
      className,
      <>
        <path
          d="M4 7.6A3.6 3.6 0 0 1 7.6 4h8.8A3.6 3.6 0 0 1 20 7.6v5.8a3.6 3.6 0 0 1-3.6 3.6H11l-4.6 3.4v-3.4A3.6 3.6 0 0 1 4 13.4z"
          fill="#8B5CF6"
        />
        <circle cx="8.8" cy="10.6" r="1.3" fill="#fff" />
        <circle cx="12" cy="10.6" r="1.3" fill="#fff" opacity="0.85" />
        <circle cx="15.2" cy="10.6" r="1.3" fill="#fff" opacity="0.7" />
      </>
    ),
} satisfies Record<string, UiIconRender>;

export type UiIconName = keyof typeof uiIcons;

export function UiIcon({ name, size = 16, className = "" }: UiIconProps) {
  const render = uiIcons[name] ?? uiIcons.info;
  return render({ size, className });
}
