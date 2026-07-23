/**
 * Auth helpers shared across every protected function file.
 *
 * IMPORTANT Convex architecture rule:
 * - **Queries** are READ-ONLY — they CANNOT call db.insert, db.patch, db.delete
 * - **Mutations** can read AND write
 * - **Actions** run in a separate environment (no direct db access)
 *
 * Because of this:
 * - `requireClerkSubject()` is safe for BOTH queries and mutations — it only reads
 * - `ensureUserExists()` is a MUTATION that creates the user row if missing
 * - The dashboard should call ensureUserExists once on mount, then all queries work
 */

/**
 * Read the Clerk identity from the current request. Throws if not
 * authenticated.
 */
export async function getAuthedUserIdentity(ctx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated. Sign in to continue.");
  }
  return identity;
}

/**
 * Read the Clerk identity AND look up the corresponding `users` row.
 * Returns `{ identity, user }` where `user` is `null` if the row
 * hasn't been created yet (webhook still in flight).
 *
 * This is SAFE for queries — it only reads.
 */
export async function getAuthedUserRow(ctx) {
  const identity = await getAuthedUserIdentity(ctx);
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();
  return { identity, user };
}

/**
 * Like `getAuthedUserRow`, but throws if the user row doesn't exist.
 * Use this in mutations that need to write user-scoped data.
 *
 * This is SAFE for queries and mutations — it only reads (throws if missing).
 */
export async function requireAuthedUser(ctx) {
  const { identity, user } = await getAuthedUserRow(ctx);
  if (!user) {
    throw new Error(
      `User ${identity.subject} not found in database. ` +
        "If this is a new account, the Clerk webhook may still be processing.",
    );
  }
  return { identity, user };
}

/**
 * Convenience: return just the Clerk subject string.
 * 
 * SAFE for queries — this version does NOT auto-create the user.
 * It simply returns the clerkId if authenticated, or throws if not.
 * 
 * If the user row doesn't exist yet, this STILL returns the clerkId
 * (so queries can filter by it). The query will just return empty results
 * until the user row is created via ensureUserExists mutation.
 */
export async function requireClerkSubject(ctx) {
  const identity = await getAuthedUserIdentity(ctx);
  return identity.subject;
}

/**
 * MUTATION: Ensure the current user has a row in the `users` table.
 * Creates one if missing (handles new signups before webhook fires).
 * 
 * Call this once from the client on dashboard mount.
 * After this returns successfully, all requireClerkSubject calls in queries
 * will find the user row.
 */
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const ensureUserExists = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await getAuthedUserIdentity(ctx);
    const clerkId = identity.subject;

    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (existing) {
      // User exists — update email/name if they changed in Clerk
      const now = Date.now();
      const updates: Record<string, unknown> = { updatedAt: now };
      
      if (identity.email && existing.email !== identity.email) {
        updates.email = identity.email;
      }
      if (identity.name && existing.name !== identity.name) {
        updates.name = identity.name;
      }
      if (identity.pictureUrl && existing.imageUrl !== identity.pictureUrl) {
        updates.imageUrl = identity.pictureUrl;
      }

      if (Object.keys(updates).length > 1) {
        await ctx.db.patch(existing._id, updates);
      }

      return existing._id;
    }

    // Create new user row
    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      clerkId,
      email: identity.email ?? "",
      name: identity.name ?? null,
      imageUrl: identity.pictureUrl ?? null,
      plan: "free",
      createdAt: now,
      updatedAt: now,
    });

    return userId;
  },
});
