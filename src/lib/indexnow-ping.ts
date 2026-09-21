import { INDEXNOW_KEY } from "./indexnow";
import { SITE_URL } from "./site";

/**
 * Client-side IndexNow ping (static-export safe).
 *
 * The site is deployed as a fully static export (GitHub Pages), so there is
 * no server route to relay pings. IndexNow is designed for this: browsers may
 * submit URLs directly via GET. We use `mode: "no-cors"` fire-and-forget
 * requests — the search engine records the submission even though we can't
 * read the response.
 *
 * Submit at most ~10 URLs per session; IndexNow rate-limits abuse.
 */

const MAX_PINGS_PER_SESSION = 10;
let pingsThisSession = 0;

function ping(url: string): void {
  const endpoint =
    `https://api.indexnow.org/indexnow` +
    `?url=${encodeURIComponent(url)}` +
    `&key=${encodeURIComponent(INDEXNOW_KEY)}` +
    `&keyLocation=${encodeURIComponent(`${SITE_URL}/${INDEXNOW_KEY}.txt`)}`;

  // Fire-and-forget: we never need the response body.
  void fetch(endpoint, { mode: "no-cors", keepalive: true }).catch(() => {
    /* indexing is best-effort; ignore network failures */
  });
}

/**
 * Ping IndexNow with one or more site-relative paths, e.g. ["/", "/tools/merge-pdf"].
 * Silently does nothing after MAX_PINGS_PER_SESSION submissions.
 */
export function pingIndexNow(paths: string | string[]): void {
  if (typeof window === "undefined") return; // SSR guard
  if (pingsThisSession >= MAX_PINGS_PER_SESSION) return;

  const list = (Array.isArray(paths) ? paths : [paths])
    .filter((p) => typeof p === "string" && p.startsWith("/"))
    .slice(0, MAX_PINGS_PER_SESSION - pingsThisSession);

  for (const p of list) {
    pingsThisSession += 1;
    ping(`${SITE_URL}${p === "/" ? "" : p}`);
  }
}
