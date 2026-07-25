import { action, httpAction } from "./_generated/server";
import { requireClerkSubject } from "./auth";

const MAX_CHARS = 2000;
const STREAMING_MODEL_ID = "eleven_flash_v2_5";

// Fallback signal for picking a female voice when a voice's
// `labels.gender` isn't set — mirrors the list in tts.ts. Duplicated
// (rather than imported from tts.ts) because tts.ts is a `"use node"`
// file and importing from it here would drag this file into the Node
// runtime
const FEMALE_NAME_HINTS =
  /rachel|bella|domi|elli|dorothy|freya|grace|lily|matilda|charlotte|sarah|alice|jessica|nicole|emily|aria|sofia|olivia/i;

// Cached in-memory for the lifetime of this runtime instance — same
// optimization/tradeoffs as the cache in tts.ts, just a separate copy
// since the two files run in separate runtimes.
let cachedVoiceId: string | null = null;

async function resolveFemaleVoiceId(apiKey: string): Promise<string | null> {
  if (cachedVoiceId) return cachedVoiceId;

  const res = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": apiKey },
  });

  if (!res.ok) {
    console.error(`[ttsStream] Failed to list ElevenLabs voices (${res.status})`);
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
      "[ttsStream] No voices available on this ElevenLabs account — add one under 'My Voices' in the dashboard.",
    );
    return null;
  }

  cachedVoiceId = female.voice_id;
  return cachedVoiceId;
}

/**
 * Pre-warms the ElevenLabs integration by resolving (and caching) the
 * voice ID ahead of time, so the first real `speakStream` call of a
 * session doesn't pay for the extra "list voices" round trip. Cheap
 * and free to call (just lists voice metadata, no TTS characters
 * spent) — the client fires this once when a call starts.
 */
export const warm = action({
  args: {},
  handler: async (ctx) => {
    await requireClerkSubject(ctx);

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) return false;

    try {
      const voiceId = await resolveFemaleVoiceId(apiKey);
      return !!voiceId;
    } catch (err) {
      console.error("[ttsStream] Pre-warm failed:", err);
      return false;
    }
  },
});

export const speakStream = httpAction(async (ctx, request) => {
  // Wide-open CORS is fine here: this endpoint requires a valid Clerk
  // bearer token to do anything (checked below), and doesn't rely on
  // cookies, so there's no session to leak cross-origin.
  const corsHeaders = { "Access-Control-Allow-Origin": "*" };

  try {
    await requireClerkSubject(ctx);
  } catch (err) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    // Not configured — client falls back to browser TTS.
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  let payload: { text?: string };
  try {
    payload = await request.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400, headers: corsHeaders });
  }

  const text = (payload.text ?? "").trim().slice(0, MAX_CHARS);
  if (!text) {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const voiceId = await resolveFemaleVoiceId(apiKey);
    if (!voiceId) {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const upstream = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?optimize_streaming_latency=4`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: STREAMING_MODEL_ID,
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          // Default streaming format — higher-fidelity formats require
          // a paid ElevenLabs plan, this one is free-tier eligible.
          output_format: "mp3_44100_128",
        }),
      },
    );

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text().catch(() => "");
      console.error(`[ttsStream] ElevenLabs stream error (${upstream.status}):`, errText);
      // Cached voice may have become unusable — re-resolve next time.
      cachedVoiceId = null;
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Pipe the upstream stream straight through — no buffering, no
    // base64 round trip — so the browser gets bytes as ElevenLabs
    // produces them.
    return new Response(upstream.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[ttsStream] ElevenLabs streaming request failed:", err);
    return new Response(null, { status: 204, headers: corsHeaders });
  }
});
