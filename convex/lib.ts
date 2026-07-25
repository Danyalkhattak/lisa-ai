
export const MAX_FREE_MESSAGES_PER_MONTH = 50;

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
