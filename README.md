# FilesWow.com

> **100+ free PDF, Word & Image tools — entirely in your browser. No upload required. 100% private.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)

---

## What is FilesWow?

FilesWow is a comprehensive suite of **100+ client-side document and image processing tools**. Every operation — merging PDFs, converting Word documents, editing images, removing backgrounds — runs **entirely in your browser**. Your files are never uploaded to a server, making it the most private way to work with documents online.

## Features

### PDF Tools (80+)

| Category | Tools |
|----------|-------|
| **Organize** | Merge, Split, Rotate, Reorder, Delete Pages, Extract Pages, Insert Pages, Duplicate Pages, N-up Layout |
| **Edit** | Crop, Resize, Watermark, Page Numbers, Header/Footer, Stamps, Bookmarks, Metadata, Bates Numbering, Crop Marks |
| **Convert** | PDF↔Word, PDF↔HTML, PDF↔EPUB, PDF↔PowerPoint, PDF↔Excel, PDF↔Markdown, PDF↔CSV, PDF↔SVG, PDF↔Text, HTML→PDF, Markdown→PDF |
| **Security** | Protect (AES-256), Unlock, Redact, Strip Metadata, Password Checker |
| **Forms** | Fill PDF Forms, Create PDF Forms, Flatten PDF Forms |
| **Analyze** | PDF Info Viewer, Compare PDFs, Encryption Checker, Page Analyzer, Verify Signatures |

### Word / DOCX Tools (30+)

| Category | Tools |
|----------|-------|
| **Organize** | Merge, Split Word Documents |
| **Convert** | Word↔PDF, Word↔Text, Word↔HTML, Word↔Markdown, Word↔EPUB, Word↔ODT, Word→PowerPoint |
| **Edit** | Watermark, Page Numbers, Header/Footer, Find & Replace, Track Changes, Template Filler, Style Cleaner, TOC Generator |
| **Security** | Protect, Unlock, Redact Word Documents |
| **Analyze** | Compare Documents, Comments Extractor, Metadata Editor, Font Embed Checker |

### Image Tools (60+)

| Category | Tools |
|----------|-------|
| **Convert** | JPG↔PNG, WebP↔JPG/PNG, HEIC→JPG/PNG, TIFF/BMP→JPG, GIF→PNG/JPG, SVG↔PNG, ICO↔PNG, AVIF→JPG, RAW→JPG |
| **Crop & Resize** | Resize, Crop, Scale, Smart Crop |
| **Rotate & Flip** | Rotate, Flip, Mirror, Straighten |
| **Filters** | Blur, Sharpen, Grayscale, Sepia, Invert, Threshold, Emboss, Edge Detect, Oil Painting, Cartoon, Pencil Sketch |
| **Adjust** | Brightness/Contrast, Saturation, Hue, Exposure, Color Temperature, Vignette, Gamma |
| **Effects** | Watermark, Opacity, Pixelate, Mosaic, Duotone, Vintage, Fade, Background Removal, Change BG Color |
| **Annotate** | Add Text, Borders, Rounded Corners, Circle Crop, Shadow, Meme Generator, Draw, Arrows/Shapes, Stickers |
| **Utility** | Compress, Image to PDF, QR Code Generator, Barcode Generator, Favicon Generator, Collage, Grid, Color Palette |

### Cross-Format Utilities

