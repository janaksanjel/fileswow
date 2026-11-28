// src/lib/target-kb-compress.ts
//
// Fast binary-search + progressive high-quality downscaler that hits a
// user-defined target byte budget while maximizing visual sharpness.

function encodeCanvas(
  canvas: HTMLCanvasElement,
  mimeType: "image/jpeg" | "image/webp",
  quality: number
): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Canvas encoding failed"))),
      mimeType,
      quality
    );
  });
}

/**
 * Progressive multi-step downscale (at most 0.65x per step) with high-quality
 * smoothing so text and fine edges stay crisp instead of blurry or aliased.
 */
function drawScaledProgressive(
  source: HTMLCanvasElement,
  targetScale: number
): HTMLCanvasElement {
  let current: HTMLCanvasElement = source;
  let currentScale = 1;
  const clampedTarget = Math.max(0.18, Math.min(0.95, targetScale));

  while (currentScale > clampedTarget * 1.02) {
    const nextScale = Math.max(clampedTarget, currentScale * 0.65);
    const stepW = Math.max(1, Math.round(source.width * nextScale));
    const stepH = Math.max(1, Math.round(source.height * nextScale));

    const next = document.createElement("canvas");
    next.width = stepW;
    next.height = stepH;
    const ctx = next.getContext("2d", { alpha: false });
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, stepW, stepH);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(current, 0, 0, stepW, stepH);
    }

    if (current !== source) {
      current.width = 0;
      current.height = 0;
    }
    current = next;
    currentScale = nextScale;
    if (nextScale <= clampedTarget) break;
  }

  return current;
}

/**
 * Compress an already-rendered canvas to fit within `targetBytes` while
 * preserving maximum sharpness and avoiding low-quality JPEG artifacts.
 */
export async function compressCanvasToTargetBytes(
  canvas: HTMLCanvasElement,
  targetBytes: number,
  mimeType: "image/jpeg" | "image/webp" = "image/jpeg"
): Promise<Blob> {
  const budget = Math.max(2048, targetBytes);

  // Fast path: check high quality at full resolution
  const highBlob = await encodeCanvas(canvas, mimeType, 0.92);
  if (highBlob.size <= budget) return highBlob;

  // Binary search quality at full resolution, keeping a clean quality floor (0.32)
  // so text/edges never suffer blocky <0.25 JPEG mosquito artifacts
  let lo = 0.32;
  let hi = 0.92;
  let bestBlob: Blob | null = null;
  let smallestAtFloor = highBlob;

  for (let i = 0; i < 5; i++) {
    const mid = (lo + hi) / 2;
    const blob = await encodeCanvas(canvas, mimeType, mid);
    if (blob.size < smallestAtFloor.size) smallestAtFloor = blob;
    if (blob.size <= budget) {
      bestBlob = blob;
      lo = mid;
    } else {
      hi = mid;
    }
  }

  if (bestBlob) return bestBlob;

  // Adaptively downscale progressively and binary-search higher quality (0.42–0.88)
  // which looks noticeably sharper than crushing full-res JPEG below 0.30.
  const scale = Math.max(0.2, Math.min(0.9, Math.sqrt(budget / smallestAtFloor.size) * 0.95));
  const scaled = drawScaledProgressive(canvas, scale);
  try {
    let sLo = 0.38;
    let sHi = 0.88;
    let sBest: Blob | null = null;
    let sSmallest = await encodeCanvas(scaled, mimeType, 0.58);

    if (sSmallest.size <= budget) {
      sBest = sSmallest;
      sLo = 0.58;
    } else {
      sHi = 0.58;
    }

    for (let i = 0; i < 4; i++) {
      const mid = (sLo + sHi) / 2;
      const blob = await encodeCanvas(scaled, mimeType, mid);
      if (blob.size < sSmallest.size) sSmallest = blob;
      if (blob.size <= budget) {
        sBest = blob;
        sLo = mid;
      } else {
        sHi = mid;
      }
    }

    return sBest ?? sSmallest;
  } finally {
    if (scaled !== canvas) {
      scaled.width = 0;
      scaled.height = 0;
    }
  }
}
