// lib/content/text-tools.ts
//
// Editorial content for text tools. The catalog's text category currently
// holds the P2P chat tool; its catalog entry already carries a rich guide,
// so this file adds the long-form page content and extra FAQs.

import type { ToolGuideMap } from "./types";

const TEXT_GUIDES: ToolGuideMap = {
  "p2p-text": {
    paragraphs: [
      `Getting a paragraph from your phone to your laptop shouldn't require emailing yourself — yet that's still the reflex for most people, complete with a sent-folder full of "draft" messages to one's own address. P2P Text replaces the ritual with a four-character code: open this page on both devices, create a room on one, join on the other, and type.`,
      `The connection is genuinely peer-to-peer: WebRTC data channels link the two browsers directly, encrypted with DTLS end to end. A public broker performs only the introduction — matching the two devices by their shared code — and never sees a single message afterward. If a direct path is blocked by strict network NATs, a relay steps in automatically, still without any storage on our side.`,
      `Practical notes from real use: large pastes work (messages chunk automatically up to ~200,000 characters), and the session exists only while both tabs stay open — close them and the room, and everything in it, ceases to exist. For files rather than text, the Transfer page moves documents up to 50 GB with the same direct-device architecture.`,
    ],
    faq: [
      { q: "Where does the text go when I close the tab?", a: "Nowhere — there's no server-side storage at all. The conversation lives only in the two open browsers; closing either ends it permanently." },
      { q: "Can a third device join the room?", a: "Rooms are two-party by design; a code holder joining while a session is active starts a fresh pairing instead." },
      { q: "Is it truly serverless?", a: "The handshake uses a public signaling broker (as any WebRTC connection requires), but message data flows device-to-device only, encrypted." },
    ],
  },
};

export default TEXT_GUIDES;
