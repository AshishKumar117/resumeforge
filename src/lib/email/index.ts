import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const from = process.env.EMAIL_FROM ?? "ResumeForge <onboarding@resend.dev>";

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  attachment?: EmailAttachment;
}

/**
 * Send a transactional email. Falls back to a console log when Resend isn't
 * configured so the whole app works in local dev.
 */
export async function sendEmail(msg: EmailMessage): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!resend) {
    console.log(
      `[email:console] to=${msg.to} subject="${msg.subject}" attachment=${msg.attachment?.filename ?? "none"}`,
    );
    return { ok: true };
  }
  try {
    const { data, error } = await resend.emails.send({
      from,
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
      ...(msg.attachment
        ? {
            attachments: [
              {
                filename: msg.attachment.filename,
                content: msg.attachment.content,
                contentType: msg.attachment.contentType,
              },
            ],
          }
        : {}),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown email error" };
  }
}

const BRAND = {
  primary: "#2563eb",
  name: "ResumeForge",
};

/** Shared branded email shell. */
export function emailShell(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f6f7fb;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f7fb;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;">
        <tr><td align="center" style="padding-bottom:16px;">
          <span style="font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">${BRAND.name}</span>
        </td></tr>
        <tr><td style="background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          ${bodyHtml}
        </td></tr>
        <tr><td align="center" style="padding-top:20px;color:#94a3b8;font-size:12px;">
          ResumeForge · AI-powered ATS resume builder<br/>You're receiving this because you have an account or requested a link.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function primaryButton(href: string, label: string): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;"><tr><td align="center">
    <a href="${href}" style="display:inline-block;background:${BRAND.primary};color:#ffffff;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:10px;font-size:15px;">${label}</a>
  </td></tr></table>`;
}

export function verificationEmailHtml(link: string): string {
  return emailShell(`
    <h1 style="margin:0 0 8px;font-size:20px;color:#0f172a;">Verify your email</h1>
    <p style="color:#475569;font-size:15px;line-height:1.6;">Thanks for signing up for ${BRAND.name}. Confirm your email address to activate your account and start building ATS-ready resumes.</p>
    ${primaryButton(link, "Verify email address")}
    <p style="color:#94a3b8;font-size:13px;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
  `);
}

export function passwordResetEmailHtml(link: string): string {
  return emailShell(`
    <h1 style="margin:0 0 8px;font-size:20px;color:#0f172a;">Reset your password</h1>
    <p style="color:#475569;font-size:15px;line-height:1.6;">We received a request to reset the password for your ${BRAND.name} account. Click below to choose a new password.</p>
    ${primaryButton(link, "Reset password")}
    <p style="color:#94a3b8;font-size:13px;">This link expires in 24 hours and can only be used once. If you didn't request this, please ignore this email.</p>
  `);
}

export function resumeExportEmailHtml(link: string, resumeName: string): string {
  return emailShell(`
    <h1 style="margin:0 0 8px;font-size:20px;color:#0f172a;">Your resume is ready</h1>
    <p style="color:#475569;font-size:15px;line-height:1.6;">Here's the PDF export of <strong>${resumeName}</strong>, generated just for you.</p>
    ${primaryButton(link, "Download resume PDF")}
    <p style="color:#94a3b8;font-size:13px;">The link is temporary and will expire in 24 hours.</p>
  `);
}
