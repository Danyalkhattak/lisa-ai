/**
 * Email action - REAL email sending via Resend API.
 * 
 * NO DEMO MODE - This actually sends emails.
 * 
 * Required Env Var:
 *   RESEND_API_KEY - Get free at https://resend.com
 * 
 * Optional Env Vars:
 *   EMAIL_FROM - Default sender (e.g., "Lisa AI <lisa@yourdomain.com>")
 */

import { action } from "./_generated/server";
import { v } from "convex/values";

export const send = action({
  args: {
    to: v.string(),
    subject: v.string(),
    body: v.string(),
    from: v.optional(v.string()),
    replyTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { to, subject, body, from, replyTo } = args;
    
    console.log("[Lisa AI] 📧 Sending REAL email:", {
      to,
      subject,
      bodyLength: body?.length,
      timestamp: new Date().toISOString(),
    });
    
    // Validate inputs
    if (!to || !to.trim()) {
      throw new Error("Recipient email is required");
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to.trim())) {
      throw new Error(`Invalid email address: "${to}"`);
    }
    
    if (!subject || !subject.trim()) {
      throw new Error("Email subject is required");
    }
    
    if (!body || !body.trim()) {
      throw new Error("Email body is required");
    }

    // Get Resend API key from environment
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey) {
      throw new Error(
        "Email service not configured. Set RESEND_API_KEY in Convex environment variables. " +
        "Get a free key at https://resend.com"
      );
    }

    // Determine sender address
    const defaultFrom = process.env.EMAIL_FROM || "Lisa AI <onboarding@resend.dev>";
    const senderEmail = from?.trim() || defaultFrom;

    // Send REAL email via Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: senderEmail,
        to: to.trim(),
        subject: subject.trim(),
        html: bodyToHtml(body.trim()),
        text: body.trim(),
        reply_to: replyTo?.trim() || undefined,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[Lisa AI] ❌ Resend API error:", result);
      throw new Error(
        result?.error?.message || 
        `Failed to send email: ${response.status} ${response.statusText}`
      );
    }

    console.log("[Lisa AI] ✅ Email sent successfully via Resend!", {
      id: result.id,
      to: to.trim(),
      subject: subject.trim(),
    });

    return {
      success: true,
      messageId: result.id,
      sentAt: Date.now(),
      to: to.trim(),
      subject: subject.trim(),
      provider: "resend",
    };
  },
});

/**
 * Convert plain text email body to HTML for better rendering.
 */
function bodyToHtml(text: string): string {
  // Escape HTML entities first
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  
  // Convert line breaks to <br> and wrap paragraphs
  const paragraphs = escaped
    .split("\n\n")
    .map(p => p.replace(/\n/g, "<br>"))
    .map(p => `<p style="margin: 0 0 1em 0; line-height: 1.6; color: #374151;">${p}</p>`)
    .join("");
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin: 0; padding: 20px; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="padding-bottom: 16px; margin-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
      <img src="https://cdn-icons-png.flaticon.com/512/8943/8943377.png" alt="Lisa AI" style="width: 32px; height: 32px;">
      <span style="margin-left: 8px; font-weight: 600; color: #7c3aed; font-size: 14px;">Lisa AI Voice Assistant</span>
    </div>
    ${paragraphs}
    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
      <p style="margin: 0;">This email was sent by Lisa AI Voice Assistant.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
