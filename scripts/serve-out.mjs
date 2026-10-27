// Minimal static server for the `out/` export (clean URLs supported).
// Usage: node scripts/serve-out.mjs [port]
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..", "out");
const port = Number(process.argv[2] || 4321);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
};

async function resolveFile(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split("?")[0])).replace(/^(\.\.[/\\])+/, "");
  let p = join(root, clean);
  const candidates = [p, `${p}.html`, join(p, "index.html")];
  for (const c of candidates) {
    if (!c.startsWith(root)) continue;
    try {
      const data = await readFile(c);
      return { data, type: TYPES[extname(c)] || "application/octet-stream" };
    } catch {}
  }
  try {
    const data = await readFile(join(root, "404.html"));
    return { data, type: TYPES[".html"], status: 404 };
  } catch {
    return null;
  }
}

createServer(async (req, res) => {
  const file = await resolveFile(req.url || "/");
  if (!file) {
    res.writeHead(404).end("Not found");
    return;
  }
  res.writeHead(file.status || 200, { "content-type": file.type });
  res.end(file.data);
}).listen(port, () => console.log(`serving out/ on http://localhost:${port}`));
