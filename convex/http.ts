import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook } from "svix";
import { speakStream } from "./ttsStream";

/**
 * HTTP routes for Convex. Currently just the Clerk webhook, which
 * keeps the `users` table in sync with Clerk (see clerkWebhook.ts).
 *
 * Setup (required for this route to work):
 *   1. In the Clerk dashboard, add a webhook endpoint pointing at:
 *        https://<your-convex-deployment>.convex.site/clerk-webhook
 *   2. Subscribe it to: user.created, user.updated, user.deleted
 *   3. Copy the "Signing Secret" Clerk shows you and set it with:
 *        npx convex env set CLERK_WEBHOOK_SECRET whsec_xxx
 *
 * Until this is configured, new users are still synced on first
 * login via `auth.ensureUserExists` (called client-side on mount),
 * so sign-up/sign-in keeps working either way — this webhook just
 * keeps profile edits and deletions in sync in near-real-time.
 */

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    if (!secret) {
      console.error(
        "[clerk-webhook] CLERK_WEBHOOK_SECRET is not set — run " +
          "`npx convex env set CLERK_WEBHOOK_SECRET whsec_...`",
      );
      return new Response("Webhook secret not configured", { status: 500 });
    }

    const payload = await request.text();
    const svixHeaders = {
      "svix-id": request.headers.get("svix-id") ?? "",
      "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
      "svix-signature": request.headers.get("svix-signature") ?? "",
    };

    let event;
    try {
      const wh = new Webhook(secret);
      event = wh.verify(payload, svixHeaders);
    } catch (err) {
      console.error("[clerk-webhook] Signature verification failed:", err);
      return new Response("Invalid signature", { status: 400 });
    }

    const eventType = event.type;
    const data = event.data ?? {};

    try {
      if (eventType === "user.created" || eventType === "user.updated") {
        const email = data.email_addresses?.[0]?.email_address ?? "";
        const name =
          [data.first_name, data.last_name].filter(Boolean).join(" ") ||
          undefined;
        const imageUrl = data.image_url || undefined;

        await ctx.runMutation(internal.clerkWebhook.upsertUserFromClerk, {
          clerkId: data.id,
          email,
          name,
          imageUrl,
        });
      } else if (eventType === "user.deleted") {
        if (data.id) {
          await ctx.runMutation(internal.clerkWebhook.deleteUserFromClerk, {
            clerkId: data.id,
          });
        }
      }
      // Other event types are ignored — return 200 so Clerk doesn't retry.
    } catch (err) {
      console.error(`[clerk-webhook] Failed to handle ${eventType}:`, err);
      return new Response("Internal error handling webhook", { status: 500 });
    }

    return new Response(null, { status: 200 });
  }),
});

/**
 * Streaming ElevenLabs TTS (see convex/tts.ts for the handler and full
 * explanation). Exposed as an HTTP action — rather than a normal
 * Convex action reached via useAction — specifically so the response
 * body can be a live stream that the browser starts playing before
 * it's fully downloaded.
 *
 * The OPTIONS route below just answers the browser's CORS preflight
 * (triggered by the POST route's JSON content-type + Authorization
 * header); the actual request is handled by the POST route.
 */
http.route({
  path: "/tts-stream",
  method: "POST",
  handler: speakStream,
});

http.route({
  path: "/tts-stream",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }),
});

export default http;
