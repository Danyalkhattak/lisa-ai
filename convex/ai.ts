/**
 * AI Action — Gemini Integration for Lisa AI.
 *
 * Simplified version: Plain chat only, no function calling.
 * 
 * This module provides the `chat` action that:
 *   1. Verifies user authentication and conversation ownership
 *   2. Loads recent conversation history for context
 *   3. Calls Google Gemini API as a simple chat model
 *   4. Saves the assistant response to the database
 *   5. Returns the response for real-time display
 *
 * Environment Variables Required:
 *   - GEMINI_API_KEY: Google Generative AI API key
 */

import { action, httpAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { requireClerkSubject } from "./auth";

// ============================================================
// Types
// ============================================================

interface GenerateReplyResult {
  content: string;
}

interface GenerateAIReplyArgs {
  conversationId: string;
  userMessage: string;
  messageId?: string;
}

interface GeminiContent {
  role: "user" | "model";
  parts: { text: string }[];
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts: { text?: string; functionCall?: any }[];
      role?: string;
    };
    finishReason?: string;
  }>;
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

// ============================================================
// Constants
// ============================================================

/** System prompt - Lisa's persona */
const LISA_SYSTEM_PROMPT = `You are Lisa, a helpful AI voice assistant, developed by Danny K.

Your personality:
- Friendly, warm, and conversational
- Keep responses short (1-3 sentences) since they'll be spoken aloud
- Sound natural, like talking to a friend

What you can do:
- Chat about anything
- Answer questions
- Help with tasks and provide information
- Be helpful and engaging

Important: Keep responses concise and conversational. You're a voice assistant, so your responses will be spoken aloud.`;

/**
 * Default model - Gemini 3.5 Flash Lite (fast, cost-effective).
 * NOTE: verify this model name is live on your Gemini API key before
 * final submission — Google occasionally renames/retires preview
 * model ids. If a call fails with a 404 "model not found", check
 * https://ai.google.dev/gemini-api/docs/models for the current name.
 */
const DEFAULT_MODEL = "gemini-3.5-flash-lite";

/** Maximum messages for context */
const MAX_CONTEXT_MESSAGES = 20;

// ============================================================
// Helper Functions
// ============================================================

function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Run `npx convex env set GEMINI_API_KEY your-key`"
    );
  }
  return apiKey;
}

async function callGeminiAPI(
  model: string,
  contents: GeminiContent[]
): Promise<GeminiResponse> {
  const apiKey = getGeminiApiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  return await response.json();
}

// ============================================================
// Core AI Logic
// ============================================================

async function buildGeminiContents(
  ctx: any,
  args: GenerateAIReplyArgs,
  clerkId: string
): Promise<GeminiContent[]> {
  const conversation = await ctx.runQuery(
    internal.conversations.get,
    { conversationId: args.conversationId as any }
  );

  if (!conversation || conversation.userId !== clerkId) {
    throw new Error("Conversation not found or access denied");
  }

  // Load recent messages for context
  const recentMessages = await ctx.runQuery(internal.messages.list, {
    conversationId: args.conversationId,
    limit: MAX_CONTEXT_MESSAGES,
  });

  // Build conversation contents for Gemini
  const contents: GeminiContent[] = [];

  // Add system prompt
  contents.push({
    role: "user",
    parts: [{ text: `[System Instructions]\n${LISA_SYSTEM_PROMPT}` }],
  });
  contents.push({
    role: "model",
    parts: [{
      text: "Got it! I'm Lisa, your friendly AI assistant. How can I help you today?",
    }],
  });

  // Add conversation history
  for (const msg of recentMessages) {
    if (args.messageId && msg._id === args.messageId) continue;

    const role: "user" | "model" = msg.role === "assistant" ? "model" : "user";
    contents.push({ role, parts: [{ text: msg.content }] });
  }

  // Add current user message
  contents.push({
    role: "user",
    parts: [{ text: args.userMessage }],
  });

  return contents;
}

