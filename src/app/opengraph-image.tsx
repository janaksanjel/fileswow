import { ImageResponse } from "next/og";

export const alt = "FilesWow.com — Free PDF, Word & Image Tools Online. No upload required.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0b0f15 0%, #101826 55%, #0b0f15 100%)",
          color: "#f5f7fa",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle top/bottom accent bars */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 10,
            background: "linear-gradient(90deg, #16a34a, #22c55e)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 10,
            background: "linear-gradient(90deg, #22c55e, #16a34a)",
            display: "flex",
          }}
        />

        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 36 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: "linear-gradient(180deg, #22c55e, #16a34a)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(22,163,74,0.35)",
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24">
              <path d="M5.5 2.5h7.2L19 8.3V21.5H5.5z" fill="#fff" />
              <path d="M12.7 2.5v5.8H19z" fill="#0e7a3d" opacity="0.6" />
            </svg>
          </div>
          <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>FilesWow.com</div>
        </div>

        {/* Headline */}
        <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: -2, lineHeight: 1.1, textAlign: "center", maxWidth: 980 }}>
          Free PDF, Word &amp; Image Tools
        </div>
        <div
          style={{
            fontSize: 30,
            fontWeight: 500,
            color: "#9fb2c8",
            marginTop: 24,
            textAlign: "center",
          }}
        >
          100+ tools · No upload · No sign-up · 100% private
        </div>

        {/* Stat chips */}
        <div style={{ display: "flex", gap: 20, marginTop: 48 }}>
          {["PDF", "Word", "Images", "Text"].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 26px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.05)",
                fontSize: 24,
                fontWeight: 600,
                color: "#d7e0ea",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