- **Universal Converter** — Convert any supported format to PDF or DOCX
- **Batch Converter** — Process multiple files at once (ZIP in, ZIP out)
- **Side-by-Side Diff** — Compare two files visually
- **Signature Library** — Save and reuse signatures across tools
- **Command Palette** — Instant tool search with `Ctrl+K` / `Cmd+K`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| UI | [React 19](https://react.dev), [Tailwind CSS 4](https://tailwindcss.com) |
| Language | [TypeScript 5](https://typescriptlang.org) |
| PDF Processing | [pdf-lib](https://pdf-lib.js.org), [pdf.js](https://mozilla.github.io/pdf.js/), [mupdf.js](https://mupdf.com) |
| Word Processing | [mammoth.js](https://github.com/mwilliamson/mammoth.js), [docx](https://docx.js.org) |
| Image Processing | Canvas API, [@imgly/background-removal](https://img.ly) |
| Spreadsheet | [SheetJS (xlsx)](https://sheetjs.com) |
| OCR | [Tesseract.js](https://tesseract.projectnaptha.com) |
| Compression | [jsPDF](https://github.com/parallax/jsPDF), [html2canvas](https://html2canvas.hertzen.com), [JSZip](https://stuk.github.io/jszip) |
| Utilities | [qrcode.js](https://github.com/soldair/node-qrcode), [JsBarcode](https://github.com/lindell/JsBarcode) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- npm, yarn, pnpm, or bun

### Installation

```bash
git clone https://github.com/your-org/fileswow.git
cd fileswow
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Project Structure

```
fileswow/
├── src/
│   ├── app/                     # Next.js App Router pages
│   │   ├── page.tsx             # Homepage
│   │   ├── layout.tsx           # Root layout (Header, Footer, Theme)
│   │   ├── pdf-tools/           # PDF tool hub pages
│   │   ├── word-tools/          # Word tool hub pages
│   │   ├── image-tools/         # Image tool hub pages
│   │   └── tools/               # Individual tool pages (dynamic routes)
│   ├── components/              # Shared UI components
│   │   ├── header.tsx           # Site header with navigation
│   │   ├── footer.tsx           # Site footer
│   │   ├── drop-zone.tsx        # File upload drop zone
│   │   ├── download-button.tsx  # Download trigger
│   │   ├── progress-bar.tsx     # Processing progress indicator
│   │   ├── search-modal.tsx     # Tool search modal
│   │   ├── tool-card.tsx        # Tool display card
│   │   ├── tool-shell.tsx       # Tool page layout wrapper
│   │   └── tools/               # Individual tool components
│   ├── lib/                     # Shared utilities and logic
│   │   ├── catalog.ts           # Tool registry (single source of truth)
│   │   ├── search.ts            # Search logic
│   │   ├── theme-provider.tsx   # Dark/light theme context
│   │   └── engines/             # Processing engine wrappers
│   └── types/                   # TypeScript type definitions
├── public/                      # Static assets
├── scripts/                     # Build/utility scripts
├── next.config.ts               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies and scripts
```

## Architecture

### Client-Side Processing

All file processing happens in the browser using WebAssembly modules and JavaScript libraries. No files are ever sent to a server. This means:

- **Zero privacy risk** — files stay on your device
- **No file size limits** — limited only by your device's memory
- **Works offline** — once loaded, tools can work without an internet connection
- **Free forever** — no server costs means no paywalls

### Tool Registry

Every tool is defined in a central `src/lib/catalog.ts` file as a `ToolDef` object containing:

```typescript
interface ToolDef {
  slug: string;           // URL-friendly identifier
  name: string;           // Display name
  description: string;    // Short description
  category: 'pdf' | 'word' | 'image' | 'cross';
  subCategory: string;    // e.g., 'convert', 'edit', 'organize'
  tier: 1 | 2 | 3;       // Priority tier
  engine: string;         // Processing engine used
  icon: string;           // Emoji icon
  relatedSlugs: string[]; // Related tools
  howItWorks: string[];   // Step-by-step instructions
  faq: { q: string; a: string }[];  // FAQ entries
}
```

All tool metadata — names, descriptions, FAQs, how-it-works steps — is defined in this single file. Components consume this data to render consistent UIs across all tools.

### Theme System

FilesWow supports light and dark themes with a `data-theme` attribute on the `<html>` element. Theme preference is persisted in `localStorage` and respects the system's `prefers-color-scheme`.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-tool`)
3. Add your tool definition to `src/lib/catalog.ts`
4. Create the tool component in `src/components/tools/`
5. Add the route in `src/app/tools/`
6. Run `npm run lint` and verify the build
7. Submit a pull request

## Privacy

FilesWow is built with a **privacy-first architecture**:

- All processing runs locally in your browser
- No files are uploaded to any server
- No analytics that track file contents
- Signatures are stored in `localStorage` / `IndexedDB` only

## License

[MIT](LICENSE)

---

<p align="center">
  <a href="https://fileswow.com">fileswow.com</a> · Your files never leave your device.
</p>
