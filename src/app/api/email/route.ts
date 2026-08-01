import { NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { apiError, requireApiUser } from "@/lib/api/helpers";
import { limitsFor } from "@/lib/billing/gating";
import { emailShell, sendEmail } from "@/lib/email";
import { resumeToPdfBuffer } from "@/lib/export/pdf";
import { safeFilename } from "@/lib/export/txt";
import { resumeDataSchema } from "@/lib/validation/resume";
import { z } from "zod";

const bodySchema = z.object({
  to: z.string().email(),
  resumeId: z.string().optional(),
  data: resumeDataSchema.optional(),
  accentColor: z.string().optional(),
  font: z.string().optional(),
  title: z.string().max(120).optional(),
});

export async function POST(req: Request) {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;

  const limits = limitsFor(user);
  if (!limits.allowExports.includes("email")) {
    return apiError("Email export is a Pro feature. Upgrade to unlock it.", 403);
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Invalid request body");
  const { to, resumeId, data, accentColor, font } = parsed.data;
  const title = parsed.data.title ?? "Resume";

  let resumeData = data;
  let settings = { accentColor, font };
  if (resumeId && !resumeData) {
    const resume = await prisma.resume.findFirst({ where: { id: resumeId, userId: user.id } });
    if (!resume) return apiError("Resume not found", 404);
    resumeData = resume.data as never;
    settings = { accentColor: resume.accentColor ?? undefined, font: resume.font ?? undefined };
  }
  if (!resumeData) return apiError("No resume provided");

  try {
    const buffer = await resumeToPdfBuffer(
      resumeData as never,
      settings.accentColor ?? "#2563eb",
      settings.font ?? "Inter",
    );
    const result = await sendEmail({
      to,
      subject: `Your resume — ${title}`,
      html: emailShell(`
        <h1 style="margin:0 0 8px;font-size:20px;color:#0f172a;">Your resume is attached</h1>
        <p style="color:#475569;font-size:15px;line-height:1.6;">Here's the ATS-safe PDF export of <strong>${title}</strong>, generated just for you.</p>
        <p style="color:#94a3b8;font-size:13px;">Good luck with the job hunt!</p>
      `),
      attachment: {
        filename: safeFilename(title, "pdf"),
        content: buffer,
        contentType: "application/pdf",
      },
    });

    if (!result.ok) return apiError(result.error ?? "Email failed to send", 502);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Email export failed", 500);
  }
}
