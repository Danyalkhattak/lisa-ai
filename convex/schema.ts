import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Lisa AI — Convex Schema
 *
 * Tables:
 *   users          - Synced from Clerk
 *   conversations  - Chat threads
 *   messages       - Messages within conversations
 *   userSettings   - User preferences
 */

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("team")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  conversations: defineTable({
    userId: v.string(),
    title: v.string(),
    pinned: v.boolean(),
    deletedAt: v.optional(v.number()),
    lastMessageAt: v.number(),
    messageCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_user", ["userId", "deletedAt"])
  .index("by_user_recent", ["userId", "lastMessageAt"])
  .index("by_user_pinned", ["userId", "pinned"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    userId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    toolName: v.optional(v.string()),
    toolResult: v.optional(v.any()),
    createdAt: v.number(),
  })
  .index("by_conversation", ["conversationId", "createdAt"])
  .index("by_user", ["userId", "createdAt"]),

  userSettings: defineTable({
    userId: v.string(),
    voice: v.optional(v.string()), // browser TTS voice name, "" = browser default
    language: v.optional(v.string()), // output/TTS language, e.g. "en-US"
    inputLanguage: v.optional(v.string()), // speech recognition language
    speechRate: v.optional(v.number()), // TTS playback rate
    geminiModel: v.optional(v.string()), // which Gemini model to use for chat
    autoSpeak: v.boolean(), // speak responses aloud
    voiceEnabled: v.boolean(), // voice mode on/off
    ttsProvider: v.optional(v.string()), // "elevenlabs" | "browser", legacy/manual field
    elevenlabsVoiceEn: v.optional(v.string()), // legacy ElevenLabs voice id field
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
});