async function generateAIReply(
  ctx: any,
  args: GenerateAIReplyArgs
): Promise<GenerateReplyResult> {
  // 1. Authenticate & verify ownership
  const clerkId = await requireClerkSubject(ctx);

  // 2-3. Load context & build conversation contents for Gemini
  const contents = await buildGeminiContents(ctx, args, clerkId);

  // 4. Call Gemini API (simple chat, no tools)
  let geminiResponse: GeminiResponse;

  try {
    geminiResponse = await callGeminiAPI(DEFAULT_MODEL, contents);
  } catch (err) {
    console.error("[ai] Gemini API call failed:", err);
    
    const errorMessage = "I'm having trouble connecting right now. Please try again.";
    
    await ctx.runMutation(internal.messages.saveAssistantMessage, {
      conversationId: args.conversationId,
      content: errorMessage,
    });

    return { content: errorMessage };
  }

  if (geminiResponse.error) {
    throw new Error(`Gemini API error: ${geminiResponse.error.message}`);
  }

  const candidate = geminiResponse.candidates?.[0];
  if (!candidate?.content?.parts?.length) {
    throw new Error("Empty response from Gemini");
  }

  // Extract text response (ignore any function calls)
  const textResponse = candidate.content.parts
    .filter((part) => part.text)
    .map((part) => part.text!)
    .join("");

  if (!textResponse) {
    // Fallback if model tried to use function calling
    return { content: "I understand. Let me help you with that." };
  }

  // 5. Save assistant message
  await ctx.runMutation(internal.messages.saveAssistantMessage, {
    conversationId: args.conversationId,
    content: textResponse,
  });

  return { content: textResponse };
}

// ============================================================
// Exported Actions
// ============================================================

/**
 * Simple chat action - sends message, gets AI response, saves it.
 */
export const chat = action({
  args: {
    conversationId: v.id("conversations"),
    message: v.string(),
  },
  handler: async (ctx, args): Promise<GenerateReplyResult> => {
    // Save user's message first
    const messageId = await ctx.runMutation(internal.messages.send, {
      conversationId: args.conversationId,
      content: args.message,
    });

    // Generate AI reply
    return generateAIReply(ctx, {
      conversationId: args.conversationId,
      userMessage: args.message,
      messageId,
    });
  },
});

// ============================================================
// Streaming HTTP endpoint (WebKit/Safari path)
// ============================================================

/**
 * HTTP-streamed variant of `chat`.
 *
 * `chat` above is a normal Convex `action`, reached from the client
 * via `useAction`, which round-trips over Convex's WebSocket
 * connection. On iOS/macOS Safari that connection has been observed
 * to leave the client's promise unresolved even though the action
 * completed and the reply was persisted server-side (confirmed via
 * the Convex dashboard/logs) — the UI is stuck on "Thinking..."
 * forever. Other browsers (Chrome, Firefox, Edge, Android) don't
 * show this symptom, so rather than touching the WebSocket path for
 * everyone, this endpoint gives Safari/WebKit an alternate route
 * that never depends on that connection: a plain HTTPS POST with a
 * streamed response body, exactly like `/tts-stream` already does
 * for audio. Plain `fetch` + `ReadableStream` is old, boring, and
 * reliable on WebKit.
 *
 * As a bonus this also streams Gemini's reply token-by-token instead
 * of waiting for the full completion, so the client can render text
 * as it's generated instead of showing a static spinner — lower
 * perceived latency, matching (in fact beating) the non-streaming
 * path used elsewhere.
 *
 * The response body is plain UTF-8 text chunks (no SSE framing) —
 * the client just concatenates whatever it reads. The full reply is
 * still persisted via `messages.saveAssistantMessage` once the
 * stream ends, same as the non-streaming action.
 */
