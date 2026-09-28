// lib/content/image-a.ts
//
// Editorial content for image tools, part A (convert, crop/resize,
// rotate/flip, filters, adjust). Part B (effects, annotate, info, utility)
// lives in image-b.ts.
//
// Every entry is unique, hand-written copy — no templated filler.

import type { ToolGuideMap } from "./types";

const IMAGE_GUIDES_A: ToolGuideMap = {
  // ── Convert ─────────────────────────────────────────────────────
  "jpg-to-png": {
    paragraphs: [
      `JPG is for photographs; PNG is for everything that needs lossless fidelity or transparency. Converting JPG to PNG makes sense in specific moments: you're about to edit an image repeatedly (each JPG re-save degrades it, PNG never does), you need to add transparent areas, or a platform demands PNG for uploads.`,
      `The conversion re-encodes the decoded pixels as lossless PNG via the canvas API. Understand the honest physics: the JPG's compression artifacts are already baked in — converting to PNG doesn't remove them, it just stops them from getting worse. The file gets larger because PNG refuses to throw information away.`,
      `For source material you'll keep editing, converting to PNG now is insurance: generation loss stops at one. For pure archival of camera photos, staying JPG (or moving to WebP) is usually wiser.`,
    ],
    faq: [
      { q: "Why convert to PNG?", a: "Lossless storage (no further quality loss on re-save) and transparency support — useful before editing or where platforms require PNG." },
      { q: "Will the PNG look better than the JPG?", a: "No better — same pixels. It just won't degrade further, and supports transparency." },
    ],
  },
  "png-to-jpg": {
    paragraphs: [
      `PNG screenshots and graphics are often 10× larger than the same image as JPG — and when the image is bound for email, a chat, or a size-capped upload, JPG's lossy compression is the pragmatic move. This conversion flattens transparency onto your chosen background color and encodes at a quality you control.`,
      `The quality slider is the whole art: 85–90% is visually indistinguishable from the original for most content while cutting size dramatically; below 75%, blocking artifacts creep into text edges and flat-color gradients. Screenshots with small text are the most fragile case — check one before batch converting.`,
      `Transparent areas need a decision: they become white (or any color you pick) because JPG has no alpha channel. Solid backgrounds of your choice beat surprised white boxes.`,
    ],
    faq: [
      { q: "Will I lose quality?", a: "Some — JPG is lossy. At 85–90% quality the difference is imperceptible for most images; lower settings trade quality for size." },
      { q: "What happens to transparency?", a: "It's flattened onto a background color you choose (white by default), since JPG doesn't support alpha." },
    ],
  },
  "webp-to-jpg": {
    paragraphs: [
      `WebP is Google's modern format — smaller files, great quality — but "modern" cuts both ways: plenty of desktop apps, printers, CMS platforms, and older phones still can't open it. When a WebP image meets an unprepared system, this conversion translates it to the format everything understands.`,
      `The conversion decodes WebP (including animated WebP, using the first frame) and re-encodes as JPG at your quality setting. Transparency flattens to a chosen background, same as PNG-to-JPG, because JPG has no alpha.`,
      `Bulk job? The tool handles multiple files in one pass — common when a web scrape or CDN export leaves you with a folder of .webp files and a workflow that predates them.`,
    ],
    faq: [
      { q: "Why is WebP not opening in my app?", a: "Support is widespread but not universal — older software, some printers, and certain CMS pipelines still require JPG/PNG. Converting is the compatibility fix." },
      { q: "Does converting increase file size?", a: "Usually yes, modestly — WebP compresses better than JPG. That's the cost of universal compatibility." },
    ],
  },
  "jpg-to-webp": {
    paragraphs: [
      `WebP is the web's efficiency upgrade: typically 25–34% smaller than JPG at equivalent quality, which means faster page loads, lower bandwidth, and happier Core Web Vitals. Converting a site's image library to WebP is one of the highest-leverage performance wins available.`,
      `The conversion re-encodes via the browser's native WebP encoder with a quality slider; 80% is the sweet spot most sites standardize on. Browser support for WebP is effectively universal now (Safari held out longest, but conceded in 2020).`,
      `For website assets specifically, pair this with a naming strategy (keep originals, ship .webp) so you can regenerate at different sizes later without quality compounding.`,
    ],
    faq: [
      { q: "What is WebP?", a: "A modern image format by Google with superior compression — typically 25–34% smaller than JPG at the same visual quality." },
      { q: "Will all browsers display WebP?", a: "Yes — every current browser supports it. Only very old software (pre-2020 Safari, ancient apps) doesn't." },
    ],
  },
  "png-to-webp": {
    paragraphs: [
      `PNG's problem is size: lossless fidelity costs bytes, and a screenshot-heavy page can drown in them. WebP offers both modes — lossy and lossless — and its lossless mode typically beats PNG by ~26%, while lossy mode crushes PNG screenshots to a fraction.`,
      `The conversion keeps you in control: lossy WebP for maximum savings (great for screenshots destined for the web), lossless WebP when every pixel must survive (archival, further editing). Transparency carries over either way — an alpha-preserving format is the quiet reason WebP replaced both JPG and PNG for many pipelines.`,
      `One pass through this tool can cut a page's image weight in half; it's the same optimization the big CDNs sell, running on your device for free.`,
    ],
    faq: [
      { q: "Lossy or lossless WebP?", a: "Lossy for web delivery and screenshots (smaller), lossless when pixels must be exact — archival or further editing." },
      { q: "Does transparency survive?", a: "Yes — WebP supports alpha in both modes, unlike JPG." },
    ],
  },
  "webp-to-png": {
    paragraphs: [
      `WebP back to PNG is the edit-and-compatibility path: you received WebP images but need them in tools that want PNG (some editors, design tools, older pipelines), or you need lossless pixel data for manipulation. The conversion decodes and re-encodes losslessly — pixels preserved exactly as they decoded.`,
      `Transparency survives the trip, which matters for UI elements, logos, and cutouts: PNG's alpha channel carries WebP's exactly. For photos (no transparency, compressible detail), WebP-to-JPG yields smaller files; PNG is for graphics and anything needing lossless fidelity.`,
      `Batch conversion handles the folder-of-webp scenario in one pass — the most common trigger for this tool in practice.`,
    ],
    faq: [
      { q: "Is the conversion lossless?", a: "The decode→PNG encode is lossless; you get exactly the pixels the WebP contained." },
      { q: "Why is the PNG bigger?", a: "PNG's compression is less efficient than WebP — that's why WebP exists. Bigger file, universal compatibility." },
    ],
  },
  "heic-to-jpg": {
    paragraphs: [
      `Since iOS 11, every iPhone photo is HEIC — efficient for Apple's storage, frustrating for everyone else. Windows, most web forms, many Android apps, and nearly all printers still expect JPG. This conversion is the single most-demanded image translation on earth, and it runs right in your browser.`,
      `HEIC decoding happens via a WebAssembly build (heic2any), so even Live Photo frames and 48 MP ProRAW derivatives convert locally. Batch mode handles a whole camera roll's worth at once; quality settings mirror JPG's familiar 85–90% sweet spot.`,
      `One privacy note worth making: HEIC photos carry GPS and device EXIF. Converting here doesn't strip it — use Strip Image Metadata after converting if the destination is public.`,
    ],
    faq: [
      { q: "What is HEIC?", a: "High Efficiency Image Container — the default iPhone photo format since iOS 11. Smaller files than JPG, but not universally supported outside Apple's ecosystem." },
      { q: "Are Live Photos or bursts supported?", a: "The primary still frame converts; effects and video components of Live Photos don't — they're not part of the still image." },
      { q: "Is quality preserved?", a: "The decode is lossless; re-encoding to JPG at 85–90% is visually indistinguishable." },
    ],
  },
  "heic-to-png": {
    paragraphs: [
      `The PNG flavor of HEIC conversion serves a different customer: not the photo-sharing use case, but the editing pipeline. PNG's lossless encoding means converting an iPhone screenshot or scanned document from HEIC to PNG gives you a stable, generation-loss-proof master for further work.`,
      `Everything about the HEIC side matches the JPG version — WebAssembly decoding, batch support, full local processing — but the output keeps every pixel exact, at the cost of larger files that don't matter on a local disk.`,
      `For screenshots with text, PNG output also avoids JPG's characteristic fuzz around characters — the difference is visible at zoom and matters for OCR downstream.`,
    ],
    faq: [
      { q: "Why PNG instead of JPG for HEIC photos?", a: "Lossless masters for editing and OCR-friendly text screenshots; JPG for sharing and printing where size matters." },
      { q: "Do files get large?", a: "Yes — PNG stores everything losslessly. For photos, JPG or WebP is usually the sensible destination." },
    ],
  },
  "tiff-to-jpg": {
    paragraphs: [
      `TIFF is the archive-and-professional-print format: huge, lossless, standards-old. It accumulates in scanning departments and design agencies, then needs to enter the JPG world for distribution — email, web, portals. This conversion decodes TIFF (including multi-page files, one output per page) and re-encodes as JPG.`,
      `TIFF's size makes upload-based converters painful — a 200 MB scan is an upload timeout waiting to happen. Local conversion handles it at disk speed. Choose quality by content: photographs tolerate 85%, documents with fine text want 90%+ or the PNG path instead.`,
      `Multi-page TIFFs (common from copiers) split into per-page JPGs, named in order — often exactly what the downstream workflow wants.`,
    ],
    faq: [
      { q: "What about multi-page TIFFs?", a: "Each page becomes its own JPG, in order — common for copier scans that bundle pages into one TIFF." },
      { q: "Why is my TIFF so large?", a: "TIFF is lossless and often uncompressed — that's its role in archives. JPG trades that fidelity for practical sizes." },
    ],
  },
  "bmp-to-jpg": {
    paragraphs: [
      `BMP is the format time forgot: uncompressed pixels from Windows' earliest days, still surfacing from legacy apps, old scanners, and obscure SDKs. A 4000×3000 BMP weighs 34 MB; the same image as JPG is 2 MB. This conversion is pure pragmatism.`,
      `Decode and re-encode is the whole story — BMP carries no compression artifacts to preserve, so the only quality decision is your JPG setting. For 24-bit BMPs (the common kind), the result is indistinguishable at normal quality.`,
      `If you're seeing BMPs regularly, they're coming from a specific legacy system — converting at the boundary keeps the legacy contained without touching the source.`,
    ],
    faq: [
      { q: "Why are BMP files so huge?", a: "They store raw uncompressed pixels — no compression at all. JPG's lossy compression is easily 10–20× smaller." },
      { q: "Any quality loss?", a: "Only JPG's normal lossy encoding — BMP itself has nothing to lose." },
    ],
  },
  "gif-to-png": {
    paragraphs: [
      `Animated GIFs are frames wearing a trench coat — and sometimes you need a single frame as a proper image: the perfect reaction face for a thumbnail, a specific moment for documentation, a still for print. This tool extracts every frame (or just the ones you pick) as PNG files.`,
      `Frame extraction preserves exact pixels per frame — GIF's 256-color palette renders as-is, no dithering surprises. For short loops, frame-by-frame PNGs also make the animation's timing visible in a way players hide.`,
      `For a static single image from an animated GIF, first-frame extraction is one click; for storyboards and animation analysis, full extraction with numbered filenames keeps sequence obvious.`,
    ],
    faq: [
      { q: "Can I extract just one frame?", a: "Yes — choose first-frame mode or pick specific frames from the preview." },
      { q: "Why do colors look limited?", a: "GIF is a 256-color palette format — that's inherent to the source, not the conversion." },
    ],
  },
  "gif-to-jpg": {
    paragraphs: [
      `The same frame extraction as GIF-to-PNG, with JPG's size advantage for photos-in-frames. When the extracted stills are photographic (a GIF that's really a looping video clip), JPG at 85% produces files small enough for chat and email without the palette artifacts PNG would faithfully preserve.`,
      `Transparency and animation don't survive — each frame flattens to your chosen background and becomes an independent JPG. For meme-style graphics with hard edges, PNG extraction is the better sibling; for camera-like content, JPG wins on size.`,
      `Numbered sequential output keeps frame order obvious — frame-001.jpg, frame-002.jpg — ready for storyboards or contact sheets.`,
    ],
    faq: [
      { q: "Does the animation survive?", a: "No — you get still frames. Each extracted JPG is one moment of the animation." },
      { q: "JPG or PNG for GIF frames?", a: "PNG for graphics and hard edges (palette-faithful), JPG for photographic content (smaller)." },
    ],
  },
  "svg-to-png": {
    paragraphs: [
      `SVG is resolution-independent forever; PNG is the format every platform actually accepts. The bridge between them is rasterization at a DPI you choose — and choosing well is the whole skill. Icons for a website: 2× or 3× device pixel ratio. Print: 300 DPI. App icons: each platform's size list.`,
      `The tool renders your SVG through the browser's vector engine at the target resolution, so curves and text stay crisp at any scale — the output is exactly as sharp as the resolution you picked. Transparent backgrounds carry over (PNG supports alpha), or flatten onto a color for contexts that need it.`,
      `Text in SVGs renders with system fonts unless the SVG embeds them — a common source of "looks different rasterized" surprises. Embed fonts in the SVG for pixel-faithful output.`,
    ],
    faq: [
      { q: "What resolution should I use?", a: "For web, 2–3× the display size covers retina screens; for print, 300 DPI. Higher DPI means larger files." },
      { q: "Why does my text render differently?", a: "The SVG references fonts by name; if they're not embedded, the renderer substitutes. Embed fonts in the SVG for fidelity." },
    ],
  },
  "svg-to-jpg": {
    paragraphs: [
      `SVG-to-JPG is the rasterization path when the destination demands it: email clients, older CMS platforms, systems that reject PNG's larger files. The vector renders at your chosen resolution, then compresses lossily — so pick a resolution with margin, because JPG artifacts on sharp vector edges are more visible than on photos.`,
      `Since JPG has no transparency, the SVG's background flattens to your chosen color — white for documents, brand colors for graphics. Quality above 85% keeps text edges clean; below that, the classic JPG buzz appears around curves.`,
      `For anything with text or fine linework, prefer the PNG sibling; JPG is for when file size or platform requirements force the trade.`,
    ],
    faq: [
      { q: "Why does text look fuzzy?", a: "JPG compression blurs sharp edges — raise quality to 85%+ or use PNG, which keeps text crisp losslessly." },
      { q: "What happens to transparency?", a: "It flattens to a solid background color you choose." },
    ],
  },
  "png-to-svg": {
    paragraphs: [
      `Vectorizing a raster image is alchemy with honest limits: this tool traces your PNG's shapes into SVG paths (potrace-style bitmap tracing), producing true vectors that scale infinitely. It works brilliantly on the right input — logos, icons, silhouettes, line art — and honestly poorly on photos.`,
      `The tracing settings are the craft: color count for multi-color logos, detail threshold for line art, smoothing for curves. Simple two-tone graphics trace almost perfectly; each added color multiplies complexity. Photos produce either mush or ten-thousand-path monsters.`,
      `Know the destination: traced SVGs are for scaling and re-coloring brand assets, not for recreating photographic content. If your logo PNG is 500px and the print shop wants a banner, this is the tool that saves the day.`,
    ],
    faq: [
      { q: "Is the SVG editable?", a: "Yes — real paths and shapes, re-colorable and scalable in any vector editor." },
      { q: "Why does my photo trace badly?", a: "Photos have millions of subtle color transitions; tracing works on flat regions. Logos, icons, and line art are the use case." },
    ],
  },
  "ico-to-png": {
    paragraphs: [
      `Favicon files (.ico) are little archives — they contain multiple sizes (16, 32, 48, 256px) in one container, and most image editors open only the first. This extractor shows every embedded size and converts any of them to clean PNGs at native resolution.`,
      `The 256px layer, when present, is the prize: it's the largest, sharpest version of the icon, often superior to scraping a website for logo assets. Design archaeology, brand kits, and "we lost the source files" emergencies all end here.`,
      `Output is standard PNG with transparency preserved — ready for docs, presentations, or re-processing through any image tool.`,
    ],
    faq: [
      { q: "Why does the ICO contain multiple images?", a: "Favicons pack several sizes for different contexts (tabs, bookmarks, shortcuts) — this tool shows and extracts each." },
      { q: "Which size should I extract?", a: "The largest available (usually 256px) — it downscales cleanly to anything smaller." },
    ],
  },
  "png-to-ico": {
    paragraphs: [
      `Every website needs a favicon, and the .ico format — yes, in 2026 — is still what browsers expect at the root. This converter builds a proper multi-size ICO from your PNG: 16px for tabs, 32px for taskbars, 48px for desktop, 256px for high-DPI, all in one file.`,
      `Source quality matters: start from a square PNG at 256px or larger with transparency, and the downscaled sizes stay crisp. Non-square sources get letterboxed or center-cropped (your choice) — a decision worth making deliberately rather than discovering.`,
      `The output drops straight into a site root as favicon.ico, or into a manifest-driven icon set for PWAs — the unglamorous detail that makes a site look finished in a browser tab.`,
    ],
    faq: [
      { q: "What size PNG should I start from?", a: "256×256 or larger, square, with transparency — downscaling from a clean master keeps small sizes sharp." },
      { q: "Which sizes are included?", a: "16, 32, 48, and 256 by default; the full standard set that browsers and operating systems pick from." },
    ],
  },
  "avif-to-jpg": {
    paragraphs: [
      `AVIF is the newest mainstream format — better compression than WebP, HDR support, and adoption growing across the web. Its weakness is the same as every new format's: the long tail of software that hasn't caught up. This conversion translates AVIF to the format every device since 1992 can open.`,
      `Decoding uses the browser's native AVIF support (present in all current browsers), then re-encodes to JPG at your quality choice. HDR AVIFs tone-map to standard dynamic range — the output looks like a normal JPG of the same scene, which is the point.`,
      `For website owners migrating away from AVIF or auditing assets, batch conversion clears a folder in one pass.`,
    ],
    faq: [
      { q: "Why convert away from AVIF?", a: "Compatibility — some apps, CMS pipelines, and tools still don't read it. JPG is the universal fallback." },
      { q: "Is quality lost?", a: "Only JPG's normal lossy encoding; the AVIF decodes losslessly first." },
    ],
  },
  "raw-to-jpg": {
    paragraphs: [
      `Camera RAW files (CR2, NEF, ARW, DNG) are the sensor's unprocessed data — maximum quality, zero compatibility. Converting RAW to JPG is the step that makes photos shareable, and doing it with control beats letting a converter decide: exposure and white balance adjustments before encoding mean the JPG comes out right the first time.`,
      `The decode runs through a WebAssembly RAW processor (rawpy) covering the major manufacturers' formats. Exposure compensation recovers the underexposed shot; white-balance correction fixes the indoor tungsten cast — both applied to the RAW's headroom, which is exactly the latitude RAW exists to provide.`,
      `For serious work, RAW workflow belongs in Lightroom or RawTherapee; for "get the shot out of the camera and into the group chat," this is the fast local path.`,
    ],
    faq: [
      { q: "Which RAW formats are supported?", a: "CR2 (Canon), NEF (Nikon), ARW (Sony), DNG, and most common camera RAW formats." },
      { q: "Why does the JPG look different from my camera's preview?", a: "The camera applies its own processing to previews. RAW conversion starts from the sensor data — adjust exposure/white balance here to taste." },
    ],
  },

  // ── Crop & Resize ──────────────────────────────────────────────
  "resize-image": {
    paragraphs: [
      `Resizing is the most common image operation and the easiest to get wrong: naive downscaling aliases (shimmering edges), naive upscaling blurs, and ignoring aspect ratio distorts. This tool handles all three correctly — high-quality resampling for shrinking, honest limits for enlarging, and an aspect lock that keeps proportions truthful.`,
      `Downscaling is the everyday case and it's excellent: a 4000px camera photo becomes a 1600px web image with proper multi-step resampling, looking sharp at a fraction of the size. Upscaling has physics on its side — pixels can't be invented — so modest enlargements (up to ~150%) stay acceptable and beyond that, expectations should adjust.`,
      `Exact dimensions (1200×630 for Open Graph images, 1080×1080 for posts) are the tool's precision mode: enter the target, keep or break the aspect ratio knowingly.`,
    ],
    faq: [
      { q: "Will resizing reduce quality?", a: "Downscaling preserves quality well with proper resampling. Enlarging beyond the original size causes softness — pixels can't be invented." },
      { q: "How do I keep the aspect ratio?", a: "The lock link between width/height keeps proportions automatically; break it only when you deliberately want distortion." },
    ],
  },
  "crop-image": {
    paragraphs: [
      `Cropping is composition: removing the distraction, tightening the subject, fixing the horizon at the edge. This tool gives you a visual crop box with handles — drag, resize, and watch the preview — plus numeric precision when pixels matter.`,
      `Output keeps full resolution of the cropped area (no resampling), so a tight crop of a sharp photo stays sharp. Aspect ratio presets (1:1, 4:3, 16:9, golden ratio) snap the box for social formats, or go free-form.`,
      `The quiet superpower is cropping before resizing: crop to composition first, then resize to target dimensions — in that order, because the reverse throws away pixels you'd rather keep.`,
    ],
    faq: [
      { q: "Does cropping lose quality?", a: "No — it removes pixels outside the crop but never resamples what's inside. The kept area is pixel-identical to the original." },
      { q: "Can I crop to an exact ratio?", a: "Yes — preset ratios snap the crop box, or enter a custom ratio." },
    ],
  },
  "scale-image": {
    paragraphs: [
      `Scaling is resizing by percentage rather than pixels — 50% halves both dimensions, 200% doubles them. It's the right mental model when the target is "about half" rather than "exactly 1200 pixels": batch prep, quick thumbnails, fitting an image into a layout by feel.`,
      `The resampling quality matches the Resize tool (proper multi-step filtering), so a 33% scale-down is clean and artifact-free. Percentage scaling also composes well: scale to 50% twice is the same as once to 25%, with no quality difference.`,
      `For formats with strict dimension requirements, Resize Image's exact-pixel mode is the precise instrument; Scale is the fast, proportional one.`,
    ],
    faq: [
      { q: "What's the difference from Resize?", a: "Scale works in percentages (relative), Resize in exact pixels (absolute). Same engine, different mental model." },
      { q: "Does 50% twice equal 25% once?", a: "Effectively yes — same result and quality." },
    ],
  },
  "smart-crop": {
    paragraphs: [
      `Every social platform wants a different aspect ratio, and center-cropping a portrait photo to 1:1 decapitates the subject. Smart Crop aims higher: it analyzes the image and places the crop window where the content actually is, rather than blindly at center.`,
      `Choose the target ratio (1:1 for avatars, 16:9 for headers, 4:5 for feeds), and the tool weighs visual saliency — detail, edges, contrast — to position the crop. Faces and text-rich regions stay in frame; empty sky and dead margins go.`,
      `It's a heuristic, not a mind reader: check the preview, and nudge manually in Crop Image when the algorithm's guess needs human taste. For bulk avatar generation and feed preparation, though, it's the difference between seconds and hours.`,
    ],
    faq: [
      { q: "How does it decide where to crop?", a: "A saliency heuristic — it scores regions by detail, edges, and contrast, then positions the crop window to keep the highest-scoring content." },
      { q: "Can I adjust after the auto-crop?", a: "Yes — the result is a suggestion; fine-tune manually in the Crop tool." },
    ],
  },

  // ── Rotate & Flip ──────────────────────────────────────────────
  "rotate-image": {
    paragraphs: [
      `Rotation sounds like a solved problem until EXIF enters: phone photos store orientation as metadata, some software honors it, some doesn't, and the result is the sideways-photo lottery. This tool writes real rotation into pixels — not metadata — so the image is upright everywhere, forever, regardless of any viewer's EXIF behavior.`,
      `Quarter-turns are lossless in spirit (the pixels just move); arbitrary angles resample, which is why the straighten-below covers the small corrections. Choose the angle, preview, download — the result behaves identically in every application.`,
      `For photos that display correctly here but sideways elsewhere, the culprit is conflicting EXIF: this tool's pixel-level rotation is the permanent fix, and Strip Image Metadata removes the ambiguous flags entirely.`,
    ],
    faq: [
      { q: "Why does my photo rotate itself in some apps?", a: "EXIF orientation metadata vs. pixel data conflicts. This tool bakes rotation into pixels — no metadata required." },
      { q: "Does rotation lose quality?", a: "90° steps don't resample. Arbitrary angles do (slightly), which is why they're best for corrections, not flips between orientations." },
    ],
  },
  "flip-image": {
    paragraphs: [
      `Flipping mirrors an image across an axis — horizontal flip for selfie correction (the mirror view you expect vs. the camera's truth), vertical flip for reflections and compositional experiments. Pixels move; nothing resamples; quality is untouched.`,
      `The selfie case is the everyday one: front cameras show you a mirrored preview but save the unmirrored truth, and faces feel "wrong" to their owners. One horizontal flip restores familiarity — though for group photos, note that text in the background flips too.`,
      `Designers flip intentionally for composition: a subject facing left in a right-flowing layout reads backwards, and the fix is one click.`,
    ],
    faq: [
      { q: "Does flipping lose quality?", a: "No — pixels remap without resampling." },
      { q: "What's the difference from Mirror?", a: "They're the same operation here; Mirror is the sibling tool with a reflection-effect variant that adds a faded copy below." },
    ],
  },
  "mirror-image": {
    paragraphs: [
      `The mirror effect is flip plus theater: the image, plus a faded reflection beneath it — the classic album-cover, product-shot, keynote-slide look. This tool builds the composite: original on top, vertically-flipped reflection below, fading to transparency with adjustable length and opacity.`,
      `The reflection's fade curve is the difference between elegant and cheesy — a short, gentle fade reads as polish; a full-strength mirror reads as 2007. Start at 30–40% reflection length and adjust to taste.`,
      `For products and UI screenshots headed into presentations, the effect adds depth without a design tool — and everything composites to PNG with true alpha, so it sits cleanly on any background.`,
    ],
    faq: [
      { q: "Can I control the reflection length?", a: "Yes — reflection height and starting opacity are both adjustable." },
      { q: "What format is the output?", a: "PNG, so the fading reflection keeps true transparency." },
    ],
  },
  "straighten-image": {
    paragraphs: [
      `A two-degree tilt is invisible when shooting and maddening afterward: horizons that slope, buildings that lean, scan edges that drift. Straightening rotates by a fractional angle and crops the result to the largest level rectangle — the two-step geometry every photo editor does, unified here.`,
      `The slider is fine-grained (tenth-of-a-degree steps) with a grid overlay, because the eye catches a 0.5° horizon error and needs exactly that resolution to fix it. Automatic cropping removes the rotated corners; no white triangles, no second tool.`,
      `Straighten before any other edit: composition judgments (crop, resize) made on a tilted image are judgments made on a lie.`,
    ],
    faq: [
      { q: "Will straightening crop my image?", a: "Yes, minimally — rotating a rectangle creates corner gaps, and the tool crops to the largest level rectangle inside. The grid shows what remains." },
      { q: "How precise is the angle?", a: "Tenth-of-a-degree steps — enough to level any visible horizon." },
    ],
  },

  // ── Filters ────────────────────────────────────────────────────
  "blur-image": {
    paragraphs: [
      `Blur is privacy's everyday tool and design's texture: obscure a license plate, soften a face in a background, hide a password in a screenshot, or create depth behind text. This tool applies adjustable gaussian blur — the smooth, natural-looking kind — across the whole image or a brushed selection.`,
      `Selection blur is the workflow that matters: brush over the sensitive region, choose intensity, and only that area blurs. A strong blur (radius above 20) makes recovery effectively impossible — unlike pixelation at small block sizes, which can sometimes be reversed.`,
      `For design uses, blur-then-sharpen compositions and background softening for text overlays both start here. The blur happens client-side, so the "sensitive" screenshot you're sanitizing never uploads anywhere — a detail that matters precisely when the content is sensitive.`,
    ],
    faq: [
      { q: "Can I blur only part of the image?", a: "Yes — brush or rectangle-select the area; blur applies there only." },
      { q: "Is strong blur reversible?", a: "No — heavy gaussian blur destroys the underlying detail. That's why it's the right choice for hiding sensitive content." },
    ],
  },
  "sharpen-image": {
    paragraphs: [
      `Sharpening is the last-mile polish that makes a good photo crisp: it boosts edge contrast, making details pop. The honest truth about sharpening is that it fixes softness from downsizing and mild focus misses — it cannot rescue a truly blurry photo, and overdoing it creates halos that scream "oversharpened."`,
      `This tool uses unsharp masking — the professional standard — with amount and radius controls. The recipe: moderate amount (50–100%), small radius (1–2px) for photos from cameras; less amount for images that were just downsized well.`,
      `Sharpen last, after resize and all other edits — every resample slightly softens, and sharpening before resizing wastes the effect.`,
    ],
    faq: [
      { q: "Can it fix a blurry photo?", a: "Mild softness, yes; genuine out-of-focus blur, no — sharpening adds edge contrast, it can't reconstruct detail that isn't there." },
      { q: "What are halos?", a: "Bright/dark outlines along edges from oversharpening — reduce the amount or radius if you see them." },
    ],
  },
  "grayscale-image": {
    paragraphs: [
      `Black and white is not the absence of color — it's a reinterpretation: how red maps to luminance, how blue skies darken or pale, decides whether a conversion is flat or dramatic. This tool converts with a perceptual weighting (human luminance response), producing natural tonality, plus optional channel-mixing for creative control.`,
      `Perceptual grayscale is the right default for documentation and printing; channel-weighted mixes are the creative tool — a red-heavy mix turns a red rose against green leaves into a bright flower on dark foliage, the classic darkroom filter trick digitized.`,
      `Grayscale output also compresses better and prints more predictably on mono printers — practical reasons to go monochrome beyond aesthetics.`,
    ],
    faq: [
      { q: "Why does my conversion look flat?", a: "Straight luminance conversion can; channel mixing adds contrast control — boost the channel of what should be bright." },
      { q: "Can I get pure black & white (no grays)?", a: "That's Threshold — it forces every pixel to full black or white." },
    ],
  },
  "sepia-image": {
    paragraphs: [
      `Sepia is grayscale with warmth — the brown-gold tone of century-old photographs, applied to give images a sense of age, nostalgia, or cohesion. This tool converts to monochrome first, then maps the tonal range onto a sepia curve with adjustable intensity.`,
      `Intensity is the difference between subtle (a warm tint that unifies a photo collage) and heavy (a full antique effect, ready for a vintage poster). At low settings, sepia also solves a practical problem: photos with clashing color casts become tonally consistent.`,
      `For full vintage treatment, sepia pairs with the Vintage Filter (fades, grain, vignette); sepia alone is the tonal foundation.`,
    ],
    faq: [
      { q: "Can I adjust how strong the sepia is?", a: "Yes — intensity controls how much the brown-gold tone replaces pure gray." },
      { q: "Does sepia keep the original colors?", a: "No — it's a monochrome effect; everything maps to the sepia tonal range." },
    ],
  },
  "invert-colors-image": {
    paragraphs: [
      `Inversion produces the photographic negative: every color maps to its complement, brightness flips. Its uses are more practical than artistic — reading white-on-black documents comfortably, making dark-mode-friendly versions of light UI screenshots, and analyzing film negatives or scanned X-rays, which are literally inverted images.`,
      `The operation is per-channel mathematical inversion — exact, lossless in the information sense, and instant. Text-heavy screenshots invert into surprisingly readable dark-mode documents; light-background diagrams become eye-friendly on OLED screens.`,
      `For accessibility contexts, inversion is a stopgap (proper dark modes are designed, not inverted), but for personal reading of bright documents, it's the fastest eye-saver there is.`,
    ],
    faq: [
      { q: "Can I invert just for dark mode reading?", a: "Yes — that's one of its main uses; inverted screenshots are much easier on the eyes at night." },
      { q: "Does inverting twice return the original?", a: "Yes — inversion is its own inverse." },
    ],
  },
  "threshold-image": {
    paragraphs: [
      `Thresholding forces a decision on every pixel: black or white, no gray allowed. It's the workhorse of document processing — scanned text becomes crisp for OCR, line art becomes print-ready, watermarked forms become legible — and the quality of the result hangs entirely on where the threshold sits.`,
      `The slider is live: drag it and watch pixels flip in real time. For unevenly lit scans, a single global threshold struggles — bright corners go white, dark centers go black — which is when you'd pre-correct with Brightness or Exposure, then threshold.`,
      `Output as PNG or monochrome-friendly formats keeps the file tiny: two colors compress absurdly well, so a 10 MB scan becomes a 100 KB document.`,
    ],
    faq: [
      { q: "What's the right threshold value?", a: "Whatever keeps your text solid and background clean — drag and watch. Midpoint works for even scans; uneven lighting needs pre-correction." },
      { q: "Why is my scanned form suddenly tiny as a file?", a: "Two-color images compress extremely well — that's thresholding doing archival work for free." },
    ],
  },
  "emboss-image": {
    paragraphs: [
      `Embossing turns flat images into pressed-metal reliefs: edges become raised ridges, flat areas become the base metal. It's a convolution effect — each pixel replaced by its difference from neighbors — producing the engraved, stamped, "carved into stone" look.`,
      `The creative uses are specific: watermark-style backgrounds, texture layers in design work, making button states and badges look dimensional. It's not an enhancement filter — it's a transformation that abandons realism for texture.`,
      `The output is grayscale-leaning by nature (embossing is about geometry, not color); high-contrast images with clear edges emboss best, while busy photos turn to noise.`,
    ],
    faq: [
      { q: "Why is the result mostly gray?", a: "Embossing extracts edges and flattens uniform areas — geometry over color. That's the effect, not a bug." },
      { q: "Which images emboss well?", a: "Clear edges, simple shapes, high contrast — logos and graphics. Busy photos become mush." },
    ],
  },
  "edge-detect-image": {
    paragraphs: [
      `Edge detection is computer vision's first question: where does one thing end and another begin? The Sobel operator here answers it, drawing bright lines where intensity changes sharply and black everywhere else — an image's skeleton, revealed.`,
      `Practical uses beyond the obvious: preparing images for tracing (edges feed vectorization), analyzing printed circuits or handwriting strokes, and creating dramatic outline art from photos — the basis of every "coloring book page" filter.`,
      `The output is inherently black-background/white-lines; invert it afterward if you want the traditional pen-on-paper look for printing or further art filters.`,
    ],
    faq: [
      { q: "What is it used for?", a: "Preparation for tracing and OCR, technical analysis, and outline-style art — anywhere boundaries matter more than surfaces." },
      { q: "Can I get white background with dark lines?", a: "Yes — invert the result for the conventional look." },
    ],
  },
  "oil-paint-image": {
    paragraphs: [
      `The oil paint effect is the most beloved of the painterly filters: brush-stroke-like regions, softened detail, colors that blend the way pigment does. This implementation uses Kuwahara-style stylization — it flattens regions while preserving edges, which is what gives the "painted" rather than "blurred" result.`,
      `Brush size is the key control: small sizes keep photographic detail (a subtle painterly touch), large sizes push toward genuine abstraction (a poster from a portrait). Middle values suit most photos; faces generally want restraint.`,
      `Portraits, landscapes, and architecture convert beautifully; text and geometric graphics don't — this is a filter for organic imagery.`,
    ],
    faq: [
      { q: "How do I avoid a mushy result?", a: "Keep brush size small — subtle stylization preserves the subject while adding painterly texture." },
      { q: "Does it work on all photos?", a: "Best on portraits, landscapes, and organic subjects. Text, logos, and geometric designs lose meaning under stylization." },
    ],
  },
  "cartoon-image": {
    paragraphs: [
      `The cartoon effect compresses reality the way animation does: colors quantize to flat regions, edges sharpen into ink lines, and subtle gradients become bold shapes. The pipeline is edge detection plus color quantization — the same two operations cel animators perform by hand.`,
      `Detail level controls how much the image simplifies: low keeps most shading (a subtle comic-book feel), high flattens into bold poster-like regions. Portraits become caricature-adjacent; street scenes become graphic-novel panels.`,
      `The result works as profile art, poster material, and stylized thumbnails — anywhere the point is graphic impact rather than photographic truth.`,
    ],
    faq: [
      { q: "How cartoonish can it get?", a: "The detail slider spans subtle cel-shading to bold flat-color posters — preview at both extremes before choosing." },
      { q: "Are the outlines adjustable?", a: "Edge strength is part of the detail control; higher settings draw bolder ink lines." },
    ],
  },
  "sketch-image": {
    paragraphs: [
      `The pencil sketch filter reduces a photo to its tonal essence: grayscale, edge-enhanced, blended with an inverted copy to produce the soft graphite look of a hand drawing. The result reads as "someone sketched this" — the most classical of the art filters.`,
      `Pencil darkness controls the graphite density: light for a faint construction sketch, dark for a committed drawing. Portraits are the classic subject (the effect flatters faces by abstracting skin while keeping features); architecture produces beautiful line studies.`,
      `For gift-worthy output, sketch a portrait, print on textured paper — the client-side pipeline makes that an afternoon project, not a commission.`,
    ],
    faq: [
      { q: "Which photos sketch best?", a: "Portraits and architecture — clear subjects with good contrast. Low-contrast images sketch faintly." },
      { q: "Can I control the darkness?", a: "Yes — the pencil density slider spans faint to heavy graphite." },
    ],
  },

  // ── Adjust & Color ─────────────────────────────────────────────
  "brightness-contrast": {
    paragraphs: [
      `Brightness and contrast are the fundamental exposure pair: brightness moves the whole tonal range up or down, contrast stretches or compresses it. Together they rescue the majority of imperfect photos — the underexposed interior shot, the flat overcast landscape, the washed-out scan.`,
      `The right order of operations: brightness first (get the midtones where they belong), contrast second (add punch). Overdoing either is the classic mistake — brightness pushes highlights to clipped white and shadows to dead black, and contrast beyond +50 starts eating detail at both ends.`,
      `For shadows/highlights precision, Exposure gives luminance-specific control; this pair remains the fastest path for everyday correction.`,
    ],
    faq: [
      { q: "Which should I adjust first?", a: "Brightness to set overall exposure, then contrast for punch — the order affects the result." },
      { q: "Why did my photo lose detail?", a: "Overcorrection clips highlights and shadows — extreme values destroy data at the edges of the tonal range. Ease back." },
    ],
  },
  "saturation-adjust": {
    paragraphs: [
      `Saturation is color intensity: zero is grayscale, +100 is hyperreal, and most photos live between -10 (subtle sophistication) and +20 (gentle vibrance). This tool operates in HSL space, adjusting chroma uniformly — or with the vibrance-like behavior of protecting already-saturated colors from overdrive.`,
      `The over-saturation trap is skin tones: faces go sunburnt before landscapes go vivid. When adjusting people photos, watch skin first, and favor smaller boosts. For product and food photography, a modest lift (+10–15) is the industry's quiet standard.`,
      `Saturation at exactly zero equals grayscale — but the dedicated Grayscale tool offers channel mixing that produces better monochrome, so use saturation-zero only for quick checks.`,
    ],
    faq: [
      { q: "What's a good saturation boost?", a: "+10 to +20 for most photos; less for portraits (skin over-saturates first)." },
      { q: "Does -100 saturation equal the Grayscale tool?", a: "Visually close, but the Grayscale tool's channel mixing can produce better monochrome — use it for deliberate black-and-white work." },
    ],
  },
  "hue-shift": {
    paragraphs: [
      `Hue shift rotates every color around the color wheel: reds become oranges, blues become purples, the whole palette spins in lockstep. It's the tool for fixing color casts (a +10 shift neutralizes a slight blue tint), creating color-graded looks, and the classic "turn this car purple" demonstration.`,
      `Small shifts (±15°) are corrective; large ones are transformative — a 180° rotation produces the psychedelic complement of the original. Because the shift is uniform, it can't fix one wrong color without moving the right ones; selective color work needs a fuller editor.`,
      `For white-balance problems, Color Temperature is the purpose-built instrument (warming/cooling along the natural axis); hue shift is the creative wheel-spin.`,
    ],
    faq: [
      { q: "What's the difference from Color Temperature?", a: "Temperature moves along the warm-cool axis only (natural corrections); hue shift rotates the whole wheel (creative or corrective)." },
      { q: "Can I shift just one color?", a: "No — the shift is global. Selective recoloring needs a full editor." },
    ],
  },
  "exposure-adjust": {
    paragraphs: [
      `Exposure is brightness done properly: instead of sliding all values equally, it multiplies light — mimicking camera exposure stops. Shadows and highlights respond proportionally, which keeps the adjustment looking photographic rather than washed out.`,
      `The stops metaphor is real: +1 EV doubles the light (like opening the aperture one stop). Recovery of underexposed shots is its best trick — RAW-like latitude exists in most JPEGs too, and +0.5 to +1 EV rescues the dim restaurant photo without the deadness a brightness slider would impose.`,
      `Pair with Gamma for midtone precision: exposure moves everything, gamma bends the middle while protecting the ends — the two together cover 90% of tonal correction.`,
    ],
    faq: [
      { q: "Exposure vs. Brightness?", a: "Exposure scales light proportionally (photographic); brightness shifts all values equally (coarser). Exposure looks more natural for correction." },
      { q: "How much can I recover from a dark photo?", a: "About +1 to +2 EV before noise and banding take over — JPEGs have less headroom than RAW." },
    ],
  },
  "color-temperature": {
    paragraphs: [
      `Color temperature is the warmth axis of light: candlelight (~1800K) is orange, daylight (~5500K) is neutral, shade (~8000K) is blue. Cameras guess this white balance; sometimes they guess wrong, and every photo from that scene carries the same cast. This tool moves the temperature to neutralize the cast — or embrace it.`,
      `The slider spans warm to cool continuously: pull toward warm to fix the blue of shade, toward cool to fix the orange of tungsten. The preview makes neutrality obvious — whites should look white.`,
      `Beyond correction, temperature is mood: warmed portraits (+10) feel golden-hour; cooled cityscapes feel cinematic. It's the single most-used color grade in professional work.`,
    ],
    faq: [
      { q: "How do I fix a yellow indoor photo?", a: "Pull the temperature toward cool until whites look white — the cast neutralizes across the whole image." },
      { q: "Is this the same as white balance?", a: "It's the manual correction of it — the same axis cameras auto-set, under your control." },
    ],
  },
  "vignette-image": {
    paragraphs: [
      `A vignette darkens an image's edges, pulling the eye to the center — the oldest trick in photographic emphasis, and still one of the most effective. Done subtly (10–20% strength, soft falloff), it adds depth without announcement; done heavily, it's a 2012 Instagram post.`,
      `The controls are strength, size (how far the darkening reaches inward), and softness (the gradient's gentleness). Softness is where quality lives: hard vignettes look like physical masks, soft ones look like lens character.`,
      `Vignettes also serve text overlay: darkening edges before placing captions there improves legibility — the quiet reason every quote-image has one.`,
    ],
    faq: [
      { q: "What settings look natural?", a: "Low strength (10–20%), generous softness — enough to guide the eye, not enough to notice." },
      { q: "Why do quote images always have vignettes?", a: "Edge darkening improves text contrast — a vignette is the cheapest legibility upgrade for overlay text." },
    ],
  },
  "gamma-adjust": {
    paragraphs: [
      `Gamma bends the middle of the tonal range without touching the extremes: values below 1 darken midtones (while blacks stay black, whites stay white), values above 1 lift them. It's the surgeon's tonal tool where Brightness is the sledgehammer.`,
      `The use cases are precise: lifting shadow detail without gray-ing the blacks (gamma up, then contrast down slightly), darkening washed-out scans without clipping (gamma down), and correcting for display differences — the original reason gamma exists.`,
      `Gamma composes beautifully with Exposure: exposure sets the overall level, gamma shapes the midtone response — together they handle what neither does alone.`,
    ],
    faq: [
      { q: "Gamma vs. Brightness?", a: "Brightness shifts everything including black/white points; gamma bends midtones while the extremes stay pinned. Gamma is the finer instrument." },
      { q: "What does gamma 1.0 mean?", a: "No change — the neutral midpoint of the slider." },
    ],
  },
};

export default IMAGE_GUIDES_A;
