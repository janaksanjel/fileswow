import { ImageResponse } from "next/og";

// Required for `output: export` (static HTML export) builds.
export const dynamic = "force-static";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Mirrors the header logo (src/components/header.tsx): rounded tile with an
// accent gradient, a subtle top highlight, and a white paper sheet with a
// folded corner + ink text lines.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #4ade80 0%, #16a34a 100%)",
          borderRadius: 40,
        }}
      >
        {/* Subtle top highlight */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "rgba(255,255,255,0.35)",
            display: "flex",
          }}
        />
        {/* Paper sheet with folded corner + ink text lines */}
        <svg width="116" height="116" viewBox="0 0 24 24">
          <path d="M5.5 2.5h7.2L19 8.3V21.5H5.5z" fill="#ffffff" />
          <path d="M12.7 2.5v5.8H19z" fill="#15803d" opacity="0.55" />
          <rect x="7.9" y="10.4" width="6.6" height="1.5" rx="0.75" fill="#15803d" />
          <rect x="7.9" y="13" width="4.8" height="1.5" rx="0.75" fill="#15803d" opacity="0.55" />
          <rect x="7.9" y="15.6" width="5.6" height="1.5" rx="0.75" fill="#15803d" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
