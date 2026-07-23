import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthedUserRow } from "./auth";
import { DEFAULT_SETTINGS } from "./lib";

/**
 * Per-user settings (voice, language, model, etc.).
 *
 * Lazily created: the first `update` call inserts a row seeded with
 * DEFAULT_SETTINGS; subsequent calls patch it. `get` returns defaults
 * (with a `pending` flag) if no row exists yet — the dashboard can
 * render with defaults immediately and write back on first change.
 */

/**
 * Get the current user's settings. Returns defaults if no row exists.
 * Safe for queries - won't throw if user row doesn't exist yet.
 */
export const get = query({
  args: {},
  handler: async (ctx) => {
    // Use getAuthedUserRow which doesn't throw if user is missing
    const { identity, user } = await getAuthedUserRow(ctx);
    
    // If no user row at all (shouldn't happen for authenticated users, but be safe)
    if (!user) {
      return {
        _id: null,
        userId: identity.subject,
        ...DEFAULT_SETTINGS,
        updatedAt: Date.now(),
        pending: true,
      };
    }

    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();

    if (existing) return existing;

    // No row yet — return defaults with a pending flag so the client
    // knows to POST on first change rather than treating the response
    // as a persisted row.
    return {
      _id: null,
      userId: identity.subject,
      ...DEFAULT_SETTINGS,
      updatedAt: Date.now(),
      pending: true,
    };
  },
});

/**
 * Patch settings. Creates the row on first call (lazy upsert).
 *
 * Any subset of fields may be passed — undefined fields are ignored.
 * This keeps the client code simple: `userSettings.update({ autoSpeak: false })`
 * doesn't require a round-trip to read the current row first.
 */
export const update = mutation({
  args: {
    voice: v.optional(v.string()),
    language: v.optional(v.string()),
    inputLanguage: v.optional(v.string()),
    speechRate: v.optional(v.number()),
    geminiModel: v.optional(v.string()),
    autoSpeak: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { identity } = await getAuthedUserRow(ctx);
    const now = Date.now();

    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();

    // Build the patch — only fields the client actually sent.
    const patch = { updatedAt: now };
    for (const [k, val] of Object.entries(args)) {
      if (val !== undefined) patch[k] = val;
    }

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }

    // First-time write: seed with DEFAULT_SETTINGS, then overlay the patch.
    return await ctx.db.insert("userSettings", {
      ...DEFAULT_SETTINGS,
      userId: identity.subject,
      ...patch,
    });
  },
});
