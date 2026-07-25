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

import { action } from "./_generated/server";
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

async function generateAIReply(
  ctx: any,
  args: GenerateAIReplyArgs
): Promise<GenerateReplyResult> {
  // 1. Authenticate & verify ownership
  const clerkId = await requireClerkSubject(ctx);

  const conversation = await ctx.runQuery(
    internal.conversations.get,
    { conversationId: args.conversationId as any }
  );

  if (!conversation || conversation.userId !== clerkId) {
    throw new Error("Conversation not found or access denied");
  }

  // 2. Load recent messages for context
  const recentMessages = await ctx.runQuery(internal.messages.list, {
    conversationId: args.conversationId,
    limit: MAX_CONTEXT_MESSAGES,
  });

  // 3. Build conversation contents for Gemini
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
