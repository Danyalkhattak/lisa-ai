import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Clerk webhook handlers — called from http.ts after Svix signature
 * verification. These are `internalMutation`s (not regular `mutation`s)
 * because they should only be callable from Convex's HTTP layer, never
 * directly from the client.
 *
 * Events handled:
 *   - user.created   → upsertUserFromClerk (insert)
 *   - user.updated   → upsertUserFromClerk (patch if exists)
 *   - user.deleted   → deleteUserFromClerk (cascade delete)
 */

/**
 * Insert or update a user row based on a Clerk webhook payload.
 * Idempotent — safe to call multiple times for the same `clerkId`.
 */
export const upsertUserFromClerk = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      imageUrl: args.imageUrl,
      plan: "free", // default tier — Stripe webhook upgrades later
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Permanently delete a user and all their data. Called when Clerk
 * fires `user.deleted`. Cascades to:
 *   - all conversations owned by the user
 *   - all messages in those conversations
 *   - the user's settings row
 *
 * This is irreversible. If you need retention / grace-period behavior,
 * add a `deletedAt` field to `users` and patch this handler accordingly.
 */
export const deleteUserFromClerk = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (!user) return; // already gone — nothing to do

    // Cascade: conversations → messages → settings → user
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", args.clerkId))
      .collect();

    for (const conv of conversations) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) =>
          q.eq("conversationId", conv._id),
        )
        .collect();
      for (const msg of messages) {
        await ctx.db.delete(msg._id);
      }
      await ctx.db.delete(conv._id);
    }

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.clerkId))
      .unique();
    if (settings) await ctx.db.delete(settings._id);

    await ctx.db.delete(user._id);
  },
});
