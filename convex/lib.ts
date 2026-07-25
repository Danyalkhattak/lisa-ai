/**
 * Shared constants and pure helpers used across Convex function files.
 *
 * No Convex imports here — this is plain TypeScript so it can be
 * imported from any function file without circular-dependency risk.
 * Keeping it framework-agnostic also makes the helpers trivially
 * unit-testable in isolation.
 */

/** Free-tier monthly message cap. Enforced client-side for now; the
 *  server-side enforcement lands with the Stripe integration. */
export const MAX_FREE_MESSAGES_PER_MONTH = 50;

/** Default userSettings row, applied on first `userSettings.update`
 *  call when no row exists yet. Mirrors the client-side defaults
 *  defined in src/constants/theme.js. */
export const DEFAULT_SETTINGS = {
  voice: "", // browser default
  language: "en-US",
  inputLanguage: "en-US",
  speechRate: 1.0,
  geminiModel: "gemini-3.5-flash-lite",
  autoSpeak: true,
  voiceEnabled: true,
};

/**
 * Strip newlines, collapse whitespace, truncate to ~80 chars.
 * Used by `conversations.create` and `conversations.rename` so
 * conversation titles always render cleanly in the sidebar.
 *
 * @param {string} input
 * @returns {string}
 */
export function sanitizeTitle(input) {
  const trimmed = (input || "").replace(/\s+/g, " ").trim();
  if (trimmed.length <= 80) return trimmed || "Untitled";
  return trimmed.slice(0, 77) + "…";
}
