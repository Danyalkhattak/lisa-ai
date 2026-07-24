import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireClerkSubject } from "./auth";

/**
 * Message CRUD.
 *
 * Ownership is enforced on every function: the caller must own the
 * conversation that the message belongs to. Messages are denormalized
 * with `userId` (the Clerk subject) so we can filter by user without
 * a join — this matters for `stats.getUsage` and for free-tier quota
 * checks that will land with the Stripe integration.
 *
 * The Gemini-powered AI response flow (Section 6) will look like:
 *   1. Client calls `messages.send` to persist the user's message.
 *   2. Client calls a `messages.generateReply` action (Section 6)
 *      which streams Gemini's response and calls
 *      `messages.saveAssistantMessage` to persist it.
 *
 * For now, `saveAssistantMessage` exists so the action layer can be
 * dropped in without schema changes.
 */

/**
 * List messages in a conversation, oldest first.
 * The dashboard's transcript view uses this with infinite scroll —
 * pass `limit` to control the initial page size.
 */
export const list = query({
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

/**
 * Send a user message. Persists the message and bumps the parent
 * conversation's `lastMessageAt` + `messageCount` in a single
 * mutation so the sidebar's sort order updates atomically.
 *
 * Returns the new message's Convex `Id<"messages">`.
 *
 * NOTE: this does NOT trigger the AI response — that's an action
 * (Section 6) the client calls separately. Keeping them separate
 * means the user's message is in the DB even if Gemini is down.
 */
export const send = mutation({
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
 */
export const saveAssistantMessage = mutation({
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
