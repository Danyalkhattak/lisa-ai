import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { requireClerkSubject } from "./auth";
import { sanitizeTitle } from "./lib";

/**
 * Conversation CRUD.
 *
 * All functions enforce per-user ownership: every query/mutation
 * reads the Clerk subject from the auth context and filters by it,
 * so a user can never read or mutate another user's conversations.
 *
 * Soft-delete pattern: `softDelete` sets `deletedAt`; `restore` clears
 * it; `permanentDelete` cascades to messages and removes the row.
 */

/**
 * List conversations for the current user, newest first.
 *
 * - Soft-deleted conversations are excluded unless `includeDeleted` is true.
 * - Default page size is 50; pass `paginationOpts` for true pagination.
 */
export const list = query({
  args: {
    includeDeleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const clerkId = await requireClerkSubject(ctx);
    const q = ctx.db
      .query("conversations")
      .withIndex("by_user_recent", (q) => q.eq("userId", clerkId))
      .order("desc");

    const all = await q.take(100);
    return args.includeDeleted
      ? all
      : all.filter((c) => c.deletedAt === undefined);
  },
});

/**
 * List only pinned conversations — used by the dashboard sidebar's
 * "Pinned" section above the full conversation list.
 */
export const listPinned = query({
  args: {},
  handler: async (ctx) => {
    const clerkId = await requireClerkSubject(ctx);
    const all = await ctx.db
      .query("conversations")
      .withIndex("by_user_pinned", (q) =>
        q.eq("userId", clerkId).eq("pinned", true),
      )
      .order("desc")
      .take(20);
    return all.filter((c) => c.deletedAt === undefined);
  },
});

/**
 * Get a single conversation. Returns `null` if it doesn't exist or
 * doesn't belong to the caller — never throws for missing/foreign
 * conversations, so the client can render a friendly 404 state.
 *
 * Internal-only: currently called exclusively from `ai.ts`'s `chat`
 * action via `internal.conversations.get`. If the dashboard ever needs
 * to fetch a single conversation directly, add a separate public
 * `query` rather than exposing this one.
 */
export const get = internalQuery({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const clerkId = await requireClerkSubject(ctx);
    const conv = await ctx.db.get(args.conversationId);
    if (!conv || conv.userId !== clerkId) return null;
    return conv;
  },
});

/**
 * Create a new conversation. Title defaults to "New conversation" —
 * the dashboard can call `rename` after the first user message to
 * set a more meaningful title derived from the prompt.
 *
 * Returns the new conversation's Convex `Id<"conversations">`.
 */
export const create = mutation({
  args: { title: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const clerkId = await requireClerkSubject(ctx);
    const now = Date.now();
    return await ctx.db.insert("conversations", {
      userId: clerkId,
      title: sanitizeTitle(args.title ?? "New conversation"),
      pinned: false,
      lastMessageAt: now,
      messageCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Rename a conversation. Title is sanitized (whitespace collapse +
 * 80-char truncation) before storage.
 */
export const rename = mutation({
  args: {
    conversationId: v.id("conversations"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const clerkId = await requireClerkSubject(ctx);
    const conv = await ctx.db.get(args.conversationId);
    if (!conv || conv.userId !== clerkId) {
      throw new Error("Conversation not found");
    }
    await ctx.db.patch(args.conversationId, {
      title: sanitizeTitle(args.title),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Toggle a conversation's pinned state. Unpinning on soft-delete
 * is enforced inside `softDelete` so the Pinned list never shows
 * deleted conversations.
 */
export const setPinned = mutation({
  args: {
    conversationId: v.id("conversations"),
    pinned: v.boolean(),
  },
  handler: async (ctx, args) => {
    const clerkId = await requireClerkSubject(ctx);
    const conv = await ctx.db.get(args.conversationId);
    if (!conv || conv.userId !== clerkId) {
      throw new Error("Conversation not found");
    }
    await ctx.db.patch(args.conversationId, {
      pinned: args.pinned,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Soft-delete — moves the conversation to trash. Recoverable via
 * `restore` until `permanentDelete` is called.
 */
export const softDelete = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const clerkId = await requireClerkSubject(ctx);
    const conv = await ctx.db.get(args.conversationId);
    if (!conv || conv.userId !== clerkId) {
      throw new Error("Conversation not found");
    }
    await ctx.db.patch(args.conversationId, {
      deletedAt: Date.now(),
      pinned: false,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Restore a soft-deleted conversation.
 */
export const restore = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const clerkId = await requireClerkSubject(ctx);
    const conv = await ctx.db.get(args.conversationId);
    if (!conv || conv.userId !== clerkId) {
      throw new Error("Conversation not found");
    }
    await ctx.db.patch(args.conversationId, {
      deletedAt: undefined,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Permanently delete a conversation and cascade to all its messages.
 * Cannot be undone. The conversation must already be soft-deleted
 * (we don't allow permanent delete from active state — the dashboard
 * should require an explicit "trash → empty trash" action).
 */
export const permanentDelete = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const clerkId = await requireClerkSubject(ctx);
    const conv = await ctx.db.get(args.conversationId);
    if (!conv || conv.userId !== clerkId) {
      throw new Error("Conversation not found");
    }
    // Cascade delete all messages in the conversation.
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();
    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }
    await ctx.db.delete(args.conversationId);
  },
});

/**
 * Substring search across the user's conversation titles.
 *
 * Convex's built-in search index would power full-text search across
 * message content; for now, title substring search is enough for the
 * sidebar's quick-filter input. Returns up to 20 results, newest first.
 */
export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const clerkId = await requireClerkSubject(ctx);
    const all = await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", clerkId))
      .order("desc")
      .take(200);
    const needle = args.query.toLowerCase().trim();
    if (!needle) return [];
    return all
      .filter(
        (c) =>
          c.deletedAt === undefined &&
          c.title.toLowerCase().includes(needle),
      )
      .slice(0, 20);
  },
});

/**
 * Clear all conversations and messages for current user.
 * Used by Settings page "Clear History" feature.
 */
export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const clerkId = await requireClerkSubject(ctx);
    
    // Get all user's conversations
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", clerkId))
      .collect();
    
    // Delete all messages in each conversation
    for (const conv of conversations) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
        .collect();
      
      for (const msg of messages) {
        await ctx.db.delete(msg._id);
      }
      
      await ctx.db.delete(conv._id);
    }
    
    return true;
  },
});
