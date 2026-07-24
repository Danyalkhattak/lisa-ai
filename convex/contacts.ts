import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Contacts queries and mutations.
 */

// ==================== Queries ====================

/** List all contacts for current user */
export const list = query({
  args: { userId: v.optional(v.string()) }, // Accept userId from frontend
  handler: async (ctx, args) => {
    // Use provided userId or fall back to auth
    let userId = args.userId;
    if (!userId) {
      const identity = ctx.auth.getUserIdentity();
      if (!identity) return [];
      userId = identity.subject;
    }

    return await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

/** Get a single contact by ID */
export const get = query({
  args: { id: v.id("contacts") },
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.id);
    if (!contact) return null;

    // Verify ownership
    const userId = ctx.auth.getUserIdentity();
    if (!userId || contact.userId !== userId.subject) return null;

    return contact;
  },
});

/** Search contacts by name - simplified for voice commands */
export const searchContacts = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const identity = ctx.auth.getUserIdentity();
    if (!identity) return [];

    const allContacts = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    // Simple case-insensitive search
    const searchLower = args.query.toLowerCase();
    return allContacts.filter(
      (c) =>
        c.name.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower)
    );
  },
});

/** Search contacts by name */
export const search = query({
  args: { 
    query: v.string(),
    userId: v.optional(v.string()), // Accept userId from frontend
  },
  handler: async (ctx, args) => {
    // Use provided userId or fall back to auth
    let userId = args.userId;
    if (!userId) {
      const identity = ctx.auth.getUserIdentity();
      if (!identity) return [];
      userId = identity.subject;
    }

    const allContacts = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Simple case-insensitive search
    const searchLower = args.query.toLowerCase();
    return allContacts.filter(
      (c) =>
        c.name.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower)
    );
  },
});

// ==================== Mutations ====================

/** Create a new contact */
export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    userId: v.string(), // Accept userId from frontend (Clerk ID)
  },
  handler: async (ctx, args) => {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(args.email)) {
      throw new Error("Invalid email address");
    }

    // Check for duplicate
    const existing = await ctx.db
      .query("contacts")
      .withIndex("by_user_email", (q) =>
        q.eq("userId", args.userId).eq("email", args.email.trim().toLowerCase())
      )
      .first();

    if (existing) {
      throw new Error("Contact with this email already exists");
    }

    const id = await ctx.db.insert("contacts", {
      userId: args.userId,
      name: args.name.trim(),
      email: args.email.trim().toLowerCase(),
      createdAt: Date.now(),
    });

    return id;
  },
});

/** Update an existing contact */
export const update = mutation({
  args: {
    id: v.id("contacts"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId.subject) {
      throw new Error("Contact not found");
    }

    const updates: Record<string, any> = {};

    if (args.name !== undefined) {
      updates.name = args.name.trim();
    }
    if (args.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(args.email)) {
        throw new Error("Invalid email address");
      }
      updates.email = args.email.trim().toLowerCase();
    }

    await ctx.db.patch(args.id, updates);

    return args.id;
  },
});

/** Delete a contact */
export const remove = mutation({
  args: { id: v.id("contacts") },
  handler: async (ctx, args) => {
    const userId = ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId.subject) {
      throw new Error("Contact not found");
    }

    await ctx.db.delete(args.id);

    return true;
  },
});
