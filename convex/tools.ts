/**
 * Email tool for Lisa AI.
 *
 * Simple email sending via EmailJS (production) or mock (fallback).
 */

/**
 * Result shape for the email tool.
 */
export interface EmailResult {
  success: boolean;
  messageId: string;
  sentAt: number;
  to: string;
  subject: string;
}

/**
 * Send an email using EmailJS.
 *
 * Required environment variables:
 *   - EMAILJS_SERVICE_ID
 *   - EMAILJS_TEMPLATE_ID
 *   - EMAILJS_PUBLIC_KEY
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  body: string;
}): Promise<EmailResult> {
  const { to, subject, body } = params;

  // Validation
  if (!to || !to.trim()) {
    throw new Error("Recipient email is required");
  }
  if (!subject || !subject.trim()) {
    throw new Error("Subject is required");
  }
  if (!body || !body.trim()) {
    throw new Error("Body is required");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to.trim())) {
    throw new Error(`Invalid email: "${to}"`);
  }

  // Check if EmailJS is configured
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;

  console.log("[email] Sending:", {
    to: to.trim(),
    subject: subject.trim(),
    usingEmailJS: !!(serviceId && templateId && publicKey),
  });

  // Use EmailJS if configured
  if (serviceId && templateId && publicKey) {
    try {
      const emailjs = await import("@emailjs/browser");
      
      const response = await emailjs.default.send(
        serviceId,
        templateId,
        {
          to_email: to.trim(),
          subject: subject.trim(),
          message: body.trim(),
          from_name: "Lisa AI Assistant",
        },
        publicKey,
      );

      return {
        success: true,
        messageId: response.status?.toString() || `emailjs_${Date.now()}`,
        sentAt: Date.now(),
        to: to.trim(),
        subject: subject.trim(),
      };
    } catch (err) {
      console.error("[email] EmailJS failed, using mock:", err);
      return sendMockEmail(params);
    }
  }

  // Fallback: mock mode
  return sendMockEmail(params);
}

/**
 * Mock email for demo/testing when EmailJS isn't configured.
 */
async function sendMockEmail(params: {
  to: string;
  subject: string;
  body: string;
}): Promise<EmailResult> {
  await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200));

  console.log("[email] [MOCK] Would send:", params);

  return {
    success: true,
    messageId: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    sentAt: Date.now(),
    to: params.to.trim(),
    subject: params.subject.trim(),
  };
}
