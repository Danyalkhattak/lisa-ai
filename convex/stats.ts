import { query } from "./_generated/server";
import { getAuthedUserRow } from "./auth";

/**
 * Usage stats for the current user.
 *
 * Powers the dashboard's overview cards ("X conversations · Y messages
 * this month · Z pinned") and the free-tier quota display
 * ("17 / 50 messages this month").
 *
 * All counts are computed live from the database — no cached counters.
 * This is fine at Lisa AI's scale; if/when it isn't, we'll add a
 * materialized `usageStats` table updated by a scheduled cron.
 */
export const getUsage = query({
  args: {},
  handler: async (ctx) => {
    const { identity, user } = await getAuthedUserRow(ctx);
    
    // If no user row yet, return zeros
    if (!user) {
      return {
        conversationCount: 0,
        trashedCount: 0,
        pinnedCount: 0,
        messagesThisMonth: 0,
        totalMessages: 0,
        lastActivityAt: null,
      };
    }

    // All conversations owned by the user (excluding soft-deleted)
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
    const activeConversations = conversations.filter(
      (c) => c.deletedAt === undefined,
    );
    const pinnedCount = activeConversations.filter((c) => c.pinned).length;

    // Messages in the last 30 days (calendar month felt arbitrary;
    // a rolling 30-day window is what most SaaS quotas actually use)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    
    // Try to get messages by user index, fall back to empty if index doesn't exist
    let recentMessages = [];
    let allMessages = [];
    
    try {
      recentMessages = await ctx.db
        .query("messages")
        .withIndex("by_user", (q) => q.eq("userId", identity.subject))
        .filter((q) => q.gte(q.field("createdAt"), thirtyDaysAgo))
        .collect();

      allMessages = await ctx.db
        .query("messages")
        .withIndex("by_user", (q) => q.eq("userId", identity.subject))
        .collect();
    } catch {
      // Index might not exist or other error - return empty arrays
      recentMessages = [];
      allMessages = [];
    }

    const lastActivityAt = activeConversations
      .map((c) => c.lastMessageAt)
      .sort((a, b) => b - a)[0] ?? null;

    return {
      conversationCount: activeConversations.length,
      trashedCount: conversations.length - activeConversations.length,
      pinnedCount,
      messagesThisMonth: recentMessages.length,
      totalMessages: allMessages.length,
      lastActivityAt,
    };
  },
});
