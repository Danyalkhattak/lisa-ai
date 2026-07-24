import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthedUserRow, requireAuthedUser } from "./auth";

/**
 * User profile queries and mutations.
 *
 * The Clerk webhook (clerkWebhook.ts) is the primary writer of the
 * `users` table — it inserts on `user.created` and patches on
 * `user.updated`. These functions are read-mostly: `getMe` is the
 * main entry point the dashboard uses to render the current user,
 * and `updateProfile` exists only for app-local overrides (most
 * profile fields are managed in Clerk).
 */

/**
 * Get the current user's profile.
 *
 * Returns a "pending sync" shape if the Clerk webhook hasn't fired
 * yet (e.g. signup just completed) — the client can show a transient
 * loading state derived from the JWT identity while the row catches
 * up. This is intentional: blocking the entire dashboard on a
 * webhook round-trip would feel broken.
 */
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const { identity, user } = await getAuthedUserRow(ctx);
    if (!user) {
      return {
        _id: null,
        clerkId: identity.subject,
        email: identity.email ?? "",
        name: identity.name ?? null,
        imageUrl: identity.pictureUrl ?? null,
        plan: "free" /** default until webhook syncs */,
        pendingSync: true,
      };
    }
    return { ...user, pendingSync: false };
  },
});

/**
 * Update display name and/or avatar URL.
 *
 * NOTE: most profile fields should be edited in Clerk's <UserProfile />
 * component, which will fire `user.updated` and sync back here via the
 * webhook. This mutation is for app-local overrides only — e.g. a
 * "Lisa nickname" that's separate from the Clerk display name.
 */
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuthedUser(ctx);
    const now = Date.now();
    // Build the patch object conditionally — keep it loose-typed so
    // optional fields don't trip TS's structural inference.
    const patch = {
      updatedAt: now,
      ...(args.name !== undefined ? { name: args.name } : {}),
      ...(args.imageUrl !== undefined ? { imageUrl: args.imageUrl } : {}),
    };
    await ctx.db.patch(user._id, patch);
  },
});

/**
 * Manually set the user's plan.
 *
 * In production this is gated by Stripe webhooks (not built yet) —
 * the Stripe handler would call this mutation after verifying the
 * checkout session. Exposed here as a demo affordance so the
 * dashboard's "Upgrade" button can flip the plan without a backend.
 *
 * TODO (Section 10): gate this behind an admin role check, or replace
 * entirely with Stripe webhook handlers.
 */
export const setPlan = mutation({
  args: {
    plan: v.union(
      v.literal("free"),
      v.literal("pro"),
      v.literal("team"),
    ),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuthedUser(ctx);
    await ctx.db.patch(user._id, {
      plan: args.plan,
      updatedAt: Date.now(),
    });
  },
});
