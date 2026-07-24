/**
 * Email action - sends email via EmailJS or mock.
 */

import { action } from "./_generated/server";
import { v } from "convex/values";
import { requireClerkSubject } from "./auth";
import { sendEmail } from "./tools";

export const send = action({
  args: {
    to: v.string(),
    subject: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const clerkId = await requireClerkSubject(ctx);
    
    console.log("[email] Sending email:", {
      userId: clerkId,
      to: args.to,
      subject: args.subject,
    });
    
    const result = await sendEmail({
      to: args.to,
      subject: args.subject,
      body: args.body,
    });
    
    return result;
  },
});
