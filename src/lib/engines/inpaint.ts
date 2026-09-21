// lib/engines/inpaint.ts — content-aware fill + watermark un-blending
// Pure client-side pixel math used by the watermark-remover tools.
//
// Two strategies:
//  1. inpaintRegion()  — multi-scale harmonic inpainting (solves the Laplace
//     equation inside the masked area, initialized from a coarse pyramid).
//     Produces a smooth, structure-plausible fill for painted/selected areas.
//  2. unblendWatermark() — for semi-transparent watermarks it estimates the
//     per-pixel watermark alpha against an inpainted background estimate and
//     mathematically reverses the alpha compositing, recovering the original
//     pixels instead of hallucinating them. Highest quality when applicable.

export type Mask = Uint8Array; // 1 = pixel to remove
export type ProgressFn = (p: number) => void;

const tick = () => new Promise<void>((r) => setTimeout(r, 0));
const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

interface Level {
  w: number;
  h: number;
  img: Float32Array; // w*h*3, RGB floats
  mask: Uint8Array; // w*h, 1 = hole
}

/** Build a half-resolution image+mask pyramid (coarsest last). */
function buildPyramid(data: Uint8ClampedArray, w: number, h: number, mask: Mask): Level[] {
  const levels: Level[] = [];
  const img0 = new Float32Array(w * h * 3);
  for (let i = 0, j = 0; i < w * h; i++, j += 3) {
    img0[j] = data[i * 4];
    img0[j + 1] = data[i * 4 + 1];
    img0[j + 2] = data[i * 4 + 2];
  }
  levels.push({ w, h, img: img0, mask: mask.slice() });

  while (levels[levels.length - 1].w > 80 && levels[levels.length - 1].h > 80 && levels.length < 6) {
    const prev = levels[levels.length - 1];
    const nw = Math.max(1, Math.ceil(prev.w / 2));
    const nh = Math.max(1, Math.ceil(prev.h / 2));
    const img = new Float32Array(nw * nh * 3);
    const msk = new Uint8Array(nw * nh);
    for (let y = 0; y < nh; y++) {
      for (let x = 0; x < nw; x++) {
        let r = 0, g = 0, b = 0, cnt = 0, m = 0;
        for (let dy = 0; dy < 2; dy++) {
          const sy = y * 2 + dy;
          if (sy >= prev.h) continue;
          for (let dx = 0; dx < 2; dx++) {
            const sx = x * 2 + dx;
            if (sx >= prev.w) continue;
            const si = sy * prev.w + sx;
            r += prev.img[si * 3];
            g += prev.img[si * 3 + 1];
            b += prev.img[si * 3 + 2];
            cnt++;
            if (prev.mask[si]) m = 1;
          }
        }
        const di = y * nw + x;
        img[di * 3] = r / cnt;
        img[di * 3 + 1] = g / cnt;
        img[di * 3 + 2] = b / cnt;
        msk[di] = m;
      }
    }
    levels.push({ w: nw, h: nh, img, mask: msk });
  }
  return levels;
}

/** Bounding box of masked pixels, expanded by 1 (fallback: whole image). */
function maskBBox(mask: Uint8Array, w: number, h: number) {
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x]) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return { minX: 0, minY: 0, maxX: w - 1, maxY: h - 1 };
  minX = Math.max(0, minX - 1);
  minY = Math.max(0, minY - 1);
  maxX = Math.min(w - 1, maxX + 1);
  maxY = Math.min(h - 1, maxY + 1);
  return { minX, minY, maxX, maxY };
}

