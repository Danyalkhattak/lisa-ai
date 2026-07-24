import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook } from "svix";

const http = httpRouter();

/**
 * Clerk webhook — receives user.created, user.updated, user.deleted events.
 *
 * Verification:
 *   1. Reads CLERK_WEBHOOK_SECRET from Convex env (set via
 *      `npx convex env add CLERK_WEBHOOK_SECRET`).
 *   2. Verifies the Svix signature in the `svix-id`, `svix-timestamp`,
 *      and `svix-signature` headers against the raw request body.
 *   3. Dispatches to the appropriate internal mutation in clerkWebhook.ts.
 *
 * Setup (one-time):
 *   - In Clerk dashboard → Webhooks → Add endpoint, point at:
 *       https://<your-convex-deployment>.convex.site/clerk-users-webhook
 *   - Subscribe to: user.created, user.updated, user.deleted
 *   - Copy the signing secret and run:
 *       npx convex env add CLERK_WEBHOOK_SECRET
 */
http.route({
  path: "/clerk-users-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    let event;
    try {
      event = await verifyClerkWebhook(request);
    } catch (err) {
      console.error("[clerk-webhook] verification failed:", err.message);
      return new Response(err.message, { status: 400 });
    }

    if (!event) {
      return new Response("Invalid webhook signature", { status: 401 });
    }

    const eventType = event.type;
    const data = event.data;

    try {
      switch (eventType) {
        case "user.created":
        case "user.updated": {
          await ctx.runMutation(internal.clerkWebhook.upsertUserFromClerk, {
            clerkId: data.id,
            email:
              data.email_addresses?.[0]?.email_address ??
              (data.email ?? ""),
            name:
              [data.first_name, data.last_name].filter(Boolean).join(" ") ||
              data.username ||
              undefined,
            imageUrl: data.image_url,
          });
          break;
        }
        case "user.deleted": {
          await ctx.runMutation(internal.clerkWebhook.deleteUserFromClerk, {
            clerkId: data.id,
          });
          break;
        }
        default:
          // Silently ignore events we don't care about (session.created,
          // organization.updated, etc.) — Clerk sends a lot of these.
          break;
      }
      return new Response(null, { status: 200 });
    } catch (err) {
      console.error("[clerk-webhook] handler error:", err);
      return new Response("Internal error", { status: 500 });
    }
  }),
});

/**
 * Verify the incoming request is genuinely from Clerk using Svix.
 * Returns the parsed event payload on success, `null` on bad signature,
 * and throws on misconfiguration (missing secret, missing headers).
 */
async function verifyClerkWebhook(request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error(
      "CLERK_WEBHOOK_SECRET is not set. Run `npx convex env add CLERK_WEBHOOK_SECRET`.",
    );
  }

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    throw new Error("Missing required Svix headers");
  }

  // Clone and parse the body — we need the raw string for verification.
  const payload = await request.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(webhookSecret);
  try {
    return wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch {
    return null;
  }
}

/**
 * AI Chat HTTP Endpoint.
 *
 * Provides a REST-style endpoint for AI chat that can be called from
 * any HTTP client (useful for integrations, webhooks, or non-Convex clients).
 *
 * POST /ai/chat
 * Body: { conversationId: string, message: string }
 * Response: { content: string, toolName?: string, toolResult?: object }
 *
 * Authentication: Requires a valid Convex auth token (Authorization header)
 * or Clerk session token.
 */
http.route({
  path: "/ai/chat",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Verify authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Parse request body
    let body: { conversationId?: string; message?: string };
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Validate required fields
    if (!body.conversationId || !body.message) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: conversationId, message",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Validate conversation ID format (basic check)
    if (!body.conversationId.startsWith("conversations_")) {
      return new Response(
        JSON.stringify({ error: "Invalid conversation ID format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    try {
      // Convert string ID to Convex ID and call the chat action
      const result = await ctx.runAction(internal.ai.chat, {
        conversationId: body.conversationId as any,
        message: body.message.trim(),
      });

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("[http:/ai/chat] Error:", err);
      
      const errorMessage =
        err instanceof Error ? err.message : "Internal server error";
      const statusCode =
        errorMessage.includes("not found") ? 404 :
        errorMessage.includes("Unauthorized") || errorMessage.includes("authenticated") ? 401 : 500;

      return new Response(
        JSON.stringify({ error: errorMessage }),
        {
          status: statusCode,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }),
});

/**
 * AI Health Check Endpoint.
 *
 * Simple endpoint to verify the AI service is configured and responding.
 * Useful for monitoring and debugging deployment issues.
 *
 * GET /ai/health
 * Response: { status: "ok", model: string | null, configured: boolean }
 */
http.route({
  path: "/ai/health",
  method: "GET",
  handler: httpAction(async (_ctx, _request) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const configured = !!apiKey;
    
    return new Response(
      JSON.stringify({
        status: configured ? "ok" : "missing_config",
        model: "gemini-2.0-flash",
        configured,
        timestamp: new Date().toISOString(),
      }),
      {
        status: configured ? 200 : 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }),
});

export default http;
