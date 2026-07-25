import { mutation, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireClerkSubject } from "./auth";

export const list = internalQuery({
  args: {
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const clerkId = await requireClerkSubject(ctx);
    const conv = await ctx.db.get(args.conversationId);
    if (!conv || conv.userId !== clerkId) {
      throw new Error("Conversation not found");
    }
    const limit = Math.min(args.limit ?? 100, 500);
    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .order("asc")
      .take(limit);
  },
});

export const send = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const clerkId = await requireClerkSubject(ctx);
    const conv = await ctx.db.get(args.conversationId);
    if (!conv || conv.userId !== clerkId) {
      throw new Error("Conversation not found");
    }
    const content = args.content.trim();
    if (!content) {
      throw new Error("Message content cannot be empty");
    }

    const now = Date.now();
    const msgId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      userId: clerkId,
      role: "user",
      content,
      createdAt: now,
    });

    await ctx.db.patch(args.conversationId, {
      lastMessageAt: now,
      messageCount: conv.messageCount + 1,
      updatedAt: now,
    });

    return msgId;
  },
});

/**
 * Persist an assistant reply. Called by the AI response action
 * (Section 6) after Gemini returns a reply. `toolName` + `toolResult`
 * are set when the assistant called a tool (weather, email, search,
 * summary) — the dashboard uses these to render structured result
 * cards instead of plain text.
 *
 * Internal-only: called from `ai.ts`'s `chat` action after Gemini
 * returns a reply.
 */
export const saveAssistantMessage = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    toolName: v.optional(v.string()),
    toolResult: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const clerkId = await requireClerkSubject(ctx);
    const conv = await ctx.db.get(args.conversationId);
    if (!conv || conv.userId !== clerkId) {
      throw new Error("Conversation not found");
    }

    const now = Date.now();
    const msgId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      userId: clerkId,
      role: "assistant",
      content: args.content,
      toolName: args.toolName,
      toolResult: args.toolResult,
      createdAt: now,
    });

    await ctx.db.patch(args.conversationId, {
      lastMessageAt: now,
      messageCount: conv.messageCount + 1,
      updatedAt: now,
    });

    return msgId;
  },
});

/**
 * Delete a single message. The conversation's `messageCount` is
 * decremented (clamped at 0). Caller must own the message.
 */
export const remove = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const clerkId = await requireClerkSubject(ctx);
    const msg = await ctx.db.get(args.messageId);
    if (!msg || msg.userId !== clerkId) {
      throw new Error("Message not found");
    }
    await ctx.db.delete(args.messageId);

    const conv = await ctx.db.get(msg.conversationId);
    if (conv) {
      await ctx.db.patch(msg.conversationId, {
        messageCount: Math.max(0, conv.messageCount - 1),
        updatedAt: Date.now(),
      });
    }
  },
});

/**
 * Clear all messages in a conversation but keep the conversation
 * shell (title, pinned state, etc.). Useful for "Start fresh" in
 * the dashboard's conversation menu.
 */
export const clear = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const clerkId = await requireClerkSubject(ctx);
    const conv = await ctx.db.get(args.conversationId);
    if (!conv || conv.userId !== clerkId) {
      throw new Error("Conversation not found");
    }
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();
    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }
    await ctx.db.patch(args.conversationId, {
      messageCount: 0,
      lastMessageAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
