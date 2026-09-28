// lib/content/image-b.ts
//
// Editorial content for image tools, part B (effects, annotate, info,
// utility). Part A (convert/crop/rotate/filters/adjust) lives in image-a.ts.
//
// Every entry is unique, hand-written copy — no templated filler.

import type { ToolGuideMap } from "./types";

const IMAGE_GUIDES_B: ToolGuideMap = {
  // ── Effects ─────────────────────────────────────────────────────
  "watermark-image": {
    paragraphs: [
      `A watermark is the credit that survives the screenshot: your name or logo embedded in the pixels, traveling with the image wherever it's reposted. This tool adds text or logo watermarks with full control — position, opacity, rotation, tiling, and the diagonal "big and faint" look that photographers standardize on.`,
      `Opacity is the craft variable: 15–30% reads as professional protection; 60%+ reads as insecurity. Tiled watermarks (repeating across the whole image) are the strongest deterrent since cropping can't remove them; corner marks are the friendlier, credit-style option.`,
      `Layered protection works best: multiple marks at different positions and opacities survive partial cropping. Everything happens locally — your unwatermarked originals never upload anywhere, which is rather the point of watermarking.`,
    ],
    faq: [
      { q: "Can I add multiple watermarks?", a: "Yes — layer text and image marks at different positions and opacities in one pass." },
      { q: "What opacity looks professional?", a: "15–30% for subtle protection; higher only when the image must be visibly marked." },
    ],
  },
  "remove-watermark-image": {
    paragraphs: [
      `Removing a watermark you're entitled to remove — your old mark on your own photo, a stock preview you've since licensed, a date stamp on your camera's output — is legitimate restoration. This tool erases marks with content-aware inpainting: brush the area, and multi-scale harmonic filling rebuilds the pixels from surrounding detail.`,
      `Un-blend mode is the technical highlight: semi-transparent watermarks are mathematically blended with the photo, and this mode estimates the watermark's alpha per pixel and reverses the blend — often recovering the original image rather than just painting over the problem.`,
      `The same ethical line as every removal tool: only marks you own or are licensed to remove. Beyond the ethics, inpainting quality depends on surrounding content — smooth backgrounds heal invisibly, busy textures may need a second, tighter pass.`,
    ],
    faq: [
      { q: "Will the removal look natural?", a: "On smooth backgrounds, invisibly so. Busy textures may need multiple passes with tighter selections." },
      { q: "What is Un-blend mode?", a: "For semi-transparent watermarks: it estimates the mark's opacity per pixel and mathematically reverses the blend, often recovering original pixels." },
    ],
  },
  "opacity-adjust": {
    paragraphs: [
      `Transparency is a compositing tool: an image at 50% opacity lets a background show through — for watermarks, overlay layers, ghosted backgrounds in design compositions, and faded photo treatment in layouts. This tool sets a uniform alpha across the image and saves as PNG, because JPG has no alpha channel.`,
      `The output format matters: PNG preserves the transparency you just created; choosing JPG would flatten it to a background immediately. For layered design work, PNG at partial opacity is the deliverable other tools expect.`,
      `For selective transparency (cutting out a subject entirely), Remove Background is the AI-powered sibling; this tool is the uniform dial.`,
    ],
    faq: [
      { q: "Why PNG output?", a: "Transparency requires the alpha channel PNG provides — JPG would flatten your work instantly." },
      { q: "Can I make only part of the image transparent?", a: "That's background removal or manual erasing — this tool applies one opacity value to everything." },
    ],
  },
  "pixelate-image": {
    paragraphs: [
      `Pixelation is privacy's blunt instrument: mosaic the license plate, the face, the screen content — and the information is gone. This tool blocks the image (or a selection) into visible squares, with block size as the single decisive control.`,
      `Size matters more than people think: small blocks (8–12px) obscure detail but leave shapes readable — fine for aesthetics, insufficient for privacy. Real anonymization wants 20px+ blocks over the sensitive region, where reconstruction becomes genuinely impossible rather than merely difficult.`,
      `For a retro 8-bit aesthetic, whole-image pixelation at small blocks is the look; for protecting content, selection-based application at strong settings is the correct workflow.`,
    ],
    faq: [
      { q: "Is pixelation reversible?", a: "At large block sizes, no. Small blocks sometimes allow super-resolution guesses — for real privacy use 20px+ blocks." },
      { q: "Blur or pixelate for hiding content?", a: "Both work at strong settings; blur looks smoother, pixelation is unambiguous about redaction. Avoid weak settings of either." },
    ],
  },
  "mosaic-image": {
    paragraphs: [
      `Mosaic tiling is pixelation's decorative cousin: instead of squares, the image breaks into tiles with grout lines — the bathroom-wall, stained-glass, or Venetian look. The effect is both a privacy tool (obscuring with style) and an aesthetic treatment ( architectural photos love it).`,
      `Tile size and grout width are the two controls; larger tiles with visible grout push toward stained glass, tighter tiles read as textured abstraction. Photographic content turns decorative; graphic content turns poster-like.`,
      `Like pixelation, mosaic destroys detail irreversibly — which makes it a legitimate (and better-looking) alternative for redaction where pixel squares feel too institutional.`,
    ],
    faq: [
      { q: "Mosaic vs. pixelate?", a: "Same family — mosaic adds grout lines and tile styling for a decorative result; pixelate is the plain square grid." },
      { q: "Is it reversible?", a: "No — like pixelation, tiles destroy underlying detail." },
    ],
  },
  "duotone-image": {
    paragraphs: [
      `Duotone is the designer's monochrome: pick two colors, and the image's shadows map to one, highlights to the other, everything between blending smoothly. The result is simultaneously restrained (two colors) and striking (whole-image commitment) — the look of album covers, brand campaigns, and serious editorial design.`,
      `Color choice is the entire art: high-contrast pairs (navy/cream) read corporate and crisp; analogous pairs (purple/pink) feel modern and moody; complementary pairs (blue/orange) vibrate with energy. The image's tonal structure provides the form; your colors provide the feeling.`,
      `Duotone also solves practical problems: brand-consistent imagery from inconsistent source photos, and print economies — two spot colors instead of full CMYK.`,
    ],
    faq: [
      { q: "Which colors work best?", a: "High-contrast pairs for crispness, analogous for mood, complementary for energy — preview two or three before committing." },
      { q: "Does it work on any photo?", a: "Best on photos with clear tonal range; flat images produce flat duotones." },
    ],
  },
  "vintage-image": {
    paragraphs: [
      `The vintage filter is a bundle of aging artifacts — faded blacks, lifted shadows, warm color shifts, soft contrast — that collectively read as "old photograph." This tool offers several presets spanning decades of film looks, from mild Kodachrome warmth to full faded-print character.`,
      `The presets are starting points, not destinations: faded blacks suggest memory, heavy warmth suggests the 1970s, desaturated mid-tones suggest Polaroid. One click gives the look; the slider adjusts how hard it hits.`,
      `Vintage treatment also unifies mismatched photos: a set of images from different cameras becomes a cohesive "series" under one filter — the reason wedding and event photographers lean on it.`,
    ],
    faq: [
      { q: "What does 'faded blacks' mean?", a: "Shadows that don't reach full black — the hallmark of aged film. It softens contrast and adds nostalgia instantly." },
      { q: "Can I control the intensity?", a: "Yes — the amount slider blends the vintage look against the original." },
    ],
  },
  "fade-image": {
    paragraphs: [
      `Fading washes an image toward white (or any color): a gentle veil that reduces contrast and saturation together. It's the effect behind "ghosted" background images in design — text sits on top and stays readable because the image politely stepped back.`,
      `Beyond design duty, fading is an artistic treatment: high-key photography, dream sequences, the soft-focus pastel look. The fade amount is continuous, from a whisper (10%, barely-there softening) to near-invisibility (80%, the image as texture).`,
      `For overlay use, fade the image first, then add text in any editor — the composite problem is solved before it exists.`,
    ],
    faq: [
      { q: "Why fade an image for text overlays?", a: "Contrast between text and background determines readability — a faded image guarantees the text wins." },
      { q: "Can I fade toward a color instead of white?", a: "Yes — pick any fade target color." },
    ],
  },
  "background-remove-image": {
    paragraphs: [
      `Background removal used to mean an hour in Photoshop with the pen tool; now it means ten seconds and a neural network. This tool runs an AI segmentation model (@imgly/background-removal) entirely in your browser — the model downloads to your device, analyzes the image, and cuts the subject out with per-pixel alpha.`,
      `It excels at the classic subjects: people against cluttered rooms, products on tables, pets mid-chaos. Hair and fur — historically the nightmare — come out remarkably well with modern models. The output is a transparent PNG ready for compositing, new backgrounds, or e-commerce listings.`,
      `Processing takes 10–30 seconds because a real neural network is running on your device — and the trade is worth stating plainly: your photos never upload, which for many business uses (products, people) is the difference between usable and not.`,
    ],
    faq: [
      { q: "How long does it take?", a: "10–30 seconds depending on image size and device — a real ML model runs in your browser." },
      { q: "Are my photos uploaded?", a: "No — the model runs locally; images never leave your device." },
      { q: "What about complex edges like hair?", a: "Modern segmentation handles hair and semi-transparent edges well; results vary with lighting and contrast." },
    ],
  },
  "change-bg-color": {
    paragraphs: [
      `Swapping a background color is the fast route to consistent product shots, compliant ID-style photos, and brand-aligned graphics: select the color to replace, choose the new one, done. The tool works on color distance — pixels close to the target color swap, everything else stays.`,
      `Tolerance is the critical setting: too tight leaves fringes of the old color; too loose eats the subject. Start narrow and widen until the swap is clean — the live preview makes the sweet spot obvious.`,
      `For images with backgrounds that aren't a single color, the right sequence is Remove Background first (AI cuts the subject), then this tool fills the transparent areas with your chosen color — two steps, professional result.`,
    ],
    faq: [
      { q: "Why does the swap have fringes?", a: "Anti-aliased edges blend old and new colors — increase tolerance slightly or use background removal for a clean cut." },
      { q: "Can I use any background, not just a color?", a: "Color is this tool's scope; full image backgrounds come via Remove Background + compositing." },
    ],
  },

  // ── Annotate & Draw ────────────────────────────────────────────
  "text-on-image": {
    paragraphs: [
      `Text on an image is the oldest meme format and the newest marketing necessity: captions, labels, quote cards, announcement graphics. This tool places text with full typographic control — font, size, color, stroke, shadow — and drags into position on a live canvas.`,
      `Readability is the craft: white text with a subtle dark shadow is the universally legible default; outlined text (stroke) survives busy backgrounds where shadows fail. Position matters as much as style — the lower third avoids covering faces and key subjects.`,
      `For meme-format text specifically (top/bottom, impact font), the Meme Generator is the purpose-built variant; this tool is the general instrument.`,
    ],
    faq: [
      { q: "How do I keep text readable on any background?", a: "White text + dark shadow, or add a stroke/outline — both survive busy backgrounds." },
      { q: "Can I add multiple text blocks?", a: "Yes — add as many separately-positioned text layers as you need." },
    ],
  },
  "border-image": {
    paragraphs: [
      `A border frames by declaring an edge: the clean white matte that makes a photo look gallery-hung, the black frame that gives polish, the colored border that ties an image to a brand palette. This tool adds borders — solid or gradient — with width, color, and corner style under your control.`,
      `The gallery matte is the classic: white or off-white border, wider at the bottom (the traditional print framing ratio), instantly elevating snapshots into art prints. Social-ready borders ensure images survive platform cropping with the subject intact.`,
      `Gradient borders (a color fade around the frame) are the modern decorative touch — subtle two-color gradients read as contemporary design rather than 1999 web page.`,
    ],
    faq: [
      { q: "Can the border be a different width on each side?", a: "Yes — uniform or per-side widths, useful for the classic matte style." },
      { q: "Do borders add size to the image?", a: "Yes — the canvas grows by the border width on each side." },
    ],
  },
  "rounded-corners-image": {
    paragraphs: [
      `Rounded corners are the visual language of modern UI: every card, avatar, and screenshot in contemporary design wears them. Applying them to an image before embedding means no CSS tricks at display time — the asset arrives pre-rounded with true transparency in the corners.`,
      `Radius is adjustable from subtle (8–12px, professional restraint) to full pill (radius = half the height, avatar-style). The corners become transparent (PNG output), so the image composites cleanly on any background — no white squares in dark-mode layouts.`,
      `For consistent design systems, standardize one radius across all embedded images; mixed corner radii are the tell of hasty work.`,
    ],
    faq: [
      { q: "What format is the output?", a: "PNG — the rounded corners need transparency, which JPG can't represent." },
      { q: "Can I do full-circle?", a: "That's the Circle Crop tool — dedicated to perfect circles with positioning control." },
    ],
  },
  "circle-crop-image": {
    paragraphs: [
      `The circular avatar is the internet's portrait format: Slack, Discord, GitHub, every contact list — circles everywhere. This tool crops an image into a perfect circle with a draggable, resizable selector, outputting a transparent PNG that composites cleanly anywhere.`,
      `Positioning is the craft: center the face with space above the head (the crop that survives every platform's own re-cropping), and the result looks intentional everywhere it lands. The circle preview updates live as you drag.`,
      `For team pages and consistent avatar sets, crop everyone to the same relative head size — the consistency reads as professionalism more than any individual photo's quality.`,
    ],
    faq: [
      { q: "What output format?", a: "PNG with true transparency outside the circle — ready for any platform." },
      { q: "Can I add a ring/border to the circle?", a: "Add one afterward with the Add Border tool, or in CSS where the avatar displays." },
    ],
  },
  "shadow-image": {
    paragraphs: [
      `A drop shadow lifts an image off the page: the flat rectangle becomes a physical object with depth. This tool adds configurable shadows — offset, blur, color, opacity — around an image and exports the composite on a transparent canvas, ready to place on any background.`,
      `The professional default is subtle: small offset (4–8px), generous blur (20–40px), low opacity (20–30%). That combination reads as elevation in modern UI; large hard shadows read as clip-art from 2005.`,
      `For product shots and UI screenshots in presentations, the shadow is what makes a raw screenshot look designed — one setting, one export, immediate polish.`,
    ],
    faq: [
      { q: "What shadow settings look modern?", a: "Small offset, large blur, low opacity — the soft elevation look used across current UI design." },
      { q: "What's the output canvas?", a: "The image plus padding for the shadow, on transparency — composites cleanly anywhere." },
    ],
  },
  "meme-generator": {
    paragraphs: [
      `The meme format is settled law: image, top text, bottom text, Impact font, white with black outline. This generator implements the canon with zero friction — upload, type both lines, download. No watermarks, no sign-in, no queue: the internet's folk art deserves a clean tool.`,
      `Beyond the classics, font and position are adjustable — the format has evolved (whisper text, Drake-style panels are compositions this tool's positioning handles), but the top/bottom default remains the fastest path.`,
      `Text auto-wraps and scales to fit, so long setups don't fall off the edge — the detail that separates usable meme tools from frustrating ones.`,
    ],
    faq: [
      { q: "Is the classic Impact style the default?", a: "Yes — white Impact with black outline, top and bottom positioned, exactly as tradition demands." },
      { q: "Any watermarks or limits?", a: "None — the output is your meme, full resolution, nothing added." },
    ],
  },
  "draw-on-image": {
    paragraphs: [
      `Freehand annotation is the universal review language: circle the problem, underline the key line, scribble the arrow words can't. This tool provides pen, highlighter, and eraser over your image — pressure-styled strokes in any color, at any width, on a canvas that keeps up with your hand.`,
      `The tool separation matters: pen for precise marks, highlighter for translucent emphasis (the text stays readable underneath), eraser for fixing your own marks without touching the image. Layers compose naturally — draw, erase, redraw — until you download once.`,
      `Review cycles, tutoring, and design feedback are the natural homes; the output is a flattened image with your marks baked in, ready to send.`,
    ],
    faq: [
      { q: "Can I undo a stroke?", a: "Yes — undo removes strokes in order without affecting the underlying image." },
      { q: "Does the highlighter show text underneath?", a: "Yes — it's translucent by design; that's its purpose." },
    ],
  },
  "arrow-on-image": {
    paragraphs: [
      `Arrows are annotation's verbs: this points here, this changed, look at this. This tool draws arrows, rectangles, ellipses, and lines over an image — the geometry set that covers 95% of technical and editorial annotation.`,
      `Shape styling is consistent: color, width, and opacity per shape, with arrows auto-sizing their heads to the stroke width so they never look anemic. Rectangles highlight regions (the screenshot-review classic), ellipses circle the subject, lines connect.`,
      `Combined with text-on-image, this tool completes the annotation toolkit: mark the region, label it, send it — the workflow that makes remote feedback feel local.`,
    ],
    faq: [
      { q: "Can I mix shapes?", a: "Yes — arrows, rectangles, ellipses, and lines compose in any combination." },
      { q: "Do arrowheads scale with line width?", a: "Yes — heads auto-proportion so thick arrows don't get pin-sized heads." },
    ],
  },
  "sticker-image": {
    paragraphs: [
      `Stickers and emojis are the vocabulary of casual visual communication — a reaction, a label, a vibe. This tool places emoji and sticker graphics onto images with drag positioning, scaling, and rotation: reactions on screenshots, decorations on cards, personality on anything.`,
      `The emoji set renders as crisp vector-sourced graphics (not tiny raster sprites), so they scale to any size without the blur that plagues screenshot-copied emoji. Rotation and flipping make the vocabulary expressive — the same smiley becomes a dozen moods.`,
      `For quick social graphics and chat-ready images, this is the fastest path from plain photo to "sent it to the group chat."`,
    ],
    faq: [
      { q: "Do emoji stay sharp at large sizes?", a: "Yes — they render from vector sources, scaling cleanly to whatever size you need." },
      { q: "Can I rotate and flip stickers?", a: "Yes — full transform controls per sticker." },
    ],
  },

  // ── Info ───────────────────────────────────────────────────────
  "image-info": {
    paragraphs: [
      `Every image file is a small database: dimensions, format, color depth, file size, and often camera settings, software traces, and GPS coordinates. This viewer opens that database read-only — the technical profile you need before optimizing, publishing, or troubleshooting.`,
      `The everyday questions it answers: "why is this 8 MB?" (dimensions × format × quality), "is this really a PNG?" (extensions lie; signatures don't), "what dimensions is this?" (the answer before any resize decision). The format's true nature matters more than people expect — mislabeled files break pipelines silently.`,
      `Pair with EXIF Viewer for the camera-data deep dive, or Strip Image Metadata when the profile reveals things you'd rather not publish.`,
    ],
    faq: [
      { q: "Why check image info before uploading?", a: "Size limits, dimension requirements, and privacy (metadata you didn't mean to share) — all visible in one glance." },
      { q: "Can the format differ from the extension?", a: "Yes — files get renamed wrongly all the time. The tool reads actual file signatures, not names." },
    ],
  },
  "exif-viewer": {
    paragraphs: [
      `EXIF metadata is the photograph's diary: camera model, lens, focal length, aperture, shutter speed, ISO, timestamp, and — the detail with real privacy stakes — GPS coordinates of where the shot was taken. This viewer displays the complete record, parsed and human-readable.`,
      `The photography data is genuinely useful: reverse-engineering a shot you admire (what settings produced that depth of field?), auditing your own workflow, verifying original files against edits. The GPS data is the part to think about before sharing — home addresses travel inside vacation photos.`,
      `See something you'd rather not publish? Strip Image Metadata removes the entire record in one pass — view first, strip before sharing.`,
    ],
    faq: [
      { q: "What is EXIF data?", a: "Metadata embedded by cameras and phones — camera model, lens, exposure settings, date, and often GPS location." },
      { q: "Does every photo have EXIF?", a: "No — messaging apps and social platforms strip most of it on upload; original files from cameras carry the full record." },
      { q: "Is GPS in my photos a real privacy risk?", a: "Yes — coordinates pinpoint where the photo was taken. Strip metadata before public sharing." },
    ],
  },
  "strip-metadata-image": {
    paragraphs: [
      `Before an image goes public, its metadata should go private: EXIF carries GPS coordinates, device serials, timestamps, and software trails that serve no purpose for the audience but plenty for a stranger. This tool re-encodes the image with the metadata gone — every field, including location, removed.`,
      `The mechanism is the guarantee: re-encoding through the canvas produces a fresh file whose only content is pixels. No selective keeping, no partial stripping — the output is clean by construction. Visual quality is preserved (lossless PNG, or JPG at your chosen quality).`,
      `Make it a habit for anything headed to public marketplaces, dating profiles, forums, or news outlets — the photos you share say more than you see, until you strip them.`,
    ],
    faq: [
      { q: "Is this safe for sharing?", a: "Yes — re-encoding strips all metadata including GPS. What remains is only the image itself." },
      { q: "Does stripping affect image quality?", a: "No visual loss with PNG output; JPG re-encoding uses your chosen quality setting." },
      { q: "Which metadata is removed?", a: "All of it — EXIF, GPS, camera info, editing-software traces. Pixels stay; the diary goes." },
    ],
  },
  "image-histogram": {
    paragraphs: [
      `A histogram is the photograph's EKG: a graph of how many pixels sit at each brightness level, channel by channel. Reading it is the difference between guessing and knowing — a histogram stacked left says underexposed, clipped at the right says blown highlights, and neither is visible on a bright phone screen in daylight.`,
      `This tool plots the red, green, and blue channel distributions plus luminance, with the statistics that matter: mean brightness, clipping percentages at both ends. The clipping readout is the killer feature — pixels already lost to pure black or white are unrecoverable, and the histogram says so before you edit further.`,
      `Photographers use histograms because LCDs lie and data doesn't; this tool brings that discipline to any image, in the browser.`,
    ],
    faq: [
      { q: "What does a 'good' histogram look like?", a: "Tonal data spread across the range without hard clipping at either edge — no right answer, but clipping is always a warning." },
      { q: "Why check histograms when the preview looks fine?", a: "Screens deceive — brightness, contrast, and color profiles vary. The histogram is ground truth." },
    ],
  },
  "color-picker-image": {
    paragraphs: [
      `Every design project starts with "what color is that, exactly?" — the brand blue in a screenshot, the perfect green in a photo, the shade you need to match a companion asset. This tool samples any pixel: click, and the HEX, RGB, and HSL values land on your clipboard.`,
      `HSL is the quietly valuable output: knowing a color is "hue 210, saturation 40%, lightness 55%" tells you how to build its siblings — the hover state, the darker variant, the muted companion. HEX is for pasting; HSL is for understanding.`,
      `An eyedropper plus a zoomed preview handles the practical difficulty — single pixels in anti-aliased areas vary — so sampling a small region and choosing the dominant value beats clicking blind.`,
    ],
    faq: [
      { q: "Which format should I copy?", a: "HEX for CSS and design tools; HSL when you plan to build variants by adjusting lightness or saturation." },
      { q: "Why do nearby pixels give different values?", a: "Anti-aliasing blends edges — sample the center of a solid area, or zoom to inspect individual pixels." },
    ],
  },
  "image-compare": {
    paragraphs: [
      `Did the compression ruin it? Did the resize soften it? Did the edit improve it? These questions answer themselves with a proper comparison: two images, aligned, with a slider that sweeps between them. This tool builds exactly that — before/after with a draggable divide, or a side-by-side view.`,
      `The slider overlay is the honest instrument: pixel-perfect alignment means any difference you see at the divide is real, not a display artifact. It's the quality-control tool for every other tool on this site — compare original to compressed, to resized, to filtered.`,
      `Export the comparison itself as a single image (the before/after composite) for showing others — the format review threads and portfolio case-studies are made of.`,
    ],
    faq: [
      { q: "Do both images need the same dimensions?", a: "They align best when equal; the tool scales to match when they differ, with a note." },
      { q: "Can I export the comparison?", a: "Yes — the slider composite exports as a single image for sharing." },
    ],
  },

  // ── Utility ────────────────────────────────────────────────────
  "compress-image": {
    paragraphs: [
      `Image compression is the everyday economics of the web: a 6 MB photo is a slow page, a failed upload, a storage bill — the same image at 300 KB is invisible infrastructure. This tool compresses JPG/PNG/WebP with a quality slider and, crucially, shows the before/after size live, so you find the sweet spot empirically.`,
      `The sweet spot is usually 75–85% quality: at that range, file sizes drop 60–80% while visual difference is essentially nil. Below 60%, artifacts start announcing themselves; above 90%, you're paying bytes for difference nobody can see.`,
      `Mozjpeg-style optimization handles the JPG path (better compression than standard encoders at equal quality); PNG recompresses with palette optimization where the content allows. Everything stays local — batch-compressing a client's photo library leaks nothing.`,
    ],
    faq: [
      { q: "How much can I compress?", a: "Typically 30–70% size reduction with minimal visible loss — depends on the original. The live preview shows exactly what you get." },
      { q: "What quality setting should I use?", a: "75–85% is the practical sweet spot for photos; higher for text-heavy graphics, which compress differently." },
      { q: "Is compression lossy?", a: "For JPG/WebP, yes — that's where the savings come from. PNG recompression is lossless (or palette-quantized when you opt in)." },
    ],
  },
  "image-to-pdf-image": {
    paragraphs: [
      `Photos to PDF, from the image side of the house: this tool bundles image files into a PDF document — one image per page, ordered by drag-and-drop, sized to fit standard paper or kept at native dimensions. It's the sibling of the PDF category's converters, tuned for image workflows.`,
      `The page-fit choice drives the result: "fit to A4/Letter" produces printable documents (receipts, forms, photo attachments for claims); "native size" preserves exact pixels for archival. Mixed image formats (JPG, PNG, WebP) feed in together without pre-conversion.`,
      `When the destination is Word rather than PDF — captions, notes, editing to follow — Bulk Images to Document builds a DOCX instead.`,
    ],
    faq: [
      { q: "Which image formats can I bundle?", a: "JPG, PNG, WebP, GIF, and BMP mix freely; HEIC and TIFF convert via their dedicated tools first for best fidelity." },
      { q: "How is quality affected?", a: "Image data embeds without recompression — what you see is what the PDF contains." },
    ],
  },
  "svg-to-pdf-image": {
    paragraphs: [
      `SVG into PDF is the vector-to-vector handshake: graphics stay sharp at any print size, text stays text (where the SVG embeds fonts), and the PDF becomes the portable, signable, print-shop-ready container. This tool renders your SVG onto PDF pages via svg2pdf.js — a true vector mapping, not a rasterized screenshot.`,
      `The result scales like the original: a logo exported at 20mm prints at 2 meters without softening. Page sizing is flexible — fit the artwork to A4/Letter, or size the page to the artwork exactly (the plotter-printer-friendly option).`,
      `Font handling is the one craft point: SVGs referencing non-embedded fonts may substitute; embed fonts in the SVG for print-exact text.`,
    ],
    faq: [
      { q: "Is the PDF vector or raster?", a: "Vector — the SVG maps into PDF drawing commands, staying sharp at any scale." },
      { q: "Why does my text look different?", a: "Un-embedded fonts substitute at render time; embed fonts in the SVG for exact output." },
    ],
  },
  "image-to-base64": {
    paragraphs: [
      `Base64 encoding turns an image into text — a string you can paste into HTML, CSS, JSON, or an email template, eliminating a separate file request. Icons inline as data URIs load without a round-trip; images embedded in JSON APIs travel as strings; single-file HTML artifacts carry their graphics inside.`,
      `The tool produces both flavors: the raw Base64 and the ready-to-paste data URI (data:image/png;base64,...) with the correct MIME type. Copy either, drop it where it belongs. The cost is honest: Base64 inflates size ~33%, so this is for small images — icons, logos, placeholders — not photo libraries.`,
      `For web performance, inline only what's worth a round-trip: icons under a few KB benefit; large images belong behind proper URLs with caching.`,
    ],
    faq: [
      { q: "What is Base64?", a: "An encoding of binary data as text — useful for embedding images directly in HTML, CSS, or JSON without separate files." },
      { q: "Why is my image bigger as Base64?", a: "Text encoding adds ~33% overhead — it's the price of embedding. Use it for small graphics where skipping a request wins." },
    ],
  },
  "base64-to-image": {
    paragraphs: [
      `The decoder side of the data-URI world: a Base64 string — from an API response, an email template, a database export — becomes a viewable, downloadable image again. Paste, preview, download as PNG; the round trip closes.`,
      `The tool handles both raw Base64 and full data URIs (with or without the data:image/...;base64, prefix), detecting the format automatically. Validation catches malformed strings before they confuse anyone — a broken Base64 is a silent failure everywhere else.`,
      `Debugging email signatures, extracting images from API payloads, and recovering assets from single-file HTML exports are the recurring scenarios — anywhere images travel as text and need to become pictures again.`,
    ],
    faq: [
      { q: "Does it accept data URIs with the prefix?", a: "Yes — paste with or without the data:image/...;base64, header; both decode." },
      { q: "What if the string is invalid?", a: "The tool reports the error rather than producing a corrupt file." },
    ],
  },
  "image-qr-generator": {
    paragraphs: [
      `A QR code is a hyperlink for the physical world — and this generator makes them as PNG images: URLs, text, Wi-Fi credentials, contact cards, anything short enough to encode. Choose size, error correction, and colors; download a crisp PNG ready for screens and print.`,
      `Error correction is the setting that matters: level M suits clean digital display; level Q or H survives print wear, stickers, and partial occlusion — the difference between a code that scans at the conference and one that doesn't. High contrast (dark on light) matters more than any styling creativity.`,
      `For codes headed to print, the PDF pipeline (QR to PDF) puts the code on a properly-sized page; this tool's PNG is the digital-native output.`,
    ],
    faq: [
      { q: "How much data fits in a QR code?", a: "Roughly 4,000 alphanumeric characters at the maximum — but shorter content produces simpler, more scannable codes." },
      { q: "Which error correction should I pick?", a: "M for screens; Q or H for print, stickers, and anywhere the code might get scuffed." },
      { q: "Can I style the colors?", a: "Yes — keep high contrast (dark on light) and the code stays scannable." },
    ],
  },
  "barcode-generator": {
    paragraphs: [
      `Barcodes are retail's and logistics' Latin — Code128 for shipping and inventory, EAN-13 for global retail products, UPC-A for North American shelves. This generator produces them as print-ready images: enter the data, choose the format, download a crisp barcode with proper quiet zones.`,
      `Format choice is dictated by context: retail products need EAN/UPC (assigned via GS1 — the numbers aren't freeform), internal inventory uses Code128 or Code39 (any content you like). The tool validates data per format — a 12-digit UPC with a typo is worse than no barcode.`,
      `Print size matters for scanners: barcodes below ~1.5cm height and excessive scaling both cause scan failures — the generator's sizing keeps the geometry scanner-friendly.`,
    ],
    faq: [
      { q: "Which format do I need?", a: "Retail products: EAN-13/UPC-A (GS1-assigned numbers). Internal use: Code128 handles any text." },
      { q: "Why won't my barcode scan?", a: "Usually print size or contrast — keep bars at least ~1.5cm tall on dark-on-light, and don't scale non-uniformly." },
    ],
  },
  "favicon-generator": {
    paragraphs: [
      `A favicon set is the finishing touch that separates shipped sites from almost-shipped ones: the browser tab icon, the home-screen icon, the taskbar tile — each a different size, all from one source image. This generator produces the full set from a single upload.`,
      `Start from a square PNG at 512px or larger, simple and high-contrast — favicons render at 16px, where detail dies and bold shapes survive. The generator emits the classic favicon.ico plus the PNG set (16, 32, 180, 192, 512) and the manifest entries modern browsers expect.`,
      `Drop the files in the site root, reference the manifest, and the site looks finished in every context — tabs, bookmarks, installed PWAs, and link previews.`,
    ],
    faq: [
      { q: "What source image works best?", a: "Square, 512px+, simple and bold — detail under 32px is invisible, so icons want shapes, not illustrations." },
      { q: "Which files do I actually need?", a: "favicon.ico plus the 192/512 PNGs with a manifest covers browsers, Android, and PWAs — the generator emits all of them." },
    ],
  },
  "image-collage": {
    paragraphs: [
      `A collage is layout design in miniature: several photos, one composition, a story told by arrangement. This tool offers template-driven collages — grids, stacks, creative layouts — with drag-and-drop image placement, adjustable spacing, borders, and background.`,
      `Template choice sets the tone: clean grids read as organized (team pages, product sets); irregular creative layouts read as personal (travel recaps, event mementos). Spacing and border controls tune between airy and dense — the difference between a mood board and a contact sheet.`,
      `Output at your chosen resolution makes the collage print-ready or social-ready — one composite image instead of an album, which is occasionally exactly the deliverable.`,
    ],
    faq: [
      { q: "Can I rearrange photos after choosing a template?", a: "Yes — drag images between slots; templates define the layout, you define who goes where." },
      { q: "How many images fit?", a: "Templates span 2 to 16+ slots; pick by how many photos the story needs." },
    ],
  },
  "images-to-grid": {
    paragraphs: [
      `The grid is the collage's disciplined sibling: every cell equal, every image aligned — the look of contact sheets, portfolio walls, and catalog pages. This tool arranges any number of images into an evenly-spaced grid (2×2, 3×3, 4×4, custom) with uniform cell sizing and gutters.`,
      `Cell fitting crops each image to fill its cell (cover behavior) or fits it whole (contain), selectable per build — cover for visual rhythm, contain when cropping a diagram is unacceptable. Gutter width and background complete the geometry.`,
      `For product overviews, team rosters, and before/after collections, the grid's uniformity is the point: attention goes to the content, not the layout.`,
    ],
    faq: [
      { q: "Cover or contain for cell fitting?", a: "Cover (fill and crop) for photos and visual consistency; contain (fit whole) for diagrams and screenshots where cropping loses meaning." },
      { q: "Can I mix image sizes in one grid?", a: "Yes — cells normalize them; that's the grid's whole value." },
    ],
  },
  "photo-grid": {
    paragraphs: [
      `The Pinterest-style photo grid is masonry layout: columns of images at natural heights, edges aligned horizontally — the organic, editorial look where every image keeps its own aspect ratio. This tool builds it from your image set, with column count and spacing controls.`,
      `Masonry's charm is respect for the source: portraits stay portrait, panoramas stay wide, and the composition breathes in a way rigid grids never do. Column count tunes the density — two columns for storytelling, four-plus for breadth.`,
      `Mood boards, travel recaps, and portfolio walls are the natural fits — anywhere the images' individual shapes are part of the story.`,
    ],
    faq: [
      { q: "What's the difference from a regular grid?", a: "Masonry keeps each image's natural aspect ratio (varying heights); a standard grid forces uniform cells with cropping." },
      { q: "How many columns should I use?", a: "Two to three for larger images and storytelling; four or more for many small images and breadth-first browsing." },
    ],
  },
  "image-strip": {
    paragraphs: [
      `The image strip is the linear layout: photos concatenated horizontally or vertically into a single continuous image — film-strip style, step-by-step guides, comparison sequences, banner elements. This tool assembles strips with uniform sizing and optional gaps and borders.`,
      `Direction is the design decision: horizontal strips suit sequences and timelines; vertical strips suit sidebar content and mobile-friendly stacks. Images resize to a common height (horizontal) or width (vertical), so the strip reads as one object rather than a pile.`,
      `Step-by-step instructions benefit most: five screenshots in a numbered vertical strip communicate in one image what five attachments never do.`,
    ],
    faq: [
      { q: "How are different image sizes handled?", a: "They normalize to a common height (horizontal strips) or width (vertical strips) — the strip stays coherent." },
      { q: "Can I add gaps between images?", a: "Yes — adjustable gaps and borders per strip." },
    ],
  },
  "before-after-slider": {
    paragraphs: [
      `The before/after slider is persuasion in a single image: two photos, one dividing line the viewer drags — retouching reveals, renovation reveals, product improvements. This tool composites the pair into one image with the slider mechanism built in, ready for embedding anywhere a static image can live.`,
      `The images must align for the effect to work — same dimensions, same framing — so shoot before/after pairs from the same position. The tool guides alignment and renders the interactive composite; the exported image carries the interaction (where embedded) or the split view (where it doesn't).`,
      `For portfolios and case studies, one slider image replaces a paragraph of claims: the viewer performs the comparison, and doing beats being told.`,
    ],
    faq: [
      { q: "Do the images need to be the same size?", a: "Yes — alignment is the entire effect; shoot from the same position or export at matched dimensions." },
      { q: "Does the slider stay interactive in the exported image?", a: "Where the embedding platform supports it, yes; otherwise it renders as the split composite." },
    ],
  },
  "image-tile": {
    paragraphs: [
      `Tiling repeats an image into a pattern — the technique behind wallpapers, textures, and seamless backgrounds. This tool repeats your image across a chosen canvas with configurable tile size and spacing, producing the tiled result as a single image.`,
      `Seamlessness is the craft question: an image that tiles without visible seams makes wallpaper; one with hard edges makes a grid of copies. For true seamless patterns, prepare the source with matching edges (any texture tool does this); this tool handles the repetition faithfully either way.`,
      `Designers use it to preview patterns at scale, build backgrounds for mockups, and stress-test whether an asset is truly tileable — one export answers all three.`,
    ],
    faq: [
      { q: "How do I make a seamless pattern?", a: "The source must have matching edges — this tool repeats it faithfully; seam-fixing happens at the source." },
      { q: "Can I add spacing between tiles?", a: "Yes — gap controls create the spaced-tile look." },
    ],
  },
  "color-palette": {
    paragraphs: [
      `Every image contains a palette waiting to be extracted — the brand colors hiding in a logo, the mood colors inside a photo, the five shades that make a room feel right. This tool runs k-means clustering over your image and surfaces the dominant colors as a copyable palette (HEX and RGB).`,
      `Cluster count is the dial: three colors give the essence, five to seven give a workable design palette, more colors reproduce the image's nuance. The preview shows each cluster's weight — how much of the image each color owns — which is how you find the primary versus accent colors.`,
      `Designers extract palettes from inspiration photos to seed new work; marketers extract from brand imagery to enforce consistency. Either way, the palette is a starting point that beats a blank canvas.`,
    ],
    faq: [
      { q: "How many colors should I extract?", a: "3–5 for a usable palette; more for analysis. The weights show which colors dominate." },
      { q: "Why do my results differ from another tool?", a: "Clustering has initialization variance — runs vary slightly; the dominant colors are stable." },
    ],
  },
  "placeholder-generator": {
    paragraphs: [
      `Placeholder images are scaffolding: the gray rectangle with dimensions that stands in for the real asset while layouts, mockups, and prototypes take shape. This generator produces them on demand — exact dimensions, custom text (the dimensions, a label, anything), and colors that match the design's palette.`,
      `Beyond the default gray, matching placeholder colors to the final content's tone makes mockups feel real: a warm placeholder for a food site, brand colors for client presentations. Text labels (dimensions, roles like "hero" or "avatar") keep teams oriented during review.`,
      `For documentation and UI specs, placeholders carry the intent without the licensing risk of borrowed photos — the honest asset for the not-yet-designed.`,
    ],
    faq: [
      { q: "Can I customize the text?", a: "Yes — any label, with dimensions auto-suggested; color and font size are yours to set." },
      { q: "What formats are output?", a: "PNG (or JPG) at any dimensions you specify." },
    ],
  },
  "gradient-generator": {
    paragraphs: [
      `Gradients are the background music of design — rarely the subject, always the mood. This generator composes them: two or more color stops, linear or radial direction, exact pixel dimensions, exported as a ready-to-use image. The visual web runs on these — hero backgrounds, card washes, button fills, overlay layers.`,
      `Craft lives in the stops: analogous colors (blue→teal) produce calm, professional washes; complementary pairs (purple→orange) produce energy. The angle matters as much as the colors — diagonal gradients read dynamic, vertical reads classic, radial pulls focus to center.`,
      `Export at the display size (or 2× for retina) and the gradient lands in any tool that accepts images — no CSS required for contexts that don't support it.`,
    ],
    faq: [
      { q: "Which gradient direction should I use?", a: "Vertical for classic backgrounds, diagonal for energy, radial for spotlight effects — preview each against your content." },
      { q: "What resolution should I export?", a: "The display size at 2× for retina screens; gradients compress beautifully, so larger costs little." },
    ],
  },
};

export default IMAGE_GUIDES_B;