/** In-place Gauss–Seidel relaxation of masked pixels toward boundary colors. */
function gaussSeidel(lv: Level, iterations: number) {
  const { w, h, img, mask } = lv;
  const { minX, minY, maxX, maxY } = maskBBox(mask, w, h);
  for (let it = 0; it < iterations; it++) {
    for (let y = minY; y <= maxY; y++) {
      const row = y * w;
      for (let x = minX; x <= maxX; x++) {
        const i = row + x;
        if (!mask[i]) continue;
        const l = x > 0 ? i - 1 : i + 1;
        const r = x < w - 1 ? i + 1 : i - 1;
        const u = y > 0 ? i - w : i + w;
        const d = y < h - 1 ? i + w : i - w;
        img[i * 3] = (img[l * 3] + img[r * 3] + img[u * 3] + img[d * 3]) * 0.25;
        img[i * 3 + 1] = (img[l * 3 + 1] + img[r * 3 + 1] + img[u * 3 + 1] + img[d * 3 + 1]) * 0.25;
        img[i * 3 + 2] = (img[l * 3 + 2] + img[r * 3 + 2] + img[u * 3 + 2] + img[d * 3 + 2]) * 0.25;
      }
    }
  }
}

/** Seed the finer level's masked pixels from the coarser solution. */
function upsampleInto(coarse: Level, fine: Level) {
  for (let y = 0; y < fine.h; y++) {
    const cy = Math.min(coarse.h - 1, y >> 1);
    for (let x = 0; x < fine.w; x++) {
      const i = y * fine.w + x;
      if (!fine.mask[i]) continue;
      const cx = Math.min(coarse.w - 1, x >> 1);
      const ci = (cy * coarse.w + cx) * 3;
      fine.img[i * 3] = coarse.img[ci];
      fine.img[i * 3 + 1] = coarse.img[ci + 1];
      fine.img[i * 3 + 2] = coarse.img[ci + 2];
    }
  }
}

/**
 * Content-aware fill: removes every masked pixel and rebuilds it from the
 * surrounding image using multi-scale harmonic inpainting.
 */
export async function inpaintRegion(
  src: ImageData,
  mask: Mask,
  onProgress?: ProgressFn
): Promise<ImageData> {
  const { width: w, height: h, data } = src;
  const out = new ImageData(new Uint8ClampedArray(data), w, h);

  let any = false;
  for (let i = 0; i < mask.length; i++) if (mask[i]) { any = true; break; }
  if (!any || w === 0 || h === 0) {
    onProgress?.(1);
    return out;
  }

  const levels = buildPyramid(data, w, h, mask);
  const L = levels.length;

  // Coarsest level: seed holes with the global mean of known pixels, then relax.
  {
    const base = levels[L - 1];
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < base.w * base.h; i++) {
      if (!base.mask[i]) {
        r += base.img[i * 3];
        g += base.img[i * 3 + 1];
        b += base.img[i * 3 + 2];
        n++;
      }
    }
    if (n === 0) n = 1;
    r /= n; g /= n; b /= n;
    for (let i = 0; i < base.w * base.h; i++) {
      if (base.mask[i]) {
        base.img[i * 3] = r;
        base.img[i * 3 + 1] = g;
        base.img[i * 3 + 2] = b;
      }
    }
    gaussSeidel(base, 400);
  }

  // Refine level by level, coarse → fine.
  for (let k = L - 2; k >= 0; k--) {
    upsampleInto(levels[k + 1], levels[k]);
    const iters = Math.min(220, Math.round(28 * Math.pow(1.55, k)));
    gaussSeidel(levels[k], iters);
    onProgress?.(0.85 * ((L - 1 - k) / L));
    await tick(); // keep the UI responsive
  }

  const fine = levels[0];
  for (let i = 0; i < w * h; i++) {
    if (!mask[i]) continue;
    out.data[i * 4] = clamp(fine.img[i * 3], 0, 255);
    out.data[i * 4 + 1] = clamp(fine.img[i * 3 + 1], 0, 255);
    out.data[i * 4 + 2] = clamp(fine.img[i * 3 + 2], 0, 255);
    out.data[i * 4 + 3] = data[i * 4 + 3];
  }
  onProgress?.(1);
  return out;
}

/** Median of a numeric array. */
function median(arr: number[]): number {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[s.length >> 1];
}

/**
 * Guess the watermark's RGB by taking the masked pixels that deviate most
 * from the masked median (i.e. the watermark tint itself, not the background).
 */