export const chatStream = httpAction(async (ctx, request) => {
  // Wide-open CORS is fine here: this endpoint requires a valid Clerk
  // bearer token to do anything (checked below) and doesn't rely on
  // cookies, so there's no session to leak cross-origin — same
  // reasoning as /tts-stream.
  const corsHeaders = { "Access-Control-Allow-Origin": "*" };

  let clerkId: string;
  try {
    clerkId = await requireClerkSubject(ctx);
  } catch {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  let payload: { conversationId?: string; message?: string };
  try {
    payload = await request.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400, headers: corsHeaders });
  }

  const conversationId = payload.conversationId;
  const userMessage = (payload.message ?? "").trim();
  if (!conversationId || !userMessage) {
    return new Response("Missing conversationId or message", {
      status: 400,
      headers: corsHeaders,
    });
  }

  // Save the user's message first, same as the `chat` action does.
  let messageId: string;
  try {
    messageId = await ctx.runMutation(internal.messages.send, {
      conversationId: conversationId as any,
      content: userMessage,
    });
  } catch (err: any) {
    return new Response(err?.message || "Failed to save message", {
      status: 403,
      headers: corsHeaders,
    });
  }

  let contents: GeminiContent[];
  try {
    contents = await buildGeminiContents(
      ctx,
      { conversationId, userMessage, messageId },
      clerkId
    );
  } catch (err: any) {
    return new Response(err?.message || "Failed to load conversation", {
      status: 403,
      headers: corsHeaders,
    });
  }

  const textHeaders = {
    ...corsHeaders,
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };

  let apiKey: string;
  try {
    apiKey = getGeminiApiKey();
  } catch (err: any) {
    const fallback = "I'm having trouble connecting right now. Please try again.";
    await ctx.runMutation(internal.messages.saveAssistantMessage, {
      conversationId: conversationId as any,
      content: fallback,
    });
    return new Response(fallback, { status: 200, headers: textHeaders });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`;

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
      }),
    });
  } catch (err) {
    console.error("[ai] chatStream: Gemini request failed:", err);
    const fallback = "I'm having trouble connecting right now. Please try again.";
    await ctx.runMutation(internal.messages.saveAssistantMessage, {
      conversationId: conversationId as any,
      content: fallback,
    });
    return new Response(fallback, { status: 200, headers: textHeaders });
  }

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => "");
    console.error(`[ai] chatStream: Gemini API error (${upstream.status}):`, errText);
    const fallback = "I'm having trouble connecting right now. Please try again.";
    await ctx.runMutation(internal.messages.saveAssistantMessage, {
      conversationId: conversationId as any,
      content: fallback,
    });
    return new Response(fallback, { status: 200, headers: textHeaders });
  }

  // Re-frame Gemini's SSE stream (`data: {...}\n\n` chunks of partial
  // JSON) into plain text deltas — the client doesn't need to know
  // anything about Gemini's wire format, just the words as they
  // arrive. The full text is accumulated here too, so it can be
  // persisted once the stream finishes.
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader();
      let buffer = "";
      let fullText = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;

            const jsonStr = trimmed.slice(5).trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const delta = (parsed?.candidates?.[0]?.content?.parts ?? [])
                .filter((part: any) => typeof part?.text === "string")
                .map((part: any) => part.text)
                .join("");

              if (delta) {
                fullText += delta;
                controller.enqueue(encoder.encode(delta));
              }
            } catch (parseErr) {
              // Malformed/partial SSE chunk — skip it, the rest of the
              // stream keeps flowing.
              console.error("[ai] chatStream: failed to parse chunk:", parseErr);
            }
          }
        }
      } catch (err) {
        console.error("[ai] chatStream: stream read failed:", err);
      }

      if (!fullText.trim()) {
        fullText = "I understand. Let me help you with that.";
        try {
          controller.enqueue(encoder.encode(fullText));
        } catch {
          /* controller may already be closing */
        }
      }

      try {
        await ctx.runMutation(internal.messages.saveAssistantMessage, {
          conversationId: conversationId as any,
          content: fullText,
        });
      } catch (err) {
        console.error("[ai] chatStream: failed to save assistant message:", err);
      }

      controller.close();
    },
  });

  return new Response(stream, { status: 200, headers: textHeaders });
});
