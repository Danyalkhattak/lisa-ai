"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { requireClerkSubject } from "./auth";

/**
 * ElevenLabs text-to-speech.
 *
 * IMPORTANT: free-tier ElevenLabs accounts can only use voices that are
 * actually in *that account's* "My Voices" list — calling the TTS
 * endpoint with a hardcoded shared-library voice ID (e.g. the classic
 * "Rachel" premade voice) now returns 402 payment_required for free
 * accounts. So instead of hardcoding an ID, this asks ElevenLabs which
 * voices the configured API key's account actually has access to, and
 * picks a female one from that list.
 *
 * Returns `null` — rather than throwing — whenever ElevenLabs isn't
 * configured, the account has no usable voice, or the request fails,
 * so the client can silently fall back to the browser's built-in
 * SpeechSynthesis voice. This means the app keeps working with zero
 * setup, and gets nicer audio once an API key (with at least one
 * voice available) is added.
 *
 * Setup:
 *   1. Create a free account at https://elevenlabs.io
 *   2. Make sure at least one female voice shows up under "My Voices"
 *      in the ElevenLabs dashboard (free accounts start with a small
 *      default set; if yours is empty, add one from the Voice Library
 *      — free plans get 3 voice slots)
 *   3. Copy your API key from the dashboard
 *   4. npx convex env set ELEVENLABS_API_KEY your_key_here
 *
 * Free tier includes ~10,000 characters/month — MAX_CHARS below caps
 * each request well under that so a couple of long replies don't burn
 * the whole month's quota in one call.
 */

const MODEL_ID = "eleven_multilingual_v2";
const MAX_CHARS = 2000;

// Fallback signal for picking a female voice when a voice's `labels.gender`
// isn't set — matches common female names from ElevenLabs' voice catalog.
const FEMALE_NAME_HINTS =
  /rachel|bella|domi|elli|dorothy|freya|grace|lily|matilda|charlotte|sarah|alice|jessica|nicole|emily|aria|sofia|olivia/i;

// Cached in-memory for the lifetime of this action's runtime instance —
// just an optimization to avoid re-listing voices on every single
// message; safe to lose (e.g. on cold start), since it's re-resolved.
let cachedVoiceId: string | null = null;

async function resolveFemaleVoiceId(apiKey: string): Promise<string | null> {
  if (cachedVoiceId) return cachedVoiceId;

  const res = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": apiKey },
  });

  if (!res.ok) {
    console.error(`[tts] Failed to list ElevenLabs voices (${res.status})`);
    return null;
  }

  const data = await res.json();
  const voices = Array.isArray(data?.voices) ? data.voices : [];

  const female =
    voices.find((v: any) => v?.labels?.gender?.toLowerCase() === "female") ||
    voices.find((v: any) => FEMALE_NAME_HINTS.test(v?.name || "")) ||
    voices[0]; // last resort: whatever's available beats nothing

  if (!female?.voice_id) {
    console.error(
      "[tts] No voices available on this ElevenLabs account — add one under 'My Voices' in the dashboard.",
    );
    return null;
  }

  cachedVoiceId = female.voice_id;
  return cachedVoiceId;
}

export const speak = action({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    // Require sign-in so a stray/leaked action call can't run up
    // someone else's ElevenLabs quota anonymously.
    await requireClerkSubject(ctx);

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      // Not configured — client falls back to browser TTS.
      return null;
    }

    const text = args.text.trim().slice(0, MAX_CHARS);
    if (!text) return null;

    try {
      const voiceId = await resolveFemaleVoiceId(apiKey);
      if (!voiceId) return null;

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": apiKey,
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text,
            model_id: MODEL_ID,
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        },
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[tts] ElevenLabs error (${response.status}):`, errText);
        // The cached voice may have become unusable (e.g. removed from
        // My Voices, plan change) — drop it so the next call re-resolves.
        cachedVoiceId = null;
        return null; // fall back to browser TTS rather than throwing
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBase64 = Buffer.from(arrayBuffer).toString("base64");
      return { audioBase64, mimeType: "audio/mpeg" };
    } catch (err) {
      console.error("[tts] ElevenLabs request failed:", err);
      return null; // fall back to browser TTS
    }
  },
});