function estimateWatermarkColor(data: Uint8ClampedArray, mask: Mask): [number, number, number] | null {
  let total = 0;
  for (let i = 0; i < mask.length; i++) if (mask[i]) total++;
  if (total < 16) return null;
  const step = Math.max(1, Math.floor(total / 20000));

  const rs: number[] = [], gs: number[] = [], bs: number[] = [];
  const pixels: { i: number; dev: number }[] = [];
  let seen = 0;
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) continue;
    if (seen++ % step !== 0) continue;
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    rs.push(r); gs.push(g); bs.push(b);
    pixels.push({ i, dev: 0 });
  }
  const mr = median(rs), mg = median(gs), mb = median(bs);
  for (const p of pixels) {
    const r = data[p.i * 4], g = data[p.i * 4 + 1], b = data[p.i * 4 + 2];
    p.dev = Math.abs(r - mr) + Math.abs(g - mg) + Math.abs(b - mb);
  }
  pixels.sort((a, b) => b.dev - a.dev);
  const top = pixels.slice(0, Math.max(8, Math.floor(pixels.length * 0.2)));
  if (!top.length) return null;
  const wr: number[] = [], wg: number[] = [], wb: number[] = [];
  for (const p of top) {
    wr.push(data[p.i * 4]);
    wg.push(data[p.i * 4 + 1]);
    wb.push(data[p.i * 4 + 2]);
  }
  return [median(wr), median(wg), median(wb)];
}

/**
 * Remove a semi-transparent watermark by reversing the alpha compositing.
 * Opaque / unsolvable pixels gracefully fall back to the inpainted fill.
 */
export async function unblendWatermark(
  src: ImageData,
  mask: Mask,
  watermarkColor: [number, number, number] | null,
  strength = 1,
  onProgress?: ProgressFn
): Promise<ImageData> {
  onProgress?.(0.05);
  const { width: w, height: h, data } = src;

  // 1. Estimate the hidden background with harmonic inpainting.
  const bg = await inpaintRegion(src, mask, (p) => onProgress?.(0.05 + p * 0.7));
  const out = new ImageData(new Uint8ClampedArray(data), w, h);

  // 2. Watermark color — user picked or auto-estimated.
  const W = watermarkColor ?? estimateWatermarkColor(data, mask);
  if (!W) {
    onProgress?.(1);
    return bg; // nothing detectable → return the healed fill
  }

  // 3. Solve per-pixel watermark alpha against the background estimate.
  const aMap = new Float32Array(w * h).fill(-1);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!mask[i]) continue;
      let ref = 0, best = -1;
      for (let c = 0; c < 3; c++) {
        const d = Math.abs(W[c] - bg.data[i * 4 + c]);
        if (d > best) { best = d; ref = c; }
      }
      const denom = W[ref] - bg.data[i * 4 + ref];
      if (best < 10 || Math.abs(denom) < 4) continue; // not enough signal
      aMap[i] = clamp(((data[i * 4 + ref] - bg.data[i * 4 + ref]) / denom) * strength, 0, 1);
    }
  }

  // 3b. Smooth the alpha map slightly to suppress noise.
  const aSmoothed = new Float32Array(aMap);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (!mask[i] || aMap[i] < 0) continue;
      let s = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const j = i + dy * w + dx;
          if (!mask[j] || aMap[j] < 0) continue;
          s += aMap[j];
          n++;
        }
      }
      if (n > 0) aSmoothed[i] = s / n;
    }
  }

  // 4. Reconstruct: O = (1-a)·B + a·W  →  B = (O − a·W) / (1 − a)
  for (let i = 0; i < w * h; i++) {
    if (!mask[i]) continue;
    const a = aSmoothed[i];
    if (a < 0.02 || a >= 0.9) {
      // Fully transparent or near-opaque → healed fill is the best guess.
      out.data[i * 4] = bg.data[i * 4];
      out.data[i * 4 + 1] = bg.data[i * 4 + 1];
      out.data[i * 4 + 2] = bg.data[i * 4 + 2];
      continue;
    }
    const inv = 1 - a;
    for (let c = 0; c < 3; c++) {
      out.data[i * 4 + c] = clamp((data[i * 4 + c] - a * W[c]) / inv, 0, 255);
    }
  }
  onProgress?.(1);
  return out;
}
